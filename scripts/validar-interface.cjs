/* Browser integration QA. Mutations are restricted to a verified local H2 memory server. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const baseURL = process.env.PARKING_URL || "http://localhost:8081";
const output = path.resolve("target/pixel-perfect/qa/interface");
const errors = [];
const posts = [];

function verifyDisposableServer() {
  const url = new URL(baseURL);
  assert.equal(url.protocol, "http:", "QA requires local HTTP");
  assert.ok(
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname),
    "QA must run locally",
  );
  assert.equal(
    process.platform,
    "win32",
    "This safety guard verifies the Windows preview process",
  );
  const port = Number(url.port || 80);
  assert.ok(Number.isInteger(port) && port > 0 && port < 65536);
  const command =
    "$ErrorActionPreference='Stop'; " +
    `$listener = Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object -First 1; ` +
    "if (!$listener) { throw 'Preview listener missing' }; " +
    "Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $listener.OwningProcess) | " +
    "Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress";
  const server = JSON.parse(
    execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", command],
      { encoding: "utf8" },
    ),
  );
  assert.match(
    server.CommandLine,
    /--spring\.datasource\.url=jdbc:h2:mem:[^\s"']+/,
    "Refusing POSTs: listener must explicitly use H2 memory",
  );
  assert.doesNotMatch(
    server.CommandLine,
    /jdbc:h2:file:|--spring\.datasource\.url=(?!jdbc:h2:mem:)/,
    "Refusing persistent or overridden database",
  );
  fs.writeFileSync(
    path.join(output, "memory-server.json"),
    JSON.stringify(server, null, 2),
  );
  console.log(
    `Verified disposable H2 memory preview: PID ${server.ProcessId}, port ${port}`,
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

async function captureLayouts(page, label) {
  await page.evaluate(() => document.fonts.ready);
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 960 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await checkOverflow(page, `${label} at ${width}px`);
    if (width === 768)
      await page.screenshot({
        path: path.join(output, `${label}-tablet.png`),
        fullPage: true,
        animations: "disabled",
      });
  }
  await page.screenshot({
    path: path.join(output, `${label}-desktop.png`),
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(output, `${label}-mobile.png`),
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 960 });
}

async function requiredValidation(page, selector, field) {
  const before = posts.length;
  await page.locator(selector).click();
  assert.equal(posts.length, before, "Invalid form never submits");
  assert.equal(
    await page.locator(field).evaluate((input) => input.validity.valid),
    false,
  );
  assert.equal(
    await page.locator(field).getAttribute("aria-invalid"),
    "true",
    "Invalid field exposes its state",
  );
  assert.ok(
    (await page.locator(".field-error").allTextContents()).some((text) =>
      text.trim(),
    ),
    "Inline validation explains the error",
  );
}

async function checkPassword(page, id) {
  const field = page.locator(`#${id}`);
  const toggle = page.locator(`[data-password-toggle][aria-controls="${id}"]`);
  assert.equal(await field.getAttribute("type"), "password");
  await toggle.focus();
  await page.keyboard.press("Enter");
  assert.equal(await field.getAttribute("type"), "text");
  assert.equal(await toggle.getAttribute("aria-pressed"), "true");
  assert.equal(await toggle.getAttribute("aria-label"), "Ocultar senha");
  await page.keyboard.press("Enter");
  assert.equal(await field.getAttribute("type"), "password");
  assert.equal(await toggle.getAttribute("aria-pressed"), "false");
}

async function fillAccount(page, email) {
  await page.locator("#inputNome").fill("Teste visual descartável");
  await page.locator("#inputCPF").fill("01234567890");
  await page.locator("#inputTelefone").fill("11987654321");
  await page.locator("#inputEmailCadastro").fill(email);
  await page.locator("#inputSenhaCadastro").fill("senha-visual");
  await page.locator("#inputDataNascimento").fill("2000-01-01");
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  verifyDisposableServer();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) =>
    errors.push(`${request.failure()?.errorText} ${request.url()}`),
  );
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      assert.equal(
        new URL(request.url()).origin,
        new URL(baseURL).origin,
        "No external mutations",
      );
      posts.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
    await route.continue();
  });
  try {
    await page.goto(baseURL + "/login");
    await captureLayouts(page, "login");
    await requiredValidation(
      page,
      'form[action="/autenticar"] [type="submit"]',
      "#inputEmail",
    );
    await checkPassword(page, "inputSenha");
    await page.locator("#inputEmail").fill("inexistente-qa@example.com");
    await page.locator("#inputSenha").fill("senha-incorreta");
    await page.getByRole("button", { name: /^Entrar/ }).click();
    await page.getByRole("alert").waitFor();
    assert.match(await page.getByRole("alert").innerText(), /e-mail|senha/i);
    await captureLayouts(page, "erro-acesso");
    await page.getByRole("link", { name: /Tentar novamente/ }).click();
    await page.waitForURL("**/login");

    await page.goto(baseURL + "/cadastro");
    await captureLayouts(page, "cadastro");
    await requiredValidation(
      page,
      'form[action="/efetuarCadastro"] [type="submit"]',
      "#inputNome",
    );
    await checkPassword(page, "inputSenhaCadastro");
    const email = `pixel-${Date.now()}@example.com`;
    await fillAccount(page, email);
    await page.getByRole("button", { name: /^Criar conta/ }).click();
    await page.waitForURL("**/login");
    assert.match(await page.getByRole("status").innerText(), /Conta criada/i);
    await captureLayouts(page, "conta-criada");
    await page.locator("#inputEmail").fill(email);
    await page.locator("#inputSenha").fill("senha-visual");
    await page.getByRole("button", { name: /^Entrar/ }).click();
    await page.waitForURL("**/painel");
    assert.equal(
      await page.locator(".empty-state").count(),
      1,
      "Start the preview with a fresh H2 memory database to test its real empty state",
    );
    assert.equal(await page.locator(".records-table tbody tr").count(), 0);
    await captureLayouts(page, "painel-vazio");
    await page
      .getByRole("link", { name: /Registrar entrada/ })
      .first()
      .click();
    await page.waitForURL("**/veiculo/registrar-entrada");
    await captureLayouts(page, "entrada");
    await requiredValidation(
      page,
      'form[action="/veiculo/cadastrar"] [type="submit"]',
      "#placa",
    );
    await captureLayouts(page, "entrada-validacao");
    const plate = `QA${Date.now().toString().slice(-7)}`;
    const note =
      '<svg onload="window.qaInjection=true">Exemplo descartável</svg>';
    await page.locator("#placa").fill(plate);
    await page.locator("#modelo").fill("Veículo de teste");
    await page.locator("#cor").fill("Prata");
    await page.locator("#observacao").fill(note);
    await page.getByRole("button", { name: /^Registrar entrada/ }).click();
    await page.waitForURL("**/painel");
    assert.match(
      await page.getByRole("status").innerText(),
      /Entrada registrada/i,
    );
    const row = page
      .locator(".records-table tbody tr")
      .filter({ hasText: plate });
    assert.equal(await row.count(), 1);
    assert.ok(
      (await row.innerText()).includes(note),
      "Backend output remains escaped in the template",
    );
    assert.equal(await row.locator(".record-note svg").count(), 0);
    assert.equal(await page.evaluate(() => Boolean(window.qaInjection)), false);
    assert.equal(await page.locator(".empty-state").count(), 0);
    await captureLayouts(page, "painel-sucesso");
    const removalLink = row.getByRole("link", { name: /Remover veículo/ });
    const removalPath = await removalLink.getAttribute("href");
    const beforeRemoval = posts.length;
    await removalLink.click();
    await page.waitForURL("**/remover");
    await captureLayouts(page, "remocao");
    assert.equal(posts.length, beforeRemoval, "Conferir não remove");
    assert.ok(
      (await page.locator(".removal-details").innerText()).includes(note),
    );
    assert.equal(await page.locator(".removal-details script").count(), 0);
    const confirm = page.locator("[data-delete-button]");
    await confirm.focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page.locator("[data-delete-label]").innerText(),
      "Cancelar remoção",
    );
    await page.screenshot({
      path: path.join(output, "remocao-contagem.png"),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("[data-delete-label]").innerText(),
      "Confirmar remoção",
    );
    await confirm.click();
    await confirm.click();
    assert.match(
      await page.locator("[data-delete-status]").innerText(),
      /cancelada/,
    );
    await page.waitForTimeout(5200);
    assert.equal(
      posts.length,
      beforeRemoval,
      "Cancelar não envia POST, nem depois do prazo",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.ok(
      await confirm.evaluate((el) =>
        getComputedStyle(el)
          .transitionDuration.split(",")
          .every((value) => parseFloat(value) <= 0.001),
      ),
      "Movimento reduzido elimina transições perceptíveis",
    );
    await confirm.click();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
      delete document.hidden;
    });
    assert.match(
      await page.locator("[data-delete-status]").innerText(),
      /cancelada/,
    );
    await confirm.click();
    await page.waitForURL("**/painel", { timeout: 15000 });
    assert.equal(
      posts.length,
      beforeRemoval + 1,
      "Apenas um POST confirma a remoção",
    );
    assert.match(
      await page.getByRole("status").innerText(),
      /Veículo removido/,
    );
    assert.equal(await page.locator(".empty-state").count(), 1);
    await captureLayouts(page, "remocao-sucesso");
    await page.goto(baseURL + removalPath);
    await page.waitForURL("**/painel");
    assert.match(await page.getByRole("alert").innerText(), /já foi removido/);
    await captureLayouts(page, "remocao-inexistente");

    // Confirmação nativa sem JavaScript, ainda no mesmo banco descartável.
    await page.goto(baseURL + "/veiculo/registrar-entrada");
    await page.locator("#placa").fill("QA2B345");
    await page.locator("#modelo").fill("Teste sem JavaScript");
    await page.locator("#cor").fill("Azul");
    await page.getByRole("button", { name: /^Registrar entrada/ }).click();
    await page.waitForURL("**/painel");
    const noScriptRemovalPath = await page
      .locator(".remove-link")
      .getAttribute("href");
    const nativeContext = await browser.newContext({
      javaScriptEnabled: false,
      storageState: await context.storageState(),
      viewport: { width: 390, height: 844 },
    });
    const nativePage = await nativeContext.newPage();
    await nativePage.goto(baseURL + noScriptRemovalPath);
    assert.equal(
      await nativePage.locator("[data-delete-hint]").isVisible(),
      false,
    );
    await checkOverflow(nativePage, "Remoção sem JavaScript");
    await nativePage.getByRole("button", { name: "Confirmar remoção" }).click();
    await nativePage.waitForURL("**/painel");
    assert.match(
      await nativePage.getByRole("status").innerText(),
      /Veículo removido/,
    );
    assert.equal(await nativePage.locator(".empty-state").count(), 1);
    await nativeContext.close();
    await page.goto(baseURL + "/painel");
    await page.getByRole("button", { name: /Sair da conta/ }).click();
    await page.waitForURL("**/login");
    await page.goto(baseURL + "/painel");
    await page.waitForURL("**/login");

    const noJS = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const fallback = await noJS.newPage();
    for (const route of ["/login", "/cadastro"]) {
      await fallback.goto(baseURL + route);
      assert.equal(await fallback.locator("h1").isVisible(), true);
      assert.equal(
        await fallback.locator("[data-password-toggle]").isVisible(),
        false,
      );
      assert.equal(
        await fallback.locator('form [type="submit"]').isEnabled(),
        true,
        "Native form works without JS",
      );
      await checkOverflow(fallback, `No JS ${route}`);
    }
    await noJS.close();
    assert.deepEqual(errors, [], "No browser or resource errors");
    fs.writeFileSync(
      path.join(output, "result.json"),
      JSON.stringify({ passed: true, posts, screenshots: output }, null, 2),
    );
    console.log(
      "PASS: login/cadastro/painel/entrada/erro; real empty and success states; native and inline validation; password keyboard toggle; safe text; logout; 360/390/768/1440px; no-JS forms. Only verified H2 memory writes.",
    );
    console.log(`Screenshots: ${output}`);
  } catch (error) {
    console.error("URL:", page.url(), "Browser errors:", errors);
    await page.screenshot({
      path: path.join(output, "failure.png"),
      fullPage: true,
    });
    throw error;
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
