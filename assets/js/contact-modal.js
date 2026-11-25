(() => {
  const SUPPORT_EMAIL = "soporte@tryjfdagency.com";
  const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`;

  const MODAL_I18N = {
    es: {
      title: "Contactar con JFD Agency",
      sub: "Respuesta habitual en menos de 24 horas laborables.",
      nameLabel: "Nombre",
      namePh: "Tu nombre o empresa",
      emailLabel: "Email",
      emailPh: "tu@empresa.com",
      typeLabel: "Tipo de consulta",
      opt1: "App Shopify",
      opt2: "Plugin WooCommerce",
      opt3: "Proyecto a medida",
      msgLabel: "Mensaje",
      msgPh: "Cuéntanos brevemente qué necesitas...",
      submit: "Enviar mensaje",
      sending: "Enviando...",
      copy: "Copiar email",
      copied: "¡Copiado!",
      ok: "¡Mensaje enviado! Te responderemos muy pronto.",
      err: "No se pudo enviar automáticamente. Usa el botón 'Copiar email' para escribirnos directo.",
    },
    en: {
      title: "Contact JFD Agency",
      sub: "Typical response within 24 business hours.",
      nameLabel: "Name",
      namePh: "Your name or company",
      emailLabel: "Email",
      emailPh: "you@company.com",
      typeLabel: "Inquiry type",
      opt1: "Shopify App",
      opt2: "WooCommerce Plugin",
      opt3: "Custom Project",
      msgLabel: "Message",
      msgPh: "Tell us briefly what you need...",
      submit: "Send message",
      sending: "Sending...",
      copy: "Copy email",
      copied: "Copied!",
      ok: "Message sent! We will get back to you shortly.",
      err: "Could not send automatically. Use the 'Copy email' button to email us directly.",
    },
  };

  function getLang() {
    return window.JFD_LANG === "en" ? "en" : "es";
  }

  function applyModalTexts(overlay) {
    const t = MODAL_I18N[getLang()];
    overlay.querySelector("#jfd-modal-title").textContent = t.title;
    overlay.querySelector(".modal-sub").textContent = t.sub;
    overlay.querySelector("label[for='jfd-name']").textContent = t.nameLabel;
    overlay.querySelector("#jfd-name").placeholder = t.namePh;
    overlay.querySelector("label[for='jfd-email']").textContent = t.emailLabel;
    overlay.querySelector("#jfd-email").placeholder = t.emailPh;
    overlay.querySelector("label[for='jfd-type']").textContent = t.typeLabel;
    const opts = overlay.querySelector("#jfd-type").options;
    opts[0].textContent = t.opt1;
    opts[1].textContent = t.opt2;
    opts[2].textContent = t.opt3;
    overlay.querySelector("label[for='jfd-message']").textContent = t.msgLabel;
    overlay.querySelector("#jfd-message").placeholder = t.msgPh;
    overlay.querySelector("#jfd-submit-btn").textContent = t.submit;
    overlay.querySelector("#jfd-copy-email").textContent = t.copy;
  }

  function ensureModal() {
    let overlay = document.getElementById("jfd-contact-modal");
    if (overlay) {
      applyModalTexts(overlay);
      return overlay;
    }

    overlay = document.createElement("div");
    overlay.id = "jfd-contact-modal";
    overlay.className = "modal-overlay hidden";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "jfd-modal-title");

    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3 id="jfd-modal-title"></h3>
            <p class="modal-sub"></p>
          </div>
          <button type="button" class="modal-close" aria-label="Close">&times;</button>
        </div>

        <form id="jfd-contact-form">
          <div class="form-group">
            <label for="jfd-name"></label>
            <input id="jfd-name" name="name" type="text" required />
          </div>
          <div class="form-group">
            <label for="jfd-email"></label>
            <input id="jfd-email" name="email" type="email" required />
          </div>
          <div class="form-group">
            <label for="jfd-type"></label>
            <select id="jfd-type" name="type">
              <option value="App Shopify"></option>
              <option value="Plugin WooCommerce"></option>
              <option value="Proyecto a medida" selected></option>
            </select>
          </div>
          <div class="form-group">
            <label for="jfd-message"></label>
            <textarea id="jfd-message" name="message" rows="3" required></textarea>
          </div>

          <div id="jfd-form-status" class="modal-status hidden"></div>

          <div class="modal-actions">
            <button type="submit" id="jfd-submit-btn" class="btn btn-contact"></button>
            <div class="copy-email-wrap">
              <span class="email-pill">${SUPPORT_EMAIL}</span>
              <button type="button" id="jfd-copy-email" class="btn btn-outline btn-sm"></button>
            </div>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    applyModalTexts(overlay);

    const closeBtn = overlay.querySelector(".modal-close");
    closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
        overlay.classList.add("hidden");
      }
    });

    const copyBtn = overlay.querySelector("#jfd-copy-email");
    copyBtn.addEventListener("click", async () => {
      const t = MODAL_I18N[getLang()];
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      copyBtn.textContent = t.copied;
      setTimeout(() => {
        copyBtn.textContent = MODAL_I18N[getLang()].copy;
      }, 1800);
    });

    const form = overlay.querySelector("#jfd-contact-form");
    const statusBox = overlay.querySelector("#jfd-form-status");
    const submitBtn = overlay.querySelector("#jfd-submit-btn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const t = MODAL_I18N[getLang()];
      submitBtn.disabled = true;
      submitBtn.textContent = t.sending;
      statusBox.className = "modal-status hidden";

      try {
        const resp = await fetch(FORMSUBMIT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: overlay.querySelector("#jfd-name").value.trim(),
            email: overlay.querySelector("#jfd-email").value.trim(),
            type: overlay.querySelector("#jfd-type").value,
            message: overlay.querySelector("#jfd-message").value.trim(),
            _subject: `[JFD Agency] ${overlay.querySelector("#jfd-type").value}`,
          }),
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        statusBox.textContent = t.ok;
        statusBox.className = "modal-status modal-status-ok";
        form.reset();
      } catch {
        statusBox.textContent = t.err;
        statusBox.className = "modal-status modal-status-err";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = MODAL_I18N[getLang()].submit;
      }
    });

    return overlay;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-open-contact]");
      if (!trigger) return;
      e.preventDefault();
      const overlay = ensureModal();
      const presetType = trigger.getAttribute("data-open-contact");
      const select = overlay.querySelector("#jfd-type");
      if (presetType && select) {
        for (const opt of select.options) {
          if (opt.value === presetType) {
            select.value = presetType;
            break;
          }
        }
      }
      overlay.classList.remove("hidden");
      overlay.querySelector("#jfd-name").focus();
    });
  });
})();
