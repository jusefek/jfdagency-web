(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const fields = [
      { inputId: "pv-mfg", targetId: "out-mfg" },
      { inputId: "pv-eu", targetId: "out-eu" },
      { inputId: "pv-email", targetId: "out-email" },
      { inputId: "pv-batch", targetId: "out-batch" },
      { inputId: "pv-warn", targetId: "out-warn" },
    ];

    for (const { inputId, targetId } of fields) {
      const input = document.getElementById(inputId);
      const target = document.getElementById(targetId);
      if (!input || !target) continue;

      const fallback = target.textContent || "";
      const sync = () => {
        const val = input.value.trim();
        target.textContent = val || fallback;
        if (inputId === "pv-email" && target.tagName === "A") {
          target.href = val.includes("@") ? `mailto:${val}` : "#";
        }
      };
      input.addEventListener("input", sync);
    }
  });
})();
