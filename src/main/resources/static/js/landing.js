// Landing interactions are local; the demo never sends application data.
(() => {
  "use strict";
  const root = document.documentElement;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const menu = document.getElementById("landing-menu");
  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  let revealObserver;

  function measureHeader() {
    root.style.setProperty(
      "--header-height",
      `${header?.getBoundingClientRect().height || 0}px`,
    );
  }
  function setMenu(open, returnFocus = false) {
    if (!header || !menuButton || !menu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    header.toggleAttribute("data-open", open);
    measureHeader();
    if (returnFocus) menuButton.focus();
  }
  if (header && menuButton && menu) {
    root.classList.add("menu-ready");
    menuButton.hidden = false;
    menuButton.addEventListener("click", () =>
      setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
    );
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menuButton.getAttribute("aria-expanded") === "true"
      )
        setMenu(false, true);
    });
  }
  if (header && "ResizeObserver" in window)
    new ResizeObserver(measureHeader).observe(header);
  function configureReveals() {
    revealObserver?.disconnect();
    const animated =
      !reducedMotion.matches &&
      root.dataset.motionPaused !== "true" &&
      "IntersectionObserver" in window;
    root.classList.toggle("reveal-ready", animated);
    if (!animated) {
      revealItems.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    revealItems.forEach((element) => {
      if (!element.classList.contains("is-visible"))
        revealObserver.observe(element);
    });
  }
  reducedMotion.addEventListener("change", configureReveals);
  new MutationObserver(configureReveals).observe(root, {
    attributes: true,
    attributeFilter: ["data-motion-paused"],
  });
  window.addEventListener("pageshow", () => {
    measureHeader();
    configureReveals();
  });
  const demoForm = document.querySelector("[data-demo-form]");
  const demoRows = document.querySelector("[data-demo-rows]");
  const demoStatus = document.querySelector("[data-demo-status]");
  const demoCount = document.querySelector("[data-demo-count]");
  const demoReset = document.querySelector("[data-demo-reset]");
  const fields = {
    plate: document.getElementById("demo-placa"),
    model: document.getElementById("demo-modelo"),
    color: document.getElementById("demo-cor"),
    note: document.getElementById("demo-observacao"),
  };

  if (demoForm && demoRows && Object.values(fields).every(Boolean)) {
    Object.values(fields).forEach((field) => {
      field.addEventListener("input", () => field.setCustomValidity(""));
    });
    demoForm.addEventListener("submit", (event) => {
      event.preventDefault();
      for (const field of [fields.plate, fields.model, fields.color]) {
        field.setCustomValidity(
          field.value.trim()
            ? ""
            : "Preencha este campo para simular a entrada.",
        );
      }
      if (!demoForm.reportValidity()) return;
      const plate = fields.plate.value.trim().toUpperCase();
      const row = document.createElement("tr");
      row.setAttribute("data-demo-row", "");
      row.className = "is-new";
      const values = [
        ["Placa", plate],
        ["Modelo", fields.model.value.trim()],
        ["Cor", fields.color.value.trim()],
        ["Entrada", "08:00"],
        ["Observação", fields.note.value.trim() || "Sem observações"],
      ];
      values.forEach(([label, value], index) => {
        const cell = document.createElement("td");
        cell.dataset.label = label;
        if (index === 0) {
          const plateLabel = document.createElement("span");
          plateLabel.className = "plate";
          plateLabel.textContent = value;
          cell.append(plateLabel);
        } else {
          cell.textContent = value;
        }
        if (index === 3) cell.title = "Horário fictício de exemplo";
        row.append(cell);
      });
      demoRows.querySelector("[data-demo-row]")?.remove();
      demoRows.prepend(row);
      if (demoCount) demoCount.textContent = "04 registros de exemplo";
      if (demoStatus) {
        demoStatus.classList.add("is-success");
        demoStatus.textContent = `Demonstração: entrada de ${plate} simulada às 08:00 (horário de exemplo). Nada foi salvo.`;
      }
    });
    demoReset?.addEventListener("click", () => {
      demoRows.querySelector("[data-demo-row]")?.remove();
      demoForm.reset();
      Object.values(fields).forEach((field) => field.setCustomValidity(""));
      if (demoCount) demoCount.textContent = "03 registros de exemplo";
      if (demoStatus) {
        demoStatus.classList.remove("is-success");
        demoStatus.textContent =
          "Demonstração reiniciada. Os dados são fictícios e nada foi salvo.";
      }
    });
    demoForm
      .querySelectorAll(
        'button[type="submit"], input[type="submit"], fieldset[disabled]',
      )
      .forEach((control) => {
        control.disabled = false;
      });
    if (demoReset) demoReset.hidden = false;
  }

  measureHeader();
  configureReveals();
})();
