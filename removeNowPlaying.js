// NAME: Remove Now Playing
// AUTHOR: keetsta
// DESCRIPTION: Аннигилирует правую панель "Now Playing" к чертям собачьим:
//              прячет её через CSS и принудительно захлопывает каждый раз,
//              когда Spotify пытается её открыть (старт, смена трека и т.п.).

(function removeNowPlaying() {
  // Ждём пока Spicetify и DOM приложения прогрузятся.
  if (!window.Spicetify || !Spicetify.Platform || !document.querySelector(".Root__main-view")) {
    setTimeout(removeNowPlaying, 300);
    return;
  }

  // --- 1. CSS-гильотина -------------------------------------------------
  // Прячем сам сайдбар и кнопку-переключатель, чтобы панель не занимала
  // место и её нельзя было случайно открыть.
  const style = document.createElement("style");
  style.id = "remove-now-playing-style";
  style.textContent = `
    .Root__right-sidebar,
    aside[aria-label="Now playing view"],
    aside[aria-label="Now Playing view"] {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
    }
    button[data-testid="control-button-npv"],
    button[aria-label="Now playing view"],
    button[aria-label="Now Playing view"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // --- 2. Закрываем панель программно -----------------------------------
  // CSS прячет панель визуально, но Spotify всё равно тратит ресурсы на её
  // рендер. Принудительно гасим её через все доступные API.
  function nuke() {
    try {
      // Современный Spicetify.Panel API.
      if (Spicetify.Panel && typeof Spicetify.Panel.hasPanel === "function") {
        const npvId = Spicetify.Panel.reservedPanelIds?.NowPlaying ?? 2;
        if (Spicetify.Panel.hasPanel(npvId)) {
          Spicetify.Panel.setPanel?.(undefined);
        }
      }
    } catch (_) {}

    try {
      // Низкоуровневый PanelAPI (разные версии Spotify).
      const api = Spicetify.Platform?.PanelAPI;
      if (api) {
        if (typeof api.clearPanel === "function") {
          api.clearPanel();
        } else if (typeof api.setPanel === "function" && api.getPanel?.()) {
          api.setPanel(undefined);
        }
      }
    } catch (_) {}

    // Последний рубеж: если панель всё ещё в DOM — кликаем по её кнопке
    // закрытия / тогглу, чтобы Spotify обновил своё внутреннее состояние.
    const sidebar = document.querySelector(".Root__right-sidebar");
    if (sidebar) {
      const toggle = document.querySelector(
        'button[data-testid="control-button-npv"][aria-pressed="true"], ' +
        'button[aria-label="Now playing view"][aria-pressed="true"], ' +
        'button[aria-label="Now Playing view"][aria-pressed="true"]'
      );
      if (toggle) toggle.click();
    }
  }

  // Гасим сразу при загрузке.
  nuke();

  // --- 3. Перехватываем любые попытки открыть панель --------------------
  // Подписываемся на изменения состояния панели, если API это позволяет.
  try {
    Spicetify.Platform?.PanelAPI?.getEvents?.()?.subscribe?.(nuke);
  } catch (_) {}

  // Надёжный универсальный сторож: следим за появлением сайдбара в DOM.
  const observer = new MutationObserver(() => {
    if (document.querySelector(".Root__right-sidebar")) {
      nuke();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Подстраховка на смену трека — событие плеера тоже триггерит панель.
  Spicetify.Player?.addEventListener?.("songchange", nuke);
})();
