// NAME: Remove Now Playing
// AUTHOR: keetsta
// DESCRIPTION: Hides the invasive "now playing" track screen, keeping the queue and device picker.

(function removeNowPlaying() {
  // Ждём пока Spicetify и DOM приложения прогрузятся.
  if (!window.Spicetify || !Spicetify.Platform || !document.querySelector(".Root__main-view")) {
    setTimeout(removeNowPlaying, 300);
    return;
  }

  // Сам <aside> правого сайдбара ВСЕГДА имеет класс NowPlayingView — даже
  // когда внутри показана очередь или выбор устройства. Поэтому отличать
  // нужно по содержимому: экран «Сейчас играет» помечен стабильным маркером
  // data-testid="NPV_Panel_OpenDiv", который не зависит от языка интерфейса.
  const NPV_CONTENT = '[data-testid="NPV_Panel_OpenDiv"]';
  const NPV_ID = Spicetify.Panel?.reservedPanelIds?.NowPlaying ?? 2;

  // --- 1. CSS-гильотина -------------------------------------------------
  // Прячем сайдбар ТОЛЬКО когда внутри него контент экрана «Сейчас играет».
  // Когда показана очередь/устройства — этого маркера нет, сайдбар виден.
  const style = document.createElement("style");
  style.id = "remove-now-playing-style";
  style.textContent = `
    .Root__right-sidebar:has(${NPV_CONTENT}) {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
    }
    button[data-testid="control-button-npv"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // --- 2. Закрываем панель программно, чтобы не тратить ресурсы ----------
  // Действуем только когда в DOM реально есть контент Now Playing.
  function nuke() {
    if (!document.querySelector(NPV_CONTENT)) return;

    try {
      // Современный Spicetify.Panel API.
      if (Spicetify.Panel?.hasPanel?.(NPV_ID)) {
        Spicetify.Panel.setPanel?.(undefined);
      }
    } catch (_) {}

    try {
      // Низкоуровневый PanelAPI (разные версии Spotify).
      const api = Spicetify.Platform?.PanelAPI;
      if (api && api.getPanel?.() === NPV_ID) {
        if (typeof api.clearPanel === "function") api.clearPanel();
        else api.setPanel?.(undefined);
      }
    } catch (_) {}

    // Последний рубеж: жмём кнопку-тоггл Now Playing, если она нажата.
    const toggle = document.querySelector(
      'button[data-testid="control-button-npv"][aria-pressed="true"]'
    );
    if (toggle) toggle.click();
  }

  // Гасим сразу при загрузке.
  nuke();

  // --- 3. Перехватываем любые попытки открыть экран Now Playing ---------
  try {
    Spicetify.Platform?.PanelAPI?.getEvents?.()?.subscribe?.(nuke);
  } catch (_) {}

  // Сторож: реагируем только на появление контента Now Playing.
  const observer = new MutationObserver(() => {
    if (document.querySelector(NPV_CONTENT)) nuke();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Подстраховка на смену трека.
  Spicetify.Player?.addEventListener?.("songchange", nuke);
})();
