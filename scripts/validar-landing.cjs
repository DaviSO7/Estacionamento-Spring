/* Read-only landing QA: device previews, native parallax, accessible fallbacks and local demo. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const baseURL = process.env.PARKING_URL || "http://localhost:8081";
const output = path.resolve("target/pixel-perfect/qa/landing");
const errors = [];
const mutations = [];
const contexts = [];
let activePage;

async function newPage(browser, label, options = {}, noWebGL = false) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    ...options,
  });
  contexts.push(context);
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      mutations.push(`${request.method()} ${request.url()}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  activePage = page;
  page.on("pageerror", (error) => errors.push(`${label}: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${label}: ${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) =>
    errors.push(`${label}: ${request.failure()?.errorText} ${request.url()}`),
  );
  await page.addInitScript(
    ({ noWebGL }) => {
      window.qaFrames = 0;
      window.qaDraws = 0;
      const requestFrame = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) =>
        requestFrame((time) => {
          window.qaFrames++;
          callback(time);
        });
      const context = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (noWebGL && /webgl/.test(type)) return null;
        return context.call(this, type, ...args);
      };
      for (const prototype of [
        window.WebGLRenderingContext?.prototype,
        window.WebGL2RenderingContext?.prototype,
      ].filter(Boolean)) {
        const draw = prototype.drawArrays;
        prototype.drawArrays = function (...args) {
          window.qaDraws++;
          return draw.apply(this, args);
        };
      }
    },
    { noWebGL },
  );
  return page;
}

async function settle(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function checkOverflow(page, label) {
  const sizes = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    sizes.document <= sizes.width && sizes.body <= sizes.width,
    `${label}: overflow ${JSON.stringify(sizes)}`,
  );
}
async function idle(page, label) {
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => ({
    frames: window.qaFrames,
    draws: window.qaDraws,
  }));
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    frames: window.qaFrames,
    draws: window.qaDraws,
  }));
  assert.deepEqual(
    after,
    before,
    `${label}: no continuous RAF or GPU draw while idle`,
  );
}
async function capture(page, label) {
  for (const section of await page.locator("main > section").all()) {
    await section.scrollIntoViewIfNeeded();
    await settle(page);
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(650);
  await page.screenshot({
    path: path.join(output, `${label}-hero.png`),
    animations: "disabled",
  });
  const wasPaused =
    (await page.locator("html").getAttribute("data-motion-paused")) === "true";
  if (!wasPaused) {
    await page
      .locator("[data-motion-toggle]")
      .evaluate((button) => button.click());
    await settle(page);
  }
  await page.screenshot({
    path: path.join(output, `${label}-full.png`),
    fullPage: true,
    animations: "disabled",
  });
  if (!wasPaused)
    await page
      .locator("[data-motion-toggle]")
      .evaluate((button) => button.click());
}

async function checkDemo(page) {
  const form = page.locator("[data-demo-form]");
  const rows = page.locator("[data-demo-rows] tr");
  const submit = form.locator('[type="submit"]');
  const count = page.locator("[data-demo-count]");
  const initialPlate = await page.locator("#demo-placa").inputValue();
  assert.equal(await rows.count(), 3);
  assert.match(await count.innerText(), /^03(?:\s|$)/);
  assert.equal(await submit.isEnabled(), true);
  for (const id of ["demo-placa", "demo-modelo", "demo-cor"])
    await page.locator(`#${id}`).fill("");
  await submit.click();
  assert.equal(await rows.count(), 3);
  await page.locator("#demo-placa").fill("   ");
  await page.locator("#demo-modelo").fill("Veículo de exemplo");
  await page.locator("#demo-cor").fill("Azul");
  await submit.click();
  assert.equal(await rows.count(), 3, "Whitespace plate rejected");
  await page.locator("#demo-placa").fill(" QA1A234 ");
  await page.locator("#demo-modelo").fill("   ");
  await submit.click();
  assert.equal(await rows.count(), 3, "Whitespace model rejected");
  await page.locator("#demo-modelo").fill(" Veículo de exemplo ");
  await page.locator("#demo-cor").fill("   ");
  await submit.click();
  assert.equal(await rows.count(), 3, "Whitespace color rejected");
  await page.locator("#demo-cor").fill(" Azul ");
  const literal = '<img src="x" onerror="window.qaInjected=true">';
  await page.locator("#demo-observacao").fill(literal);
  await submit.click();
  assert.equal(await rows.count(), 4);
  const row = page.locator("[data-demo-row]");
  assert.ok((await row.innerText()).includes(literal));
  assert.equal(await row.locator("img").count(), 0);
  assert.equal(await page.evaluate(() => Boolean(window.qaInjected)), false);
  assert.equal(await row.locator("td").first().innerText(), "QA1A234");
  assert.match(
    await page.locator("[data-demo-status]").innerText(),
    /Nada foi salvo/,
  );
  await submit.click();
  assert.equal(await rows.count(), 4, "Repeating simulation replaces one row");
  await page.locator("[data-demo-reset]").click();
  assert.equal(await rows.count(), 3);
  assert.equal(await page.locator("#demo-placa").inputValue(), initialPlate);
  assert.match(await count.innerText(), /^03(?:\s|$)/);
  assert.deepEqual(mutations, [], "Demo is local only");
}

async function checkLayoutAndMenu(page) {
  await page.goto(baseURL);
  await page.locator("#hero-title").waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator("h1").count(), 1);
  const invalidAnchors = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter(
          (href) =>
            href.length < 2 ||
            !document.getElementById(decodeURIComponent(href.slice(1))),
        ),
    );
  assert.deepEqual(invalidAnchors, []);
  assert.equal(
    await page
      .locator(
        "[data-hero-video], [data-hero-track] video, [data-hero-track] img",
      )
      .count(),
    0,
    "Hero no longer uses generated image/video",
  );
  assert.notEqual(
    await page
      .locator(".hero-pin")
      .evaluate((el) => getComputedStyle(el).position),
    "sticky",
    "No obsolete video scroll runway",
  );
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 960 });
    await settle(page);
    await checkOverflow(page, `${width}px`);
  }
  await capture(page, "desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  const toggle = page.locator("[data-menu-toggle]");
  assert.equal(await toggle.isVisible(), true);
  await toggle.focus();
  await page.keyboard.press("Enter");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator("#landing-menu a").first().isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  assert.equal(
    await toggle.evaluate((el) => document.activeElement === el),
    true,
  );
  await toggle.click();
  await page.locator("#landing-menu a").first().click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  const details = page.locator("details").first();
  assert.ok(await details.count());
  await details.locator("summary").focus();
  const before = await details.evaluate((el) => el.open);
  await page.keyboard.press("Enter");
  assert.equal(await details.evaluate((el) => el.open), !before);
  await page.keyboard.press("Enter");
  await checkDemo(page);
  await capture(page, "mobile");
}

async function checkTypography(page) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(baseURL);
  await page.locator(".pp-char").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const variants = await page
    .locator("[data-text-fx]")
    .evaluateAll((headings) =>
      [...new Set(headings.map((h) => h.dataset.textFx))].sort(),
    );
  assert.deepEqual(variants, ["fx16", "fx2", "fx6"]);
  for (const heading of await page.locator("[data-text-fx]").all()) {
    assert.ok((await heading.locator(".pp-sr-only").innerText()).trim());
    assert.equal(
      await heading.locator(".pp-text-visual").getAttribute("aria-hidden"),
      "true",
    );
    assert.ok(await heading.locator(".pp-char").count());
  }
  for (const effect of ["fx2", "fx6", "fx16"]) {
    const candidates = page.locator(`[data-text-fx="${effect}"]`);
    const heading = candidates.last();
    const geometry = await heading.evaluate((el) => ({
      top: el.getBoundingClientRect().top + scrollY,
      height: innerHeight,
    }));
    if (geometry.top < geometry.height * 0.72) {
      assert.equal(
        effect,
        "fx2",
        "Only above-fold hero may remain fully readable",
      );
      continue;
    }
    const states = [];
    for (const fraction of [0.93, 0.63, 0.93]) {
      await page.evaluate(
        ({ top, height, fraction }) =>
          scrollTo({ top: top - height * fraction, behavior: "instant" }),
        { ...geometry, fraction },
      );
      await settle(page);
      await page.waitForTimeout(50);
      states.push(
        await heading
          .locator(".pp-char, .pp-word, .pp-text-visual")
          .evaluateAll((els) =>
            els.map((el) => ({
              transform: getComputedStyle(el).transform,
              opacity: getComputedStyle(el).opacity,
            })),
          ),
      );
    }
    assert.notDeepEqual(states[0], states[1], `${effect} changes with scroll`);
    assert.deepEqual(
      states[0],
      states[2],
      `${effect} reverses at same scroll position`,
    );
  }
}

async function checkContourAndDevices(page) {
  await page.goto(baseURL);
  await page.locator('[data-contour-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const initialDraws = await page.evaluate(() => window.qaDraws);
  await page.waitForFunction((count) => window.qaDraws > count, initialDraws);
  assert.ok(
    (await page.evaluate(() => window.qaDraws)) > initialDraws,
    "Visible contour renders",
  );
  await page.locator("[data-motion-toggle]").click();
  assert.equal(
    await page.locator("html").getAttribute("data-motion-paused"),
    "true",
  );
  await idle(page, "Paused contour");
  await page.locator("[data-motion-toggle]").click();
  await page.waitForTimeout(180);
  const resumed = await page.evaluate(() => window.qaDraws);
  await page.waitForFunction((count) => window.qaDraws > count, resumed);
  assert.ok((await page.evaluate(() => window.qaDraws)) > resumed);
  await page.locator("main > section").last().scrollIntoViewIfNeeded();
  await settle(page);
  await idle(page, "Contour outside viewport");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(1000);
  assert.equal(await page.locator("[data-car-demo]").count(), 0);
  const tabs = page.locator("[data-device-tab]");
  assert.equal(await tabs.count(), 3);
  const checkPreview = async (name) => {
    assert.equal(
      await page.locator("[data-device-view]:not([hidden])").count(),
      2,
    );
    assert.equal(
      await page
        .locator('[data-device-view="' + name + '"]:not([hidden])')
        .count(),
      2,
    );
    const tab = page.locator('[data-device-tab="' + name + '"]');
    assert.equal(await tab.getAttribute("aria-selected"), "true");
    assert.equal(
      await page
        .locator(".device-preview-panel")
        .getAttribute("aria-labelledby"),
      await tab.getAttribute("id"),
    );
  };
  for (const name of ["entrada", "remocao", "painel"]) {
    await page.locator('[data-device-tab="' + name + '"]').click();
    await checkPreview(name);
  }
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await checkPreview("entrada");
  await page.keyboard.press("End");
  await checkPreview("remocao");
  await page.keyboard.press("ArrowRight");
  await checkPreview("painel");
  await page.keyboard.press("ArrowLeft");
  await checkPreview("remocao");
  await page.keyboard.press("Home");
  await checkPreview("painel");
  assert.equal(await page.locator('[role="tab"][tabindex="0"]').count(), 1);
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator(".device-preview-panel")
      .evaluate((el) => el === document.activeElement),
    true,
    "Tab reaches the selected preview",
  );
  const offsets = () =>
    page
      .locator(".mock-laptop, .mock-phone")
      .evaluateAll((elements) =>
        elements.map(
          (element) =>
            new DOMMatrixReadOnly(getComputedStyle(element).transform).m42,
        ),
      );
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(1000);
  const atTop = await offsets();
  // Native scroll reaches the requested position immediately; the artwork eases toward it.
  await page.evaluate(() => scrollTo({ top: 260, behavior: "instant" }));
  await page.waitForTimeout(55);
  const easing = await offsets();
  assert.equal(await page.evaluate(() => scrollY), 260);
  await page.waitForTimeout(950);
  const settled = await offsets();
  assert.ok(
    settled[0] < -15 && settled[1] < settled[0] * 1.7,
    "Foreground and background move at different depths",
  );
  assert.ok(
    easing[0] > settled[0] + 1 && easing[0] < atTop[0],
    "Visual layer interpolates instead of jumping",
  );
  assert.equal(
    await page.locator("[data-parallax-active]").count(),
    0,
    "RAF settles and drops compositor hints",
  );
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(1100);
  const reversed = await offsets();
  reversed.forEach((value, index) =>
    assert.ok(
      Math.abs(value - atTop[index]) < 0.1,
      "Parallax reverses to its original position",
    ),
  );
  await page.evaluate(() => scrollTo({ top: 220, behavior: "instant" }));
  await page.waitForTimeout(45);
  await page
    .locator("[data-motion-toggle]")
    .evaluate((button) => button.click());
  assert.deepEqual(await offsets(), [0, 0], "Global pause resets layers");
  await idle(page, "All motion paused");
  await page.locator('[data-device-tab="entrada"]').click();
  await checkPreview("entrada");
  await page
    .locator("[data-motion-toggle]")
    .evaluate((button) => button.click());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => document.querySelector("[data-motion-toggle]").disabled,
  );
  assert.deepEqual(await offsets(), [0, 0]);
  await idle(page, "Dynamic reduced motion");
  await page.locator('[data-device-tab="remocao"]').click();
  await checkPreview("remocao");
  await page.screenshot({
    path: path.join(output, "dispositivos-remocao.png"),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".device-showcase").scrollIntoViewIfNeeded();
  await checkPreview("remocao");
  await checkOverflow(page, "Mobile device views");
  await page.screenshot({ path: path.join(output, "dispositivos-mobile.png") });
  await page.locator('[data-device-tab="entrada"]').click();
  await checkPreview("entrada");
  await page.screenshot({
    path: path.join(output, "dispositivos-entrada-mobile.png"),
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(180);
  const restored = await page.evaluate(() => window.qaDraws);
  await page.waitForFunction((count) => window.qaDraws > count, restored);
  await page.locator("main > section").last().scrollIntoViewIfNeeded();
  await idle(page, "All parallax outside viewport");
}

async function checkFallbacks(browser) {
  const reduced = await newPage(browser, "reduced motion", {
    reducedMotion: "reduce",
  });
  await reduced.goto(baseURL);
  await reduced.evaluate(() => document.fonts.ready);
  await settle(reduced);
  const hidden = await reduced
    .locator(
      "[data-reveal], [data-flow-step], .pp-char, .pp-word, .pp-text-visual",
    )
    .evaluateAll(
      (els) =>
        els.filter(
          (el) =>
            getComputedStyle(el).opacity !== "1" ||
            getComputedStyle(el).visibility === "hidden",
        ).length,
    );
  assert.equal(hidden, 0, "Reduced-motion text is fully visible");
  assert.equal(
    await reduced.locator("[data-motion-toggle]").isDisabled(),
    true,
  );
  await idle(reduced, "Reduced motion on initial load");
  await reduced.screenshot({
    path: path.join(output, "reduced-motion.png"),
    fullPage: true,
  });

  const fallback = await newPage(browser, "no WebGL", {}, true);
  await fallback.goto(baseURL);
  await fallback.locator(".pp-char").first().waitFor();
  assert.equal(
    await fallback.locator('[data-contour-ready="true"]').count(),
    0,
  );
  assert.notEqual(
    await fallback
      .locator("[data-contour]")
      .evaluate((el) => getComputedStyle(el).backgroundImage),
    "none",
  );
  assert.equal(await fallback.locator("#hero-title").isVisible(), true);
  await fallback.evaluate(() => document.fonts.ready);
  // Let the one-shot hero entrance and its visibility observations finish.
  await fallback.waitForTimeout(750);
  await idle(fallback, "CSS contour fallback");
  await fallback.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
  await fallback.waitForTimeout(1000);
  await idle(fallback, "Parallax stops requesting frames after scroll settles");
  await fallback.screenshot({
    path: path.join(output, "no-webgl.png"),
    animations: "disabled",
  });

  const noJS = await newPage(browser, "no JavaScript", {
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noJS.goto(baseURL);
  assert.equal(await noJS.locator(".pp-char").count(), 0);
  for (const heading of await noJS.locator("[data-text-fx]").all()) {
    assert.ok((await heading.innerText()).trim());
    assert.equal(
      await heading.evaluate((el) => getComputedStyle(el).opacity),
      "1",
    );
  }
  assert.equal(
    await noJS.locator('[data-demo-form] [type="submit"]').isDisabled(),
    true,
  );
  assert.equal(
    await noJS.locator("#landing-menu a").first().isVisible(),
    true,
    "No-JS mobile navigation remains available",
  );
  assert.equal(await noJS.locator('[role="tablist"]').isVisible(), false);
  assert.equal(
    await noJS.locator('[data-device-view="painel"]:not([hidden])').count(),
    2,
  );
  assert.equal(await noJS.locator(".mock-laptop").isVisible(), true);
  assert.equal(await noJS.locator(".mock-phone").isVisible(), true);
  await checkOverflow(noJS, "No JS mobile");
  await noJS.screenshot({
    path: path.join(output, "no-javascript-mobile.png"),
    fullPage: true,
  });
}

async function checkUseLayouts(page) {
  await page.bringToFront();
  await page.goto(baseURL);
  await page.evaluate(() => document.fonts.ready);
  const host = page.locator("[data-perspective]");
  const text = page.locator("[data-perspective-text]");
  const top = await host.evaluate(
    (el) => el.getBoundingClientRect().top + scrollY,
  );
  const transforms = [];
  for (const fraction of [0.85, 0.4, 0.85]) {
    await page.evaluate(
      ({ top, fraction }) =>
        scrollTo({ top: top - innerHeight * fraction, behavior: "instant" }),
      { top, fraction },
    );
    await settle(page);
    transforms.push(
      await text.evaluate((el) => getComputedStyle(el).transform),
    );
  }
  assert.notEqual(
    transforms[0],
    transforms[1],
    "Perspectiva acompanha o scroll",
  );
  assert.equal(transforms[0], transforms[2], "Perspectiva reversível");
  await page
    .locator("[data-motion-toggle]")
    .evaluate((button) => button.click());
  await settle(page);
  assert.equal(
    await text.evaluate((el) => getComputedStyle(el).transform),
    "none",
  );
  const invite = page.locator(".access-invite");
  await invite.scrollIntoViewIfNeeded();
  await invite.focus();
  assert.equal(await invite.locator(".sr-only").innerText(), "Acessar sistema");
  assert.equal(await invite.getAttribute("href"), "/login");
  await page.screenshot({ path: path.join(output, "convite-acesso.png") });
  await page
    .locator("[data-motion-toggle]")
    .evaluate((button) => button.click());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await settle(page);
  assert.equal(
    await text.evaluate((el) => getComputedStyle(el).transform),
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    const page = await newPage(browser, "landing");
    await checkLayoutAndMenu(page);
    await checkTypography(page);
    await checkContourAndDevices(page);
    await checkFallbacks(browser);
    await checkUseLayouts(page);
    assert.deepEqual(mutations, [], "No writes in landing QA");
    assert.deepEqual(errors, [], "No browser or resource errors");
    fs.writeFileSync(
      path.join(output, "result.json"),
      JSON.stringify({ passed: true, mutations, screenshots: output }, null, 2),
    );
    console.log(
      "PASS: 320/360/390/768/1024/1440px; laptop/phone with three Portuguese previews; keyboard tabs; damped reversible parallax and idle RAF; contour pause/reduced/offscreen/no-WebGL; text effects; menu/FAQ; safe local demo; no-JS; no writes or browser errors.",
    );
    console.log(`Screenshots: ${output}`);
  } catch (error) {
    console.error("Browser errors:", errors, "Blocked writes:", mutations);
    if (activePage && !activePage.isClosed())
      console.error(
        "Motion state:",
        await activePage.evaluate(() => ({
          reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
          hidden: document.hidden,
          paused: document.documentElement.dataset.motionPaused,
          toggleDisabled: document.querySelector("[data-motion-toggle]")
            ?.disabled,
          driving: document.querySelector("[data-car-demo]")?.dataset.driving,
          status: document.querySelector("[data-car-status]")?.textContent,
          frames: window.qaFrames,
          animations: document
            .querySelector("[data-car-vehicle]")
            ?.getAnimations()
            .map((animation) => animation.playState),
        })),
      );
    if (activePage && !activePage.isClosed())
      await activePage.screenshot({
        path: path.join(output, "failure.png"),
        fullPage: true,
      });
    throw error;
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
