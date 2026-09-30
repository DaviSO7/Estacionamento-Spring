/* Native browser adaptations of Pixel Perfect by vansh-nagar:
 * https://github.com/vansh-nagar/Pixel-Perfect
 * registry/new-york/text/scroll-typography/effects.ts (fx2, fx6, fx16)
 * registry/new-york/backgrounds/contour-map-background.tsx (landscape shader)
 * These adapters keep the existing Spring HTML/CSS/JS architecture. The source
 * effects use React/GSAP/Motion; no runtime dependency is required here.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Keep RAF checks independent of MediaQueryList.matches. Reading that live
  // property during a frame can consume Chrome's pending change notification.
  let prefersReducedMotion = reduced.matches;
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const controllers = [];
  let activePage = true;
  let textFrame = 0;
  const paused = () => root.dataset.motionPaused === "true";
  const staticMotion = () => prefersReducedMotion || paused();
  const running = () => activePage && !document.hidden && !staticMotion();

  // Each heading keeps one complete accessible text node. Its split visual
  // counterpart is hidden from screen readers and preserves <br> and emphasis.
  const segmenter =
    typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter("pt-BR", { granularity: "grapheme" })
      : null;
  const graphemes = (text) =>
    segmenter
      ? Array.from(segmenter.segment(text), (part) => part.segment)
      : Array.from(text);

  function headingText(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeName === "BR") return " ";
    return Array.from(node.childNodes, headingText).join("");
  }

  function splitHeading(heading) {
    const accessible = document.createElement("span");
    accessible.className = "pp-sr-only";
    accessible.textContent = headingText(heading).replace(/\s+/g, " ").trim();
    const visual = document.createElement("span");
    visual.className = "pp-text-visual";
    visual.setAttribute("aria-hidden", "true");
    while (heading.firstChild) visual.appendChild(heading.firstChild);
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const words = [];
    const chars = [];
    nodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.textContent
        .split(/(\s+)/u)
        .filter(Boolean)
        .forEach((part) => {
          if (/^\s+$/u.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            return;
          }
          const word = document.createElement("span");
          word.className = "pp-word";
          words.push(word);
          graphemes(part).forEach((character) => {
            const char = document.createElement("span");
            char.className = "pp-char";
            char.textContent = character;
            chars.push(char);
            word.appendChild(char);
          });
          fragment.appendChild(word);
        });
      node.replaceWith(fragment);
    });
    heading.append(accessible, visual);
    const bounds = heading.getBoundingClientRect();
    return {
      heading,
      visual,
      words,
      chars,
      effect: heading.dataset.textFx,
      visible: true,
      // Above-the-fold copy must be legible before the visitor scrolls.
      initialVisible:
        bounds.top < window.innerHeight * 0.72 && bounds.bottom > 0,
    };
  }

  const headings = Array.from(document.querySelectorAll("[data-text-fx]"))
    .filter((heading) =>
      ["fx2", "fx6", "fx16"].includes(heading.dataset.textFx),
    )
    .map(splitHeading);

  function renderHeading(item, progress) {
    const complete = progress >= 1;
    if (item.effect === "fx16") {
      item.visual.style.transform = complete
        ? "none"
        : `rotate(${(1 - progress) * 3}deg)`;
      item.words.forEach((word, index) => {
        const offset = (index / Math.max(1, item.words.length - 1)) * 0.2;
        const value = clamp((progress - offset) / (1 - offset));
        word.style.opacity = complete ? "1" : String(0.25 + value * 0.75);
      });
      return;
    }
    item.chars.forEach((char, index) => {
      const offset = (index / Math.max(1, item.chars.length - 1)) * 0.15;
      const value = clamp((progress - offset) / (1 - offset));
      const ease = value * value * (3 - 2 * value);
      const remaining = 1 - ease;
      char.style.opacity = complete ? "1" : String(0.12 + ease * 0.88);
      char.style.transform = complete
        ? "none"
        : item.effect === "fx2"
          ? `translateY(${remaining * 65}%) scale(${1 - remaining * 0.2}, ${1 + remaining * 0.85})`
          : `translateY(${remaining * 50}%) rotateX(${-90 * remaining}deg)`;
    });
  }

  function drawText() {
    textFrame = 0;
    if (!activePage || document.hidden) return;
    const height = window.innerHeight;
    // Read bounds together before changing transforms: no layout read per glyph.
    const items = headings.filter((item) => item.visible || staticMotion());
    const bounds = items.map((item) => item.heading.getBoundingClientRect());
    items.forEach((item, index) => {
      const progress =
        staticMotion() || item.initialVisible
          ? 1
          : clamp((height * 1.03 - bounds[index].top) / (height * 0.37));
      renderHeading(item, progress);
    });
  }

  function scheduleText(force = false) {
    if (
      force !== true &&
      (staticMotion() || !headings.some((item) => item.visible))
    )
      return;
    if (!textFrame && activePage && !document.hidden)
      textFrame = requestAnimationFrame(drawText);
  }

  if ("IntersectionObserver" in window && headings.length) {
    const lookup = new Map(headings.map((item) => [item.heading, item]));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          lookup.get(entry.target).visible = entry.isIntersecting;
        });
        scheduleText();
      },
      { rootMargin: "18% 0px" },
    );
    headings.forEach((item) => observer.observe(item.heading));
  }
  if (headings.length) {
    window.addEventListener("scroll", scheduleText, { passive: true });
    window.addEventListener("resize", scheduleText, { passive: true });
    document.fonts?.ready.then(scheduleText);
    scheduleText(true);
  }

  const vertexSource =
    "attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }";
  // Pixel Perfect's three-octave landscape and derivative-based contour width.
  const fragmentSource = `#extension GL_OES_standard_derivatives : enable
precision mediump float;
uniform vec2 uSize;
uniform float uTime;
uniform float uLevels;
uniform float uWidth;
uniform vec3 uInk;
uniform vec3 uPaper;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float landscape(vec2 p, float t) {
  float v = 0.0;
  v += 0.55 * noise(p * 1.4 + vec2(t * 0.05, -t * 0.03));
  v += 0.30 * noise(p * 3.1 + vec2(-t * 0.04, t * 0.06) + 7.0);
  v += 0.15 * noise(p * 6.5 + vec2(t * 0.08, t * 0.02) + 19.0);
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  vec2 p = vec2(uv.x * uSize.x / uSize.y, uv.y);
  float h = landscape(p, uTime) * uLevels;
  float grad = length(vec2(dFdx(h), dFdy(h))) + 1e-5;
  float f = fract(h);
  float d = min(f, 1.0 - f);
  float halfWidth = uWidth * grad;
  float aa = grad;
  float line = 1.0 - smoothstep(halfWidth, halfWidth + aa, d);
  float thick = 1.0 - smoothstep(halfWidth * 2.2, halfWidth * 2.2 + aa, d);
  float level = floor(h + 0.5);
  float isIndex = 1.0 - step(0.2, fract(level / 5.0));
  float ink = max(line * 0.55, thick * isIndex);
  gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
}`;

  function createContour(host) {
    const canvas = host.querySelector("canvas");
    if (!canvas) return;
    canvas.setAttribute("aria-hidden", "true");
    let gl;
    try {
      gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    } catch {
      return;
    }
    if (!gl || !gl.getExtension("OES_standard_derivatives")) return;
    const program = gl.createProgram();
    if (!program) return;
    const shaders = [];
    let buffer;
    const dispose = () => {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [gl.FRAGMENT_SHADER, fragmentSource],
    ]) {
      const shader = gl.createShader(type);
      if (!shader) {
        dispose();
        return;
      }
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        dispose();
        return;
      }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      dispose();
      return;
    }
    gl.useProgram(program);
    buffer = gl.createBuffer();
    if (!buffer) {
      dispose();
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name) => gl.getUniformLocation(program, name);
    const sizeUniform = uniform("uSize");
    const timeUniform = uniform("uTime");
    const widthUniform = uniform("uWidth");
    gl.uniform3fv(uniform("uInk"), [72 / 255, 84 / 255, 128 / 255]);
    gl.uniform3fv(uniform("uPaper"), [19 / 255, 22 / 255, 29 / 255]);
    gl.uniform1f(uniform("uLevels"), 14);
    let frame = 0;
    let elapsed = 0;
    let previous = 0;
    let lost = false;
    const rect = host.getBoundingClientRect();
    let visible = rect.bottom > 0 && rect.top < window.innerHeight;

    function draw() {
      if (lost || !canvas.width || !canvas.height) return;
      gl.uniform1f(timeUniform, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function tick(now) {
      if (!running() || !visible || lost) {
        frame = 0;
        return;
      }
      // Limit GPU work to 30 draws/second even on high-refresh displays.
      if (now - previous >= 1000 / 30) {
        elapsed += Math.min((now - previous) / 1000, 0.1) * 0.35;
        previous = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (prefersReducedMotion) elapsed = 0;
      if (activePage && !document.hidden && visible) draw();
      if (running() && visible && !lost) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    function resize() {
      if (lost) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(host.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(host.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(sizeUniform, canvas.width, canvas.height);
      gl.uniform1f(widthUniform, 0.48 * dpr);
      if (activePage && !document.hidden) draw();
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(host);
    else window.addEventListener("resize", resize, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        update();
      }).observe(host);
    } else {
      window.addEventListener(
        "scroll",
        () => {
          const bounds = host.getBoundingClientRect();
          const nextVisible =
            bounds.bottom > 0 && bounds.top < window.innerHeight;
          if (visible !== nextVisible) {
            visible = nextVisible;
            update();
          }
        },
        { passive: true },
      );
    }
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      host.removeAttribute("data-contour-ready");
    });
    resize();
    host.dataset.contourReady = "true";
    controllers.push(update);
    update();
  }
  document.querySelectorAll("[data-contour]").forEach(createContour);

  const toggles = Array.from(document.querySelectorAll("[data-motion-toggle]"));
  function updateMotion() {
    toggles.forEach((button) => {
      const label = paused() ? "Retomar animações" : "Pausar animações";
      button.setAttribute("aria-pressed", String(paused()));
      button.setAttribute("aria-label", label);
      const text = button.querySelector("[data-motion-label]");
      if (text) text.textContent = label;
      else button.textContent = label;
      button.disabled = prefersReducedMotion;
      button.title = prefersReducedMotion
        ? "Movimento reduzido nas preferências do sistema"
        : label;
      button.hidden = false;
    });
    controllers.forEach((update) => update());
    scheduleText(true);
  }
  toggles.forEach((button) => {
    button.addEventListener("click", () => {
      root.dataset.motionPaused = String(!paused());
      updateMotion();
      document.dispatchEvent(
        new CustomEvent("parking:motionchange", {
          detail: { paused: paused() },
        }),
      );
    });
  });
  reduced.addEventListener("change", (event) => {
    prefersReducedMotion = event.matches;
    updateMotion();
  });
  document.addEventListener("visibilitychange", updateMotion);
  window.addEventListener("pagehide", () => {
    activePage = false;
    cancelAnimationFrame(textFrame);
    textFrame = 0;
    updateMotion();
  });
  window.addEventListener("pageshow", () => {
    activePage = true;
    prefersReducedMotion = reduced.matches;
    updateMotion();
  });
  updateMotion();
})();
