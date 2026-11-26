(() => {
  const currentLang = document.documentElement.lang === "en" ? "en" : "es";
  window.JFD_LANG = currentLang;

  document.addEventListener("DOMContentLoaded", () => {
    const sel = document.getElementById("home-lang");
    if (!sel) return;
    sel.value = currentLang;
    sel.addEventListener("change", (e) => {
      window.location.href = e.target.value === "en" ? "/en/" : "/";
    });
  });
})();
