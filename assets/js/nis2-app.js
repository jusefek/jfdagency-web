(() => {
  const API_BASE = window.NIS2_API_URL || "https://nis2-vendor-pass.onrender.com";

  const I18N = {
    es: {
      needDomain: "Introduce primero un dominio en el Paso 1.",
      scanFailed: "No se pudo completar el escaneo del dominio.",
      saveFailed: "No se pudo guardar la evaluación.",
      checkoutFailed: "No se pudo iniciar el checkout. Inténtalo de nuevo.",
      verifyFailed: "No se pudo cargar o verificar este código de proveedor.",
      generatedCode: (slug, score) => `Código generado: ${slug} · Puntuación técnica: ${score}/100`,
      verifiedBadge: "NIS2 VERIFICADO",
      pendingBadge: "BORRADOR / PENDIENTE",
    },
    en: {
      needDomain: "Please enter a domain in Step 1 first.",
      scanFailed: "Could not complete the domain scan.",
      saveFailed: "Could not save the assessment.",
      checkoutFailed: "Could not start checkout. Please try again.",
      verifyFailed: "Could not load or verify this vendor reference code.",
      generatedCode: (slug, score) => `Reference code: ${slug} · Technical score: ${score}/100`,
      verifiedBadge: "NIS2 VERIFIED",
      pendingBadge: "DRAFT / PENDING",
    },
  };

  const CONTROLS = [
    { key: "risk_policy", es: "Art. 21(2)(a) Políticas de análisis de riesgos y seguridad TI", en: "Art. 21(2)(a) Risk analysis & IT security policies" },
    { key: "incident_handling", es: "Art. 21(2)(b) Gestión de incidentes y notificación Art. 23 (24h/72h)", en: "Art. 21(2)(b) Incident handling & Art. 23 reporting (24h/72h)" },
    { key: "business_continuity", es: "Art. 21(2)(c) Continuidad de negocio, copias de seguridad y recuperación", en: "Art. 21(2)(c) Business continuity, backups & disaster recovery" },
    { key: "supply_chain", es: "Art. 21(2)(d) Seguridad en la cadena de suministro y proveedores", en: "Art. 21(2)(d) Supply chain & vendor security" },
    { key: "vuln_management", es: "Art. 21(2)(e) Gestión de vulnerabilidades y desarrollo seguro", en: "Art. 21(2)(e) Vulnerability handling & secure development" },
    { key: "effectiveness_audit", es: "Art. 21(2)(f) Evaluación periódica de eficacia de medidas", en: "Art. 21(2)(f) Security effectiveness assessment" },
    { key: "cyber_hygiene", es: "Art. 21(2)(g) Ciberhigiene básica y formación del personal", en: "Art. 21(2)(g) Basic cyber hygiene & staff training" },
    { key: "cryptography", es: "Art. 21(2)(h) Políticas de criptografía y cifrado", en: "Art. 21(2)(h) Cryptography & encryption policies" },
    { key: "access_control", es: "Art. 21(2)(i) Control de accesos, RR. HH. y gestión de activos", en: "Art. 21(2)(i) Access control, HR security & asset management" },
    { key: "mfa_comms", es: "Art. 21(2)(j) Autenticación multifactor (MFA) y comunicaciones seguras", en: "Art. 21(2)(j) Multi-Factor Authentication (MFA) & secure comms" },
  ];

  const currentLang = document.documentElement.lang === "en" ? "en" : "es";
  window.JFD_LANG = currentLang;
  const t = I18N[currentLang];

  let lastScan = null;
  let currentSlug = null;

  function renderControls() {
    const wrap = document.getElementById("controls-list");
    if (!wrap) return;
    wrap.innerHTML = "";
    for (const c of CONTROLS) {
      const label = document.createElement("label");
      label.className = "ctrl-item";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.name = c.key;
      const span = document.createElement("span");
      span.textContent = c[currentLang];
      label.appendChild(cb);
      label.appendChild(span);
      wrap.appendChild(label);
    }
  }

  function renderScan(scan) {
    lastScan = scan;
    document.getElementById("scan-results").classList.remove("hidden");
    document.getElementById("scan-domain-title").textContent = scan.domain;
    document.getElementById("scan-score-badge").textContent = `${scan.score} / 100`;

    const v = scan.vectors;
    const items = [
      { label: "SPF", ok: v.spf.ok, detail: v.spf.ok ? "OK" : "Missing" },
      { label: "DKIM", ok: v.dkim.ok, detail: v.dkim.ok ? v.dkim.selectors.join(", ") : "Missing" },
      { label: "DMARC", ok: v.dmarc.ok, detail: v.dmarc.ok ? "OK" : "Missing" },
      { label: "SSL/TLS", ok: v.ssl.valid, detail: v.ssl.valid ? `${v.ssl.daysRemaining}d` : "Invalid" },
      { label: "HTTPS Redirect", ok: v.httpRedirect.ok, detail: v.httpRedirect.ok ? "301/302" : "Missing" },
      { label: "HSTS", ok: v.headers["strict-transport-security"], detail: v.headers["strict-transport-security"] ? "OK" : "Missing" },
      { label: "CSP", ok: v.headers["content-security-policy"], detail: v.headers["content-security-policy"] ? "OK" : "Missing" },
      { label: "X-Frame", ok: v.headers["x-frame-options"], detail: v.headers["x-frame-options"] ? "OK" : "Missing" },
    ];

    const grid = document.getElementById("scan-vectors");
    grid.innerHTML = "";
    for (const it of items) {
      const div = document.createElement("div");
      div.className = `vec-card ${it.ok ? "vec-ok" : "vec-fail"}`;
      const strong = document.createElement("strong");
      strong.textContent = it.label;
      const detail = document.createElement("div");
      detail.textContent = it.detail;
      div.appendChild(strong);
      div.appendChild(detail);
      grid.appendChild(div);
    }

    const recs = document.getElementById("scan-recs");
    recs.innerHTML = "";
    for (const r of scan.recommendations || []) {
      const li = document.createElement("li");
      li.textContent = r;
      recs.appendChild(li);
    }

    document.getElementById("pill-2").classList.add("active");
  }

  async function loadVerificationView(slug, sessionId, isDemo = false) {
    const view = document.getElementById("verify-view");
    const wizard = document.getElementById("wizard-container");
    const errBox = document.getElementById("verify-error");
    if (errBox) errBox.classList.add("hidden");

    try {
      if (sessionId && !isDemo) {
        await fetch(`${API_BASE}/api/verify-payment?slug=${encodeURIComponent(slug)}&session_id=${encodeURIComponent(sessionId)}`);
      }

      const verifyEndpoint = isDemo
        ? `${API_BASE}/api/demo/verify?lang=${encodeURIComponent(currentLang)}`
        : `${API_BASE}/api/verify/${encodeURIComponent(slug)}`;
      const resp = await fetch(verifyEndpoint);
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok || !data.verified) {
        throw new Error(data.error || t.verifyFailed);
      }

      const vendor = data.vendor;
      wizard.classList.add("hidden");
      view.classList.remove("hidden");

      const badge = document.getElementById("verify-badge");
      badge.textContent = isDemo
        ? currentLang === "en" ? "DEMO SAMPLE" : "EJEMPLO DEMO"
        : vendor.status === "verified" ? t.verifiedBadge : t.pendingBadge;
      document.getElementById("verify-company").textContent = `${vendor.company_name} (${vendor.domain})`;
      document.getElementById("verify-meta").textContent = `${vendor.slug} · ${vendor.sector || "B2B"} (${vendor.country}) · ${new Date(vendor.verified_at || vendor.created_at).toLocaleDateString()}`;
      document.getElementById("verify-score").textContent = `${vendor.technical_score} / 100`;
      const pdfBase = isDemo
        ? `${API_BASE}/api/demo/dossier/pdf`
        : `${API_BASE}/api/dossier/${encodeURIComponent(vendor.slug)}/pdf`;
      document.getElementById("verify-pdf-btn").href = `${pdfBase}?lang=${encodeURIComponent(currentLang)}`;

      const altLang = currentLang === "en" ? "es" : "en";
      const altLink = document.getElementById("verify-pdf-alt");
      if (altLink) {
        altLink.href = `${pdfBase}?lang=${altLang}`;
        altLink.textContent = altLang === "en" ? "Download in EN" : "Descargar en ES";
      }

      const ctrlDiv = document.getElementById("verify-controls");
      ctrlDiv.innerHTML = "";
      const q = vendor.questionnaire || {};
      for (const c of CONTROLS) {
        const p = document.createElement("div");
        p.style.fontSize = "13px";
        p.style.marginBottom = "4px";
        p.textContent = `${q[c.key] ? "✓" : "○"} ${c[currentLang]}`;
        ctrlDiv.appendChild(p);
      }

      const tplBox = document.getElementById("verify-templates");
      if (tplBox) {
        tplBox.textContent = "";
        if (!isDemo && vendor.status === "verified") {
          const title = document.createElement("strong");
          title.style.display = "block";
          title.style.fontSize = "13px";
          title.style.marginBottom = "8px";
          title.style.color = "var(--navy)";
          title.textContent = currentLang === "en"
            ? "Included NIS2 Compliance Templates Pack (pre-filled for your company):"
            : "Pack de 3 Plantillas NIS2 incluidas (pre-rellenadas para tu empresa):";
          tplBox.appendChild(title);

          const templates = [
            {
              id: "incident-policy",
              es: "1. Política de Notificación de Incidentes (24h / 72h - Art. 23)",
              en: "1. Incident Notification Policy (24h / 72h - Art. 23)",
            },
            {
              id: "supplier-risk-matrix",
              es: "2. Matriz Básica de Riesgos de Proveedores (Art. 21.2.d)",
              en: "2. Supplier Risk Matrix (Art. 21.2.d)",
            },
            {
              id: "security-posture-letter",
              es: "3. Declaración de Postura Técnica de Ciberseguridad (firmable)",
              en: "3. Signable Cybersecurity Posture Declaration",
            },
          ];

          for (const item of templates) {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.flexWrap = "wrap";
            row.style.alignItems = "center";
            row.style.justifyContent = "space-between";
            row.style.gap = "8px";
            row.style.padding = "8px 10px";
            row.style.marginBottom = "6px";
            row.style.border = "1px solid #cbd5e1";
            row.style.borderRadius = "8px";
            row.style.background = "#f8fafc";

            const lbl = document.createElement("span");
            lbl.style.fontSize = "12.5px";
            lbl.style.fontWeight = "600";
            lbl.textContent = item[currentLang];

            const links = document.createElement("div");
            links.style.display = "flex";
            links.style.gap = "10px";
            links.style.fontSize = "12px";

            const aHtml = document.createElement("a");
            aHtml.href = `${API_BASE}/api/dossier/${encodeURIComponent(vendor.slug)}/template/${item.id}?format=html&lang=${encodeURIComponent(currentLang)}`;
            aHtml.target = "_blank";
            aHtml.rel = "noopener noreferrer";
            aHtml.textContent = currentLang === "en" ? "Printable / PDF" : "Imprimir / PDF";
            aHtml.style.fontWeight = "600";

            const aMd = document.createElement("a");
            aMd.href = `${API_BASE}/api/dossier/${encodeURIComponent(vendor.slug)}/template/${item.id}?format=md&lang=${encodeURIComponent(currentLang)}`;
            aMd.textContent = "Markdown (.md)";

            links.appendChild(aHtml);
            links.appendChild(aMd);
            row.appendChild(lbl);
            row.appendChild(links);
            tplBox.appendChild(row);
          }
        }
      }

      if (vendor.status === "verified" && !isDemo && !document.getElementById("verify-badge-snippet-box")) {
        const box = document.createElement("div");
        box.id = "verify-badge-snippet-box";
        box.style.marginTop = "18px";
        box.style.padding = "12px";
        box.style.background = "#f8fafc";
        box.style.border = "1px solid #cbd5e1";
        box.style.borderRadius = "8px";
        const label = document.createElement("div");
        label.style.fontSize = "12px";
        label.style.fontWeight = "600";
        label.style.marginBottom = "6px";
        label.textContent = currentLang === "en"
          ? "Embed your verified NIS2 Vendor Pass trust badge:"
          : "Inserta el sello verificado NIS2 Vendor Pass en tu web:";
        const pre = document.createElement("code");
        pre.style.display = "block";
        pre.style.fontSize = "11px";
        pre.style.wordBreak = "break-all";
        pre.style.color = "#0f172a";
        const safeUrl = `https://jfdagency.com/nis2/?verify=${encodeURIComponent(vendor.slug)}`;
        pre.textContent = `<a href="${safeUrl}" target="_blank" rel="noopener">NIS2 Vendor Pass Verified by JFD Agency</a>`;
        box.appendChild(label);
        box.appendChild(pre);
        ctrlDiv.appendChild(box);
      }
    } catch (err) {
      if (errBox) {
        errBox.textContent = err.message || t.verifyFailed;
        errBox.classList.remove("hidden");
      }
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderControls();

    const langSelect = document.getElementById("nis2-lang");
    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.addEventListener("change", (e) => {
        const target = e.target.value === "en" ? "/en/nis2/" : "/nis2/";
        window.location.href = target + window.location.search;
      });
    }

    const params = new URLSearchParams(window.location.search);
    const verifySlug = params.get("verify");
    const sessionId = params.get("session_id");
    const isDemo = params.get("demo") === "true";
    if (verifySlug) {
      await loadVerificationView(verifySlug, sessionId, false);
    } else if (isDemo) {
      await loadVerificationView("acme-logistics-eu-demo", null, true);
    }

    document.getElementById("scan-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("scan-btn");
      const errBox = document.getElementById("scan-error");
      errBox.classList.add("hidden");
      btn.disabled = true;

      try {
        const domain = document.getElementById("scan-domain").value.trim();
        const resp = await fetch(`${API_BASE}/api/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.ok) throw new Error(data.error || t.scanFailed);
        renderScan(data.scan);
      } catch (err) {
        errBox.textContent = err.message || t.scanFailed;
        errBox.classList.remove("hidden");
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById("assessment-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = document.getElementById("assess-error");
      errBox.classList.add("hidden");
      const domain = lastScan?.domain || document.getElementById("scan-domain").value.trim();
      if (!domain) {
        errBox.textContent = t.needDomain;
        errBox.classList.remove("hidden");
        return;
      }

      const questionnaire = {};
      for (const cb of document.querySelectorAll("#controls-list input[type='checkbox']")) {
        questionnaire[cb.name] = cb.checked;
      }

      const btn = document.getElementById("save-assess-btn");
      btn.disabled = true;

      try {
        const resp = await fetch(`${API_BASE}/api/assessments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain,
            companyName: document.getElementById("comp-name").value.trim(),
            contactEmail: document.getElementById("comp-email").value.trim(),
            sector: document.getElementById("comp-sector").value.trim(),
            country: document.getElementById("comp-country").value.trim(),
            questionnaire,
            lang: currentLang,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.ok) throw new Error(data.error || t.saveFailed);

        currentSlug = data.slug;
        document.getElementById("pill-3").classList.add("active");
        document.getElementById("step3-card").classList.remove("hidden");
        document.getElementById("step3-summary").textContent = t.generatedCode(
          currentSlug,
          data.assessment.technical_score,
        );
        document.getElementById("step3-card").scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        errBox.textContent = err.message || t.saveFailed;
        errBox.classList.remove("hidden");
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById("checkout-btn").addEventListener("click", async () => {
      if (!currentSlug) return;
      const btn = document.getElementById("checkout-btn");
      const errBox = document.getElementById("checkout-error");
      if (errBox) errBox.classList.add("hidden");
      btn.disabled = true;

      try {
        const resp = await fetch(`${API_BASE}/api/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: currentSlug }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.ok || !data.checkoutUrl) {
          throw new Error(data.error || t.checkoutFailed);
        }
        window.location.href = data.checkoutUrl;
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message || t.checkoutFailed;
          errBox.classList.remove("hidden");
        }
        btn.disabled = false;
      }
    });
  });
})();
