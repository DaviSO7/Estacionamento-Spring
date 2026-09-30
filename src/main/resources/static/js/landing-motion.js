/* Native-scroll parallax: damp visual layers, never intercept wheel/touch or
   animate the document's scroll position. Geometry is read only on layout changes. */
(() => {
  "use strict";
  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motion.matches;
  let active = true;
  let frame = 0;
  let measurementFrame = 0;
  let previousTime = 0;
  let scroll = window.scrollY;
  const layers = [...document.querySelectorAll("[data-parallax]")].map(
    (element) => ({
      element,
      scene: element.closest("[data-parallax-scene]"),
      speed: Number(element.dataset.parallax),
      limit: Number(element.dataset.parallaxLimit) || 40,
      origin: 0,
      current: 0,
      visible: false,
    }),
  );
  const allowed = () =>
    active &&
    !document.hidden &&
    !reduced &&
    root.dataset.motionPaused !== "true";
  const targetFor = (layer) =>
    Math.max(
      -layer.limit,
      Math.min(
        layer.limit,
        (scroll - layer.origin) * layer.speed * (innerWidth <= 760 ? 0.55 : 1),
      ),
    );
  function paint(layer) {
    layer.element.style.setProperty(
      "--parallax-y",
      `${layer.current.toFixed(3)}px`,
    );
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    layers.forEach((layer) =>
      layer.element.removeAttribute("data-parallax-active"),
    );
  }
  function tick(time) {
    frame = 0;
    if (!allowed()) {
      stop();
      return;
    }
    const delta = previousTime ? Math.min(time - previousTime, 64) : 1000 / 60;
    previousTime = time;
    // Time-based damping feels the same at 60, 90 and 120 Hz.
    const blend = 1 - Math.exp(-delta / 105);
    let moving = false;
    for (const layer of layers) {
      if (!layer.visible) continue;
      const target = targetFor(layer);
      const distance = target - layer.current;
      if (Math.abs(distance) > 0.04) {
        layer.current += distance * blend;
        moving = true;
        layer.element.setAttribute("data-parallax-active", "");
      } else {
        layer.current = target;
        layer.element.removeAttribute("data-parallax-active");
      }
      paint(layer);
    }
    if (moving) frame = requestAnimationFrame(tick);
    else previousTime = 0;
  }
  function schedule() {
    if (!frame && allowed() && layers.some((layer) => layer.visible)) {
      frame = requestAnimationFrame(tick);
    }
  }
  function measure() {
    measurementFrame = 0;
    scroll = window.scrollY;
    const scenes = new Map();
    layers.forEach((layer) => {
      if (!scenes.has(layer.scene)) {
        const bounds = layer.scene.getBoundingClientRect();
        scenes.set(
          layer.scene,
          layer.scene.hasAttribute("data-hero-track")
            ? 0
            : bounds.top + scroll + bounds.height / 2 - innerHeight / 2,
        );
      }
      layer.origin = scenes.get(layer.scene);
      const bounds = layer.element.getBoundingClientRect();
      layer.visible = bounds.bottom > 0 && bounds.top < innerHeight;
    });
    schedule();
  }
  function queueMeasure() {
    if (!measurementFrame && active && !document.hidden)
      measurementFrame = requestAnimationFrame(measure);
  }
  function updateMotion() {
    stop();
    if (reduced || root.dataset.motionPaused === "true") {
      layers.forEach((layer) => {
        layer.current = 0;
        paint(layer);
      });
    } else if (allowed()) {
      queueMeasure();
    }
  }
  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          for (const entry of entries) {
            const layer = layers.find((item) => item.element === entry.target);
            layer.visible = entry.isIntersecting;
            if (!layer.visible)
              layer.element.removeAttribute("data-parallax-active");
          }
          if (layers.some((layer) => layer.visible)) schedule();
          else stop();
        })
      : null;
  layers.forEach((layer) => observer?.observe(layer.element));
  window.addEventListener(
    "scroll",
    () => {
      scroll = window.scrollY;
      if (!observer) queueMeasure();
      schedule();
    },
    { passive: true },
  );
  window.addEventListener("resize", queueMeasure, { passive: true });
  if ("ResizeObserver" in window) {
    const resize = new ResizeObserver(queueMeasure);
    // Body observation also covers FAQ/menu changes and font-driven reflow.
    resize.observe(document.body);
    new Set(layers.map((layer) => layer.scene)).forEach((scene) =>
      resize.observe(scene),
    );
  }
  motion.addEventListener("change", (event) => {
    reduced = event.matches;
    updateMotion();
  });
  document.addEventListener("parking:motionchange", updateMotion);
  document.addEventListener("visibilitychange", updateMotion);
  window.addEventListener("pagehide", () => {
    active = false;
    stop();
    cancelAnimationFrame(measurementFrame);
    measurementFrame = 0;
  });
  window.addEventListener("pageshow", () => {
    active = true;
    reduced = motion.matches;
    updateMotion();
  });
  document.fonts?.ready.then(queueMeasure);
  measure();

  const showcase = document.querySelector("[data-device-showcase]");
  if (!showcase) return;
  const tabs = [...showcase.querySelectorAll("[data-device-tab]")];
  const panel = showcase.querySelector(".device-preview-panel");
  const summary = showcase.querySelector("[data-device-summary]");
  const descriptions = {
    painel: "Consulte os registros no computador e no celular.",
    entrada: "Registre placa, modelo e cor em um formulário simples.",
    remocao: "Confira o veículo antes de confirmar a remoção.",
  };
  function selectTab(tab, focus = false) {
    const selected = tab.dataset.deviceTab;
    tabs.forEach((item) => {
      const chosen = item === tab;
      item.setAttribute("aria-selected", String(chosen));
      item.tabIndex = chosen ? 0 : -1;
    });
    showcase.querySelectorAll("[data-device-view]").forEach((view) => {
      view.hidden = view.dataset.deviceView !== selected;
    });
    showcase
      .querySelector(".mini-nav")
      ?.classList.toggle("active", selected !== "entrada");
    showcase
      .querySelectorAll(".mini-nav")[1]
      ?.classList.toggle("active", selected === "entrada");
    panel.setAttribute("aria-labelledby", tab.id);
    summary.textContent = descriptions[selected];
    if (focus) tab.focus({ preventScroll: true });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      const next = {
        ArrowRight: (index + 1) % tabs.length,
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next], true);
    });
  });
  showcase.querySelector('[role="tablist"]').hidden = false;
})();
