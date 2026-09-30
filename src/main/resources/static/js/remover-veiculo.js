// Adaptação nativa: https://uselayouts.com/docs/components/delete-button
// A contagem só adia o POST. O servidor confirma a remoção efetiva.
const form = document.querySelector("[data-delete-form]");
if (form) {
  const button = form.querySelector("[data-delete-button]");
  const label = form.querySelector("[data-delete-label]");
  const counter = form.querySelector("[data-delete-count]");
  const status = form.querySelector("[data-delete-status]");
  let timer = 0;
  let remaining = 0;
  let sending = false;

  function reset(message = "Nenhuma alteração foi feita.") {
    clearTimeout(timer);
    timer = 0;
    remaining = 0;
    sending = false;
    form.removeAttribute("aria-busy");
    button.disabled = false;
    button.removeAttribute("data-counting");
    label.textContent = "Confirmar remoção";
    counter.hidden = true;
    status.textContent = message;
  }
  function tick() {
    if (document.hidden) {
      reset("Remoção cancelada. O veículo foi mantido.");
      return;
    }
    remaining -= 1;
    counter.textContent = String(remaining);
    if (remaining === 0) {
      sending = true;
      form.requestSubmit();
    } else {
      timer = setTimeout(tick, 1000);
    }
  }
  form.addEventListener("submit", (event) => {
    if (form.getAttribute("aria-busy") === "true") {
      event.preventDefault();
      return;
    }
    if (sending) {
      form.setAttribute("aria-busy", "true");
      button.disabled = true;
      label.textContent = "Removendo…";
      counter.hidden = true;
      status.textContent = "Solicitação enviada. Aguarde a confirmação.";
      return;
    }
    event.preventDefault();
    if (remaining > 0) {
      reset("Remoção cancelada. O veículo foi mantido.");
      return;
    }
    remaining = 5;
    button.setAttribute("data-counting", "");
    label.textContent = "Cancelar remoção";
    counter.textContent = "5";
    counter.hidden = false;
    status.textContent =
      "A remoção será enviada em 5 segundos. Clique em Cancelar remoção ou pressione Escape para manter o veículo.";
    timer = setTimeout(tick, 1000);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && remaining > 0 && !sending) {
      event.preventDefault();
      reset("Remoção cancelada. O veículo foi mantido.");
      button.focus();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && remaining > 0 && !sending)
      reset("Remoção cancelada. O veículo foi mantido.");
  });
  window.addEventListener("pagehide", () => reset());
  window.addEventListener("pageshow", () => reset());
  form.querySelector("[data-delete-hint]").hidden = false;
}
