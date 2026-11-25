(() => {
  const API_BASE = window.NIS2_API_URL || "https://nis2-vendor-pass.onrender.com";

  const I18N = {
    es: {
      badge: "Directiva (UE) 2022/2555 · Proveedores B2B",
      heroTitle: "NIS2 Vendor Pass: Auditoría Técnica y Dossier Verificado",
      heroDesc:
        "Verificación técnica externa automática (SPF, DKIM, DMARC, SSL y cabeceras) + autodeclaración estructurada NIS2 Art. 21 lista para entregar a departamentos de Compras (129 €/año).",
      step1Pill: "1. Escaneo Técnico Gratis",
      step2Pill: "2. Cuestionario NIS2 Art. 21",
      step3Pill: "3. Dossier PDF y Sello (129 €/año)",
      s1Title: "Paso 1 (Gratis): Escaneo Técnico en Vivo de tu Dominio",
      s1Sub: "Comprobamos registros DNS (SPF, DKIM, DMARC), certificado SSL/TLS, redirección HTTPS y cabeceras de seguridad.",
      scanBtn: "Analizar dominio gratis",
      s2Title: "Paso 2: Matriz Organizativa NIS2 Art. 21 (10 Controles Esenciales)",
      s2Sub: "Completa los datos de tu empresa y marca las medidas implantadas para generar el Dossier Técnico.",
      compLabel: "Razón social / Empresa",
      emailLabel: "Email de contacto",
      sectorLabel: "Sector",
      countryLabel: "País UE",
      saveAssessBtn: "Guardar evaluación y continuar al Paso 3",
      s3Title: "Paso 3: Emitir Dossier Técnico PDF & Sello Verificado (129 €/año)",
      lockedTitle: "Dossier Oficial listo para emitir — Desbloquear por 129 €/año",
      lockedSub: "Incluye informe ejecutivo PDF de 2 páginas, código QR y sello público verificable.",
      checkoutBtn: "Desbloquear Dossier PDF y Sello (129 €/año)",
      phDomain: "ejemplo.com",
      phEmail: "seguridad@acme.com",
      phSector: "SaaS / Logística / Industria",
    },
    en: {
      badge: "EU Directive 2022/2555 · B2B Suppliers",
      heroTitle: "NIS2 Vendor Pass: Technical Audit & Verified Dossier",
      heroDesc:
        "Automated external technical perimeter verification (SPF, DKIM, DMARC, SSL & headers) + structured NIS2 Art. 21 vendor self-declaration ready for Procurement teams (€129/year).",
      step1Pill: "1. Free Technical Scan",
      step2Pill: "2. NIS2 Art. 21 Questionnaire",
      step3Pill: "3. PDF Dossier & Seal (€129/yr)",
      s1Title: "Step 1 (Free): Live Domain Technical Scan",
      s1Sub: "We check DNS records (SPF, DKIM, DMARC), SSL/TLS validity, HTTPS redirect, and security headers.",
      scanBtn: "Scan domain for free",
      s2Title: "Step 2: NIS2 Art. 21 Organizational Matrix (10 Essential Controls)",
      s2Sub: "Enter your company details and mark implemented controls to generate your Technical Dossier.",
      compLabel: "Company legal name",
      emailLabel: "Contact email",
      sectorLabel: "Industry sector",
      countryLabel: "EU Country",
      saveAssessBtn: "Save assessment & continue to Step 3",
      s3Title: "Step 3: Issue PDF Technical Dossier & Verified Seal (€129/yr)",
      lockedTitle: "Official Dossier ready to issue — Unlock for €129/year",
      lockedSub: "Includes 2-page executive PDF report, QR code, and public verification seal.",
      checkoutBtn: "Unlock PDF Dossier & Seal (€129/yr)",
      phDomain: "example.com",
      phEmail: "security@acme.com",
      phSector: "SaaS / Logistics / Manufacturing",
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

  let currentLang = "es";
  let lastScan = null;
  let currentSlug = null;

  function renderControls() {
    const wrap = document.getElementById("controls-list");
    const prevChecked = {};
    for (const inp of wrap.querySelectorAll("input[type='checkbox']")) {
      prevChecked[inp.name] = inp.checked;
    }
    wrap.innerHTML = "";
    for (const c of CONTROLS) {
      const label = document.createElement("label");
      label.className = "ctrl-item";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.name = c.key;
      cb.checked = prevChecked[c.key] ?? false;
      const span = document.createElement("span");
      span.textContent = c[currentLang];
      label.appendChild(cb);
      label.appendChild(span);
      wrap.appendChild(label);
    }
  }

  function applyLang(lang) {
    currentLang = lang === "en" ? "en" : "es";
    window.JFD_LANG = currentLang;
    const dict = I18N[currentLang];
    for (const el of document.querySelectorAll("[data-i18n]")) {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    }
    for (const el of document.querySelectorAll("[data-i18n-ph]")) {
      const key = el.getAttribute("data-i18n-ph");
      if (dict[key]) el.setAttribute("placeholder", dict[key]);
    }
    renderControls();
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
      div.innerHTML = `<strong>${it.label}</strong><div>${it.detail}</div>`;
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

  async function loadVerificationView(slug, sessionId) {
    const view = document.getElementById("verify-view");
    const wizard = document.getElementById("wizard-container");

    if (sessionId) {
      await fetch(`${API_BASE}/api/verify-payment?slug=${encodeURIComponent(slug)}&session_id=${encodeURIComponent(sessionId)}`).catch(() => {});
    }

    const resp = await fetch(`${API_BASE}/api/verify/${encodeURIComponent(slug)}`);
    const data = await resp.json();
    if (!resp.ok || !data.ok) return;

    const vendor = data.vendor;
    wizard.classList.add("hidden");
    view.classList.remove("hidden");

    const badge = document.getElementById("verify-badge");
    badge.textContent = vendor.status === "verified" ? "NIS2 VERIFIED" : "DRAFT / PENDING";
    document.getElementById("verify-company").textContent = `${vendor.company_name} (${vendor.domain})`;
    document.getElementById("verify-meta").textContent = `Código: ${vendor.slug} · ${vendor.sector || "B2B"} (${vendor.country}) · ${new Date(vendor.verified_at || vendor.created_at).toLocaleDateString()}`;
    document.getElementById("verify-score").textContent = `${vendor.technical_score} / 100`;
    document.getElementById("verify-pdf-btn").href = `${API_BASE}/api/dossier/${encodeURIComponent(vendor.slug)}/pdf`;

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
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderControls();

    const langSelect = document.getElementById("nis2-lang");
    langSelect.addEventListener("change", (e) => applyLang(e.target.value));

    const params = new URLSearchParams(window.location.search);
    const verifySlug = params.get("verify");
    const sessionId = params.get("session_id");
    if (verifySlug) {
      await loadVerificationView(verifySlug, sessionId);
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
        const data = await resp.json();
        if (!resp.ok || !data.ok) throw new Error(data.error || "Scan failed");
        renderScan(data.scan);
      } catch (err) {
        errBox.textContent = err.message;
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
        errBox.textContent = "Introduce primero un dominio en el Paso 1.";
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
            scanResults: lastScan,
            questionnaire,
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) throw new Error(data.error || "Failed to save assessment");

        currentSlug = data.slug;
        document.getElementById("pill-3").classList.add("active");
        document.getElementById("step3-card").classList.remove("hidden");
        document.getElementById("step3-summary").textContent =
          `Código generado: ${currentSlug} · Puntuación técnica: ${data.assessment.technical_score}/100`;
        document.getElementById("step3-card").scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove("hidden");
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById("checkout-btn").addEventListener("click", async () => {
      if (!currentSlug) return;
      const resp = await fetch(`${API_BASE}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: currentSlug }),
      });
      const data = await resp.json();
      if (data.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    });
  });
})();
