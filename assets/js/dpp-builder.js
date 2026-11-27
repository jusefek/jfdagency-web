(function () {
  'use strict';

  // Compact ISO/IEC 18004 QR Code generator (Byte mode, EC Level M, Versions 1..10)
  var QR = (function () {
    var EXP = new Array(512);
    var LOG = new Array(256);
    for (var i = 0, x = 1; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 256) x ^= 285;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];

    function gfMul(a, b) {
      return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
    }

    function rsGenPoly(deg) {
      var poly = [1];
      for (var i = 0; i < deg; i++) {
        var next = new Array(poly.length + 1).fill(0);
        for (var j = 0; j < poly.length; j++) {
          next[j] ^= poly[j];
          next[j + 1] ^= gfMul(poly[j], EXP[i]);
        }
        poly = next;
      }
      return poly;
    }

    function rsRemainder(data, ecLen) {
      var gen = rsGenPoly(ecLen);
      var res = data.slice().concat(new Array(ecLen).fill(0));
      for (var i = 0; i < data.length; i++) {
        var factor = res[i];
        if (factor !== 0) {
          for (var j = 0; j < gen.length; j++) {
            res[i + j] ^= gfMul(gen[j], factor);
          }
        }
      }
      return res.slice(data.length);
    }

    // [version, totalCodewords, ecPerBlock, numBlocks, alignCenters] for EC level M
    var VERSIONS = [
      null,
      [1, 26, 10, 1, []],
      [2, 44, 16, 1, [6, 18]],
      [3, 70, 26, 1, [6, 22]],
      [4, 100, 18, 2, [6, 26]],
      [5, 134, 24, 2, [6, 30]],
      [6, 172, 16, 4, [6, 34]],
      [7, 196, 18, 4, [6, 22, 38]],
      [8, 242, 22, 4, [6, 24, 42]],
      [9, 292, 22, 5, [6, 26, 46]],
      [10, 346, 26, 5, [6, 28, 50]]
    ];

    function utf8Bytes(str) {
      var out = [];
      for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 128) out.push(c);
        else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
        else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
      }
      return out;
    }

    function encode(text) {
      var bytes = utf8Bytes(text);
      var ver = 1;
      var spec = null;
      for (var v = 1; v < VERSIONS.length; v++) {
        var s = VERSIONS[v];
        var dataCap = s[1] - s[2] * s[3];
        var overhead = v <= 9 ? 2 : 3;
        if (bytes.length + overhead <= dataCap) {
          ver = v;
          spec = s;
          break;
        }
      }
      if (!spec) {
        bytes = bytes.slice(0, 200);
        ver = 10;
        spec = VERSIONS[10];
      }

      var totalCW = spec[1];
      var ecPerBlock = spec[2];
      var numBlocks = spec[3];
      var dataCW = totalCW - ecPerBlock * numBlocks;

      // Build bit stream: mode 0100 (byte), length, data, terminator, padding
      var bits = [];
      function pushBits(val, len) {
        for (var b = len - 1; b >= 0; b--) bits.push((val >> b) & 1);
      }
      pushBits(4, 4);
      pushBits(bytes.length, ver <= 9 ? 8 : 16);
      for (var i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);
      for (var t = 0; t < 4 && bits.length < dataCW * 8; t++) bits.push(0);
      while (bits.length % 8 !== 0) bits.push(0);

      var data = [];
      for (var k = 0; k < bits.length; k += 8) {
        var byteVal = 0;
        for (var b = 0; b < 8; b++) byteVal = (byteVal << 1) | bits[k + b];
        data.push(byteVal);
      }
      var pad = [236, 17];
      var pIdx = 0;
      while (data.length < dataCW) {
        data.push(pad[pIdx % 2]);
        pIdx++;
      }

      // Split into blocks and interleave
      var shortBlockLen = Math.floor(dataCW / numBlocks);
      var longBlocks = dataCW % numBlocks;
      var shortBlocks = numBlocks - longBlocks;
      var dataBlocks = [];
      var ecBlocks = [];
      var offset = 0;
      for (var blk = 0; blk < numBlocks; blk++) {
        var len = shortBlockLen + (blk >= shortBlocks ? 1 : 0);
        var slice = data.slice(offset, offset + len);
        offset += len;
        dataBlocks.push(slice);
        ecBlocks.push(rsRemainder(slice, ecPerBlock));
      }

      var codewords = [];
      var maxDataLen = shortBlockLen + (longBlocks > 0 ? 1 : 0);
      for (var c = 0; c < maxDataLen; c++) {
        for (var b1 = 0; b1 < numBlocks; b1++) {
          if (c < dataBlocks[b1].length) codewords.push(dataBlocks[b1][c]);
        }
      }
      for (var e = 0; e < ecPerBlock; e++) {
        for (var b2 = 0; b2 < numBlocks; b2++) {
          codewords.push(ecBlocks[b2][e]);
        }
      }

      // Matrix setup
      var size = ver * 4 + 17;
      var mod = Array.from({ length: size }, function () { return new Array(size).fill(0); });
      var isFunc = Array.from({ length: size }, function () { return new Array(size).fill(false); });

      function setMod(r, c, val) {
        if (r >= 0 && r < size && c >= 0 && c < size) {
          mod[r][c] = val ? 1 : 0;
          isFunc[r][c] = true;
        }
      }

      function drawFinder(r, c) {
        for (var dr = -1; dr <= 7; dr++) {
          for (var dc = -1; dc <= 7; dc++) {
            var rr = r + dr, cc = c + dc;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
            var dark =
              (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
              (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
              (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
            setMod(rr, cc, dark);
          }
        }
      }

      drawFinder(0, 0);
      drawFinder(0, size - 7);
      drawFinder(size - 7, 0);

      // Timing patterns
      for (var tp = 8; tp < size - 8; tp++) {
        setMod(6, tp, tp % 2 === 0);
        setMod(tp, 6, tp % 2 === 0);
      }

      // Alignment patterns
      var centers = spec[4];
      for (var a1 = 0; a1 < centers.length; a1++) {
        for (var a2 = 0; a2 < centers.length; a2++) {
          var cr = centers[a1], cc = centers[a2];
          if (isFunc[cr][cc]) continue;
          for (var dr2 = -2; dr2 <= 2; dr2++) {
            for (var dc2 = -2; dc2 <= 2; dc2++) {
              setMod(cr + dr2, cc + dc2, Math.max(Math.abs(dr2), Math.abs(dc2)) !== 1);
            }
          }
        }
      }

      // Dark module & reserve format info
      setMod(size - 8, 8, 1);
      for (var fi = 0; fi < 9; fi++) {
        if (fi !== 6) {
          isFunc[8][fi] = true;
          isFunc[fi][8] = true;
        }
      }
      for (var fi2 = 0; fi2 < 8; fi2++) {
        isFunc[8][size - 1 - fi2] = true;
        isFunc[size - 1 - fi2][8] = true;
      }

      // Version info for ver >= 7
      if (ver >= 7) {
        var rem = ver;
        for (var vi = 0; vi < 12; vi++) rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
        var vBits = (ver << 12) | rem;
        for (var vb = 0; vb < 18; vb++) {
          var bit = (vBits >> vb) & 1;
          var vr = Math.floor(vb / 3);
          var vc = size - 11 + (vb % 3);
          setMod(vr, vc, bit);
          setMod(vc, vr, bit);
        }
      }

      // Place data bits with mask 0 ((r + c) % 2 === 0)
      var bitIdx = 0;
      var totalBits = codewords.length * 8;
      var upward = true;
      for (var col = size - 1; col >= 1; col -= 2) {
        if (col === 6) col = 5;
        for (var step = 0; step < size; step++) {
          var row = upward ? size - 1 - step : step;
          for (var dc3 = 0; dc3 < 2; dc3++) {
            var cc3 = col - dc3;
            if (isFunc[row][cc3]) continue;
            var dBit = 0;
            if (bitIdx < totalBits) {
              dBit = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            if ((row + cc3) % 2 === 0) dBit ^= 1;
            mod[row][cc3] = dBit;
          }
        }
        upward = !upward;
      }

      // Format info for EC Level M (00) + Mask 0 (000) -> 00000 -> BCH + mask 0x5412 = 0x5412
      var fmtBits = 0x5412;
      for (var f = 0; f <= 5; f++) mod[8][f] = (fmtBits >> (14 - f)) & 1;
      mod[8][7] = (fmtBits >> 8) & 1;
      mod[8][8] = (fmtBits >> 7) & 1;
      mod[7][8] = (fmtBits >> 6) & 1;
      for (var f2 = 9; f2 < 15; f2++) mod[14 - f2][8] = (fmtBits >> (14 - f2)) & 1;
      for (var f3 = 0; f3 < 8; f3++) mod[size - 1 - f3][8] = (fmtBits >> (14 - f3)) & 1;
      for (var f4 = 8; f4 < 15; f4++) mod[8][size - 15 + f4] = (fmtBits >> (14 - f4)) & 1;

      return { size: size, mod: mod };
    }

    function toSvg(text) {
      var qr = encode(text);
      var quiet = 4;
      var dim = qr.size + quiet * 2;
      var paths = [];
      for (var r = 0; r < qr.size; r++) {
        for (var c = 0; c < qr.size; c++) {
          if (qr.mod[r][c]) {
            paths.push('M' + (c + quiet) + ',' + (r + quiet) + 'h1v1h-1z');
          }
        }
      }
      return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" width="180" height="180" shape-rendering="crispEdges">' +
        '<rect width="100%" height="100%" fill="#ffffff"/>' +
        '<path d="' + paths.join('') + '" fill="#0f172a"/>' +
        '</svg>'
      );
    }

    return { toSvg: toSvg };
  })();

  function getVal(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    var v = (el.value || '').trim();
    return v || fallback;
  }

  function buildData() {
    var lang = document.documentElement.lang === 'en' ? 'en' : 'es';
    var name = getVal('dpp-name', lang === 'en' ? 'Li-Ion E-Bike Battery Pack 48V' : 'Batería Li-Ion E-Bike 48V');
    var gtin = getVal('dpp-gtin', '08412345678905');
    var cat = getVal('dpp-cat', lang === 'en' ? 'Batteries (Mandatory Feb 2027)' : 'Baterías (Obligatorio feb. 2027)');
    var origin = getVal('dpp-origin', lang === 'en' ? 'Germany (EU)' : 'España (UE)');
    var recycled = getVal('dpp-recycled', '32');
    var repair = getVal('dpp-repair', '8.4');
    var operator = getVal('dpp-operator', 'Nordic Mobility GmbH · Industriestr. 14, Berlin (dpp@nordicmobility.eu)');
    var eol = getVal(
      'dpp-eol',
      lang === 'en'
        ? 'Do not dispose in household waste. Return to certified EU battery collection point.'
        : 'No desechar con residuos domésticos. Entregar en punto autorizado de recogida de baterías UE.'
    );
    var cleanGtin = gtin.replace(/[^A-Za-z0-9\-]/g, '') || '08412345678905';
    var gs1Url = 'https://jfdagency.com/' + (lang === 'en' ? 'en/' : '') + 'dpp/01/' + encodeURIComponent(cleanGtin);

    return {
      lang: lang,
      name: name,
      gtin: gtin,
      cat: cat,
      origin: origin,
      recycled: recycled,
      repair: repair,
      operator: operator,
      eol: eol,
      gs1Url: gs1Url
    };
  }

  function buildJsonLd(d) {
    return {
      '@context': ['https://schema.org', 'https://espr.europa.eu/dpp/v1'],
      '@type': 'DigitalProductPassport',
      regulation: 'Regulation (EU) 2024/1781 (ESPR)',
      gs1DigitalLink: d.gs1Url,
      product: {
        name: d.name,
        gtinOrSku: d.gtin,
        esprCategory: d.cat,
        countryOfOrigin: d.origin
      },
      sustainability: {
        recycledMaterialPercent: Number(d.recycled) || 0,
        repairabilityScore: Number(d.repair) || 0,
        repairabilityScale: '1-10',
        endOfLifeInstructions: d.eol
      },
      euEconomicOperator: d.operator,
      issuedAt: new Date().toISOString()
    };
  }

  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    var d = buildData();
    var map = {
      'out-dpp-name': d.name,
      'out-dpp-gtin': d.gtin,
      'out-dpp-cat': d.cat,
      'out-dpp-origin': d.origin,
      'out-dpp-recycled': d.recycled + '%',
      'out-dpp-repair': d.repair + ' / 10',
      'out-dpp-operator': d.operator,
      'out-dpp-eol': d.eol,
      'out-dpp-link': d.gs1Url
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });

    var qrHost = document.getElementById('out-dpp-qr');
    if (qrHost) {
      qrHost.innerHTML = QR.toSvg(d.gs1Url);
    }
  }

  function init() {
    var ids = ['dpp-name', 'dpp-gtin', 'dpp-cat', 'dpp-origin', 'dpp-recycled', 'dpp-repair', 'dpp-operator', 'dpp-eol'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', render);
        el.addEventListener('change', render);
      }
    });

    var btnQr = document.getElementById('btn-dl-qr');
    if (btnQr) {
      btnQr.addEventListener('click', function () {
        var d = buildData();
        downloadFile('safeguard-dpp-qr.svg', QR.toSvg(d.gs1Url), 'image/svg+xml;charset=utf-8');
      });
    }

    var btnJson = document.getElementById('btn-dl-json');
    if (btnJson) {
      btnJson.addEventListener('click', function () {
        var d = buildData();
        downloadFile('safeguard-dpp-espr.json', JSON.stringify(buildJsonLd(d), null, 2), 'application/ld+json;charset=utf-8');
      });
    }

    var btnHtml = document.getElementById('btn-dl-html');
    if (btnHtml) {
      btnHtml.addEventListener('click', function () {
        var d = buildData();
        var svg = QR.toSvg(d.gs1Url);
        var htmlDoc =
          '<!DOCTYPE html><html lang="' + d.lang + '"><head><meta charset="UTF-8"><title>EU DPP - ' + escapeHtml(d.name) + '</title>' +
          '<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:24px auto;padding:20px;color:#0f172a;border:1px solid #cbd5e1;border-radius:12px;}' +
          'h1{font-size:20px;margin:0 0 8px;}table{width:100%;border-collapse:collapse;margin-top:14px;}td{padding:8px;border-bottom:1px solid #e2e8f0;font-size:14px;}' +
          'td:first-child{font-weight:700;width:40%;color:#334155;}.qr{margin-top:16px;text-align:center;}</style></head><body>' +
          '<div style="font-size:12px;color:#059669;font-weight:700;">EU DIGITAL PRODUCT PASSPORT · ESPR (EU) 2024/1781</div>' +
          '<h1>' + escapeHtml(d.name) + '</h1>' +
          '<table>' +
          '<tr><td>GTIN / SKU</td><td>' + escapeHtml(d.gtin) + '</td></tr>' +
          '<tr><td>ESPR Category</td><td>' + escapeHtml(d.cat) + '</td></tr>' +
          '<tr><td>Origin</td><td>' + escapeHtml(d.origin) + '</td></tr>' +
          '<tr><td>Recycled Content</td><td>' + escapeHtml(d.recycled) + '%</td></tr>' +
          '<tr><td>Repairability</td><td>' + escapeHtml(d.repair) + ' / 10</td></tr>' +
          '<tr><td>EU Economic Operator</td><td>' + escapeHtml(d.operator) + '</td></tr>' +
          '<tr><td>End-of-Life</td><td>' + escapeHtml(d.eol) + '</td></tr>' +
          '<tr><td>GS1 Digital Link</td><td>' + escapeHtml(d.gs1Url) + '</td></tr>' +
          '</table><div class="qr">' + svg + '</div></body></html>';
        downloadFile('safeguard-dpp-passport.html', htmlDoc, 'text/html;charset=utf-8');
      });
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
