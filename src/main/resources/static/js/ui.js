// Native validation and normal POST navigation also work without JavaScript.
// No credentials, form values or server confirmations are stored in the browser.
const submitButtons = new WeakMap();

document.querySelectorAll("form[data-submit]").forEach((form) => {
  const button = form.querySelector('button[type="submit"]');
  if (button) submitButtons.set(button, button.innerHTML);

  form.addEventListener("submit", (event) => {
    if (event.defaultPrevented || !button) return;
    if (form.getAttribute("aria-busy") === "true") {
      event.preventDefault();
      return;
    }
    button.disabled = true;
    button.textContent = form.dataset.pendingLabel || "Enviando…";
    form.setAttribute("aria-busy", "true");
  });

  form.querySelectorAll("input, textarea").forEach((input) => {
    const field = input.closest(".field");
    if (!field || !input.id) return;
    const message = document.createElement("p");
    message.className = "field-error";
    message.id = input.id + "-error";
    message.hidden = true;
    field.append(message);

    const description = input.getAttribute("aria-describedby") || "";
    const clearError = () => {
      message.hidden = true;
      message.textContent = "";
      input.removeAttribute("aria-invalid");
      if (description) input.setAttribute("aria-describedby", description);
      else input.removeAttribute("aria-describedby");
    };
    const showError = () => {
      if (input.validity.valid) {
        clearError();
        return;
      }
      const label = input.labels?.[0]?.textContent.trim() || "este campo";
      let text = input.validationMessage;
      if (input.validity.valueMissing)
        text =
          input.dataset.requiredMessage ||
          "Preencha " + label.toLocaleLowerCase("pt-BR") + ".";
      else if (input.validity.typeMismatch && input.type === "email")
        text = "Informe um e-mail válido, como seu@email.com.";
      else if (input.validity.patternMismatch)
        text = input.title || "Confira o formato deste campo.";
      message.textContent = text;
      message.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute(
        "aria-describedby",
        [description, message.id].filter(Boolean).join(" "),
      );
    };

    input.addEventListener("invalid", showError);
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") showError();
    });
  });
});

addEventListener("pageshow", () => {
  document.querySelectorAll("form[data-submit]").forEach((form) => {
    form.removeAttribute("aria-busy");
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = false;
    if (submitButtons.has(button)) button.innerHTML = submitButtons.get(button);
  });
});

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  const input = document.getElementById(button.getAttribute("aria-controls"));
  if (!input) return;
  button.hidden = false;
  button.addEventListener("click", () => {
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    button.textContent = visible ? "Ocultar" : "Mostrar";
    button.setAttribute(
      "aria-label",
      visible ? "Ocultar senha" : "Mostrar senha",
    );
    button.setAttribute("aria-pressed", String(visible));
  });
});

document.querySelectorAll("[data-app-nav]").forEach((link) => {
  const active = new URL(link.href).pathname === location.pathname;
  if (active) link.setAttribute("aria-current", "page");
  else link.removeAttribute("aria-current");
});
