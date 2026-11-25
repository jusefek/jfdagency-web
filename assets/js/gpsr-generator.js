(() => {
  const LABELS = {
    es: {
      title: "Seguridad del producto y cumplimiento UE (GPSR)",
      mfg: "Fabricante",
      eu: "Persona Responsable en la UE",
      safety: "Advertencias de seguridad e instrucciones",
      ce: "Conformidad CE verificada (Reglamento UE 2023/988)",
      contact: "Contacto",
    },
    en: {
      title: "Product Safety & EU Compliance (GPSR)",
      mfg: "Manufacturer",
      eu: "EU Responsible Person",
      safety: "Safety Warnings & Instructions",
      ce: "CE Conformity Verified (Regulation EU 2023/988)",
      contact: "Contact",
    },
    de: {
      title: "Produktsicherheit & EU-Konformität (GPSR)",
      mfg: "Hersteller",
      eu: "Verantwortliche Person in der EU",
      safety: "Sicherheitshinweise und Anweisungen",
      ce: "CE-Konformität bestätigt (Verordnung EU 2023/988)",
      contact: "Kontakt",
    },
    fr: {
      title: "Sécurité du produit et conformité UE (GPSR)",
      mfg: "Fabricant",
      eu: "Personne responsable dans l’UE",
      safety: "Avertissements de sécurité et instructions",
      ce: "Conformité CE vérifiée (Règlement UE 2023/988)",
      contact: "Contact",
    },
  };

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nl2br(str) {
    return esc(str).replace(/\r?\n/g, "<br />");
  }

  function buildBlockHtml() {
    const lang = document.getElementById("lang").value;
    const t = LABELS[lang] || LABELS.es;
    const mfgName = document.getElementById("mfgName").value.trim();
    const mfgAddr = document.getElementById("mfgAddr").value.trim();
    const mfgEmail = document.getElementById("mfgEmail").value.trim();
    const euName = document.getElementById("euName").value.trim();
    const euAddr = document.getElementById("euAddr").value.trim();
    const euEmail = document.getElementById("euEmail").value.trim();
    const safety = document.getElementById("safety").value.trim();
    const ceMark = document.getElementById("ceMark").checked;

    return `<div class="sg-gpsr-box" data-sg-gpsr="true" style="margin:16px 0;padding:16px;border:1px solid #dcdcde;border-radius:8px;background:#f9fafb;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#1d2327;">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">
    <strong style="font-size:15px;color:#0f2942;">${esc(t.title)}</strong>
    ${ceMark ? '<span style="padding:2px 8px;border-radius:4px;background:#0f2942;color:#ffffff;font-weight:700;font-size:12px;">CE</span>' : ""}
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;">
    <div>
      <strong style="display:block;color:#0f2942;margin-bottom:4px;">${esc(t.mfg)}</strong>
      <div>${esc(mfgName)}</div>
      <div>${nl2br(mfgAddr)}</div>
      ${mfgEmail ? `<div>${esc(t.contact)}: ${esc(mfgEmail)}</div>` : ""}
    </div>
    <div>
      <strong style="display:block;color:#0f2942;margin-bottom:4px;">${esc(t.eu)}</strong>
      <div>${esc(euName)}</div>
      <div>${nl2br(euAddr)}</div>
      ${euEmail ? `<div>${esc(t.contact)}: ${esc(euEmail)}</div>` : ""}
    </div>
  </div>
  ${safety ? `<div style="margin-top:12px;padding:10px 12px;border-left:3px solid #f59e0b;background:#fffbeb;border-radius:4px;"><strong style="display:block;color:#0f2942;margin-bottom:4px;">${esc(t.safety)}</strong><div>${nl2br(safety)}</div></div>` : ""}
  ${ceMark ? `<div style="margin-top:10px;font-size:12px;color:#047857;font-weight:600;">&#10003; ${esc(t.ce)}</div>` : ""}
</div>`;
  }

  function update() {
    const html = buildBlockHtml();
    document.getElementById("preview-container").innerHTML = html;
    document.getElementById("html-output").value = html;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("gpsr-form");
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    const copyBtn = document.getElementById("copy-html-btn");
    copyBtn.addEventListener("click", async () => {
      const code = document.getElementById("html-output").value;
      await navigator.clipboard.writeText(code);
      const prev = copyBtn.textContent;
      copyBtn.textContent = "¡HTML copiado!";
      setTimeout(() => {
        copyBtn.textContent = prev;
      }, 1800);
    });

    update();
  });
})();
