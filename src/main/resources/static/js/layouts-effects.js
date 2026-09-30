// Perspectiva de texto adaptada de useLayouts/perspective-text-scroll.
// Movimento contido, texto legível e atualização somente quando necessário.
const host = document.querySelector("[data-perspective]");
const text = host?.querySelector("[data-perspective-text]");
if (text) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = query.matches;
  let visible = true;
  let frame = 0;
  const paused = () =>
    reduced || document.documentElement.dataset.motionPaused === "true";
  function render() {
    frame = 0;
    if (document.hidden) return;
    if (paused()) {
      text.style.transform = "none";
      return;
    }
    if (!visible) return;
    const bounds = host.getBoundingClientRect();
    const progress = Math.max(
      0,
      Math.min(1, (innerHeight - bounds.top) / (innerHeight + bounds.height)),
    );
    const angle =
      progress < 0.5 ? 16 * (1 - progress * 2) : -12 * (progress * 2 - 1);
    const offset =
      progress < 0.5 ? 20 * (1 - progress * 2) : -12 * (progress * 2 - 1);
    text.style.transform = `rotateX(${angle}deg) translate3d(0, ${offset}px, 0)`;
  }
  function schedule() {
    if (!frame && !document.hidden && (visible || paused()))
      frame = requestAnimationFrame(render);
  }
  if ("IntersectionObserver" in window)
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }).observe(host);
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  query.addEventListener("change", (event) => {
    reduced = event.matches;
    schedule();
  });
  document.addEventListener("parking:motionchange", schedule);
  document.addEventListener("visibilitychange", schedule);
  addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    frame = 0;
  });
  addEventListener("pageshow", schedule);
  document.fonts?.ready.then(schedule);
  schedule();
}
