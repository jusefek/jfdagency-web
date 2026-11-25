(() => {
  const SUPPORT_EMAIL = "soporte@tryjfdagency.com";
  const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`;

  function ensureModal() {
    let overlay = document.getElementById("jfd-contact-modal");
    if (overlay) return overlay;

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
            <h3 id="jfd-modal-title">Contactar con JFD Agency</h3>
            <p class="modal-sub">Respuesta habitual en menos de 24 horas laborables.</p>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
        </div>

        <form id="jfd-contact-form">
          <div class="form-group">
            <label for="jfd-name">Nombre</label>
            <input id="jfd-name" name="name" type="text" required placeholder="Tu nombre o empresa" />
          </div>
          <div class="form-group">
            <label for="jfd-email">Email</label>
            <input id="jfd-email" name="email" type="email" required placeholder="tu@empresa.com" />
          </div>
          <div class="form-group">
            <label for="jfd-type">Tipo de consulta</label>
            <select id="jfd-type" name="type">
              <option value="App Shopify">App Shopify</option>
              <option value="Plugin WooCommerce">Plugin WooCommerce</option>
              <option value="Proyecto a medida" selected>Proyecto a medida</option>
            </select>
          </div>
          <div class="form-group">
            <label for="jfd-message">Mensaje</label>
            <textarea id="jfd-message" name="message" rows="3" required placeholder="Cuéntanos brevemente qué necesitas..."></textarea>
          </div>

          <div id="jfd-form-status" class="modal-status hidden"></div>

          <div class="modal-actions">
            <button type="submit" id="jfd-submit-btn" class="btn btn-contact">Enviar mensaje</button>
            <div class="copy-email-wrap">
              <span class="email-pill">${SUPPORT_EMAIL}</span>
              <button type="button" id="jfd-copy-email" class="btn btn-outline btn-sm">Copiar email</button>
            </div>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

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
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      const prev = copyBtn.textContent;
      copyBtn.textContent = "¡Copiado!";
      setTimeout(() => {
        copyBtn.textContent = prev;
      }, 1800);
    });

    const form = overlay.querySelector("#jfd-contact-form");
    const statusBox = overlay.querySelector("#jfd-form-status");
    const submitBtn = overlay.querySelector("#jfd-submit-btn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
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
        statusBox.textContent = "¡Mensaje enviado! Te responderemos muy pronto.";
        statusBox.className = "modal-status modal-status-ok";
        form.reset();
      } catch {
        statusBox.textContent =
          "No se pudo enviar automáticamente. Usa el botón 'Copiar email' para escribirnos directo.";
        statusBox.className = "modal-status modal-status-err";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar mensaje";
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
