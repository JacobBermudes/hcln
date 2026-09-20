/* ==========================================================================
   Шторка «до / после».

   Позицию хранит настоящий <input type="range"> поверх кадра — от него
   бесплатно достаются клавиатура (стрелки, Home/End), тач и доступность.
   Скрипт только переносит значение в CSS-переменную и добавляет
   перетаскивание указателем по всему кадру.
   ========================================================================== */

function initBeforeAfter() {
  document.querySelectorAll<HTMLElement>('[data-ba]:not([data-ready])').forEach((frame) => {
    frame.setAttribute('data-ready', '');

    const range = frame.querySelector<HTMLInputElement>('[data-ba-range]');
    if (!range) return;

    const paint = () => frame.style.setProperty('--pos', `${range.value}%`);

    range.addEventListener('input', paint);
    paint();

    // Перетаскивание указателем: тянуть можно за любую точку кадра,
    // а не только за 44-пиксельный бегунок.
    let dragging = false;

    const setFromX = (clientX: number) => {
      const rect = frame.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      range.value = String(Math.min(100, Math.max(0, pct)));
      paint();
    };

    frame.addEventListener('pointerdown', (e) => {
      dragging = true;
      frame.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    });

    frame.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      e.preventDefault();
      setFromX(e.clientX);
    });

    const stop = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (frame.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId);
    };

    frame.addEventListener('pointerup', stop);
    frame.addEventListener('pointercancel', stop);
  });
}

initBeforeAfter();
document.addEventListener('astro:page-load', initBeforeAfter);
