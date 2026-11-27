(function () {
  'use strict';

  function initQuiz() {
    var form = document.getElementById('ai-quiz-form');
    if (!form) return;

    var correctAnswers = { q1: 'b', q2: 'c', q3: 'a', q4: 'b', q5: 'c' };
    var resultBox = document.getElementById('ai-quiz-result');
    var scoreEl = document.getElementById('ai-quiz-score');
    var outEmp = document.getElementById('ai-cert-emp');
    var outComp = document.getElementById('ai-cert-comp');
    var outDate = document.getElementById('ai-cert-date');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var score = 0;
      Object.keys(correctAnswers).forEach(function (q) {
        var checked = form.querySelector('input[name="' + q + '"]:checked');
        if (checked && checked.value === correctAnswers[q]) score++;
      });

      var empInput = document.getElementById('ai-emp-name');
      var compInput = document.getElementById('ai-comp-name');
      var emp = (empInput && empInput.value.trim()) || 'Employee';
      var comp = (compInput && compInput.value.trim()) || 'Company';

      if (scoreEl) scoreEl.textContent = score + ' / 5';
      if (outEmp) outEmp.textContent = emp;
      if (outComp) outComp.textContent = comp;
      if (outDate) outDate.textContent = new Date().toISOString().slice(0, 10);
      if (resultBox) resultBox.style.display = 'block';
    });
  }

  function initRiskAndWidget() {
    var checks = ['use-chatbot', 'use-content', 'use-hr', 'use-internal'];
    var riskTitle = document.getElementById('ai-risk-title');
    var riskDesc = document.getElementById('ai-risk-desc');
    var riskBadge = document.getElementById('ai-risk-badge');
    var widgetText = document.getElementById('ai-widget-preview-text');
    var brandInput = document.getElementById('ai-widget-brand');
    var widgetBrand = document.getElementById('ai-widget-preview-brand');
    var lang = document.documentElement.lang === 'en' ? 'en' : 'es';

    if (!riskTitle) return;

    function update() {
      var chatbot = document.getElementById('use-chatbot') && document.getElementById('use-chatbot').checked;
      var content = document.getElementById('use-content') && document.getElementById('use-content').checked;
      var hr = document.getElementById('use-hr') && document.getElementById('use-hr').checked;
      var internal = document.getElementById('use-internal') && document.getElementById('use-internal').checked;
      var brand = (brandInput && brandInput.value.trim()) || (lang === 'en' ? 'Your Company' : 'Tu Empresa');

      if (widgetBrand) widgetBrand.textContent = brand;

      if (hr) {
        if (riskBadge) {
          riskBadge.textContent = lang === 'en' ? 'HIGH RISK (Annex III) + Art. 4' : 'ALTO RIESGO (Anexo III) + Art. 4';
          riskBadge.style.background = '#fef2f2';
          riskBadge.style.color = '#991b1b';
        }
        riskTitle.textContent = lang === 'en'
          ? 'High-Risk AI Deployment (HR / Screening) + Mandatory Art. 4 Literacy'
          : 'Despliegue de Alto Riesgo (RRHH / Selección) + Formación Art. 4 Obligatoria';
        riskDesc.textContent = lang === 'en'
          ? 'Using AI in recruitment or employee evaluation falls under Annex III High-Risk rules, requiring human oversight, AI system inventory, and mandatory staff AI literacy (Art. 4).'
          : 'Usar IA en selección de personal o evaluación laboral entra en el Anexo III (Alto Riesgo): exige supervisión humana documentada, inventario de sistemas y formación Art. 4 obligatoria.';
      } else if (chatbot || content) {
        if (riskBadge) {
          riskBadge.textContent = lang === 'en' ? 'LIMITED RISK (Art. 50) + Art. 4' : 'RIESGO LIMITADO (Art. 50) + Art. 4';
          riskBadge.style.background = '#fffbeb';
          riskBadge.style.color = '#92400e';
        }
        riskTitle.textContent = lang === 'en'
          ? 'Transparency Obligations (Art. 50) + Mandatory Art. 4 Literacy'
          : 'Obligación de Transparencia Web (Art. 50) + Formación Art. 4';
        riskDesc.textContent = lang === 'en'
          ? 'Chatbots and AI-generated content require explicit Art. 50 user disclosure on your website, plus Art. 4 AI literacy training for staff operating those tools.'
          : 'Los chatbots y contenidos generados por IA exigen un aviso visible de transparencia Art. 50 en tu web, además de formación acreditada Art. 4 para el equipo que usa IA.';
      } else if (internal) {
        if (riskBadge) {
          riskBadge.textContent = lang === 'en' ? 'MINIMAL RISK + MANDATORY Art. 4' : 'RIESGO MÍNIMO + Art. 4 OBLIGATORIO';
          riskBadge.style.background = '#ecfdf5';
          riskBadge.style.color = '#065f46';
        }
        riskTitle.textContent = lang === 'en'
          ? 'Internal AI Usage — Art. 4 Staff Literacy Already Mandatory'
          : 'Uso Interno de IA — Alfabetización Art. 4 Ya Obligatoria';
        riskDesc.textContent = lang === 'en'
          ? 'Even for internal ChatGPT or Copilot use, EU AI Act Article 4 (in force since Feb 2025) requires employers to ensure sufficient AI literacy and keep evidence for audits.'
          : 'Incluso si solo usáis ChatGPT o Copilot internamente, el Art. 4 del EU AI Act (en vigor desde feb. 2025) obliga a formar a la plantilla y conservar registro acreditativo.';
      } else {
        if (riskBadge) {
          riskBadge.textContent = lang === 'en' ? 'SELECT AT LEAST 1 USE CASE' : 'MARCA AL MENOS 1 USO DE IA';
          riskBadge.style.background = '#f1f5f9';
          riskBadge.style.color = '#334155';
        }
        riskTitle.textContent = lang === 'en' ? 'Select your company AI use cases above' : 'Selecciona los usos de IA de tu empresa arriba';
        riskDesc.textContent = lang === 'en'
          ? 'Check the tools your team uses to calculate your EU AI Act obligations.'
          : 'Marca las herramientas que utilizáis para calcular vuestras obligaciones bajo el Reglamento (UE) 2024/1689.';
      }

      if (widgetText) {
        var parts = [];
        if (chatbot) parts.push(lang === 'en' ? 'automated AI chat assistance' : 'asistencia mediante chatbot de IA');
        if (content) parts.push(lang === 'en' ? 'AI-assisted content generation' : 'generación de contenidos asistida por IA');
        if (parts.length === 0) parts.push(lang === 'en' ? 'AI-assisted digital tools' : 'herramientas digitales asistidas por IA');
        widgetText.textContent = lang === 'en'
          ? 'Notice (EU AI Act Art. 50): This site uses ' + parts.join(' and ') + ' under human oversight.'
          : 'Aviso (EU AI Act Art. 50): Este sitio utiliza ' + parts.join(' y ') + ' bajo supervisión humana.';
      }
    }

    checks.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', update);
    });
    if (brandInput) brandInput.addEventListener('input', update);
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initQuiz();
      initRiskAndWidget();
    });
  } else {
    initQuiz();
    initRiskAndWidget();
  }
})();
