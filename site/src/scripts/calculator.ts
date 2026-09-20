/* ==========================================================================
   Калькулятор стоимости.

   Формула и коэффициенты — в src/data/calculator.ts, здесь только логика.
   Результат считается на каждое изменение и показывается ДО запроса
   контактов (требование ТЗ §5).

   Каждый шаг отправляет событие в Метрику — видно, где отваливаются.
   ========================================================================== */

import {
  objectTypes,
  cleaningKinds,
  frequencies,
  areaTiers,
  extras,
  areaLimits,
  ONE_TIME_KINDS,
  SPREAD,
  MIN_ORDER,
} from '../data/calculator';

const STEPS = 5;

function reachGoal(goal: string, params?: Record<string, unknown>) {
  // Analytics disabled — no-op
  return;
}

const money = (n: number) => Math.round(n).toLocaleString('ru-RU');

function initCalculator() {
  const root = document.querySelector<HTMLElement>('[data-calc]');
  if (!root || root.hasAttribute('data-ready')) return;
  root.setAttribute('data-ready', '');

  const form = root.querySelector<HTMLElement>('.calc__form')!;
  const rangeEl = root.querySelector<HTMLInputElement>('[data-area-range]')!;
  const areaEl = root.querySelector<HTMLInputElement>('[data-area-input]')!;
  const freqNote = root.querySelector<HTMLElement>('[data-freq-note]')!;
  const freqStep = root.querySelector<HTMLElement>('[data-step="4"]')!;

  const out = {
    label: root.querySelector<HTMLElement>('[data-result-label]')!,
    min: root.querySelector<HTMLElement>('[data-result-min]')!,
    max: root.querySelector<HTMLElement>('[data-result-max]')!,
    rate: root.querySelector<HTMLElement>('[data-result-rate]')!,
    area: root.querySelector<HTMLElement>('[data-result-area]')!,
    summary: root.querySelector<HTMLElement>('[data-result-summary]')!,
  };

  const val = (name: string) =>
    root.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? '';

  const checkedExtras = () =>
    Array.from(root.querySelectorAll<HTMLInputElement>('input[name="extras"]:checked')).map((i) => i.value);

  const clampArea = (n: number) =>
    Math.min(areaLimits.max, Math.max(areaLimits.min, Math.round(n) || areaLimits.default));

  function areaFactor(area: number) {
    return areaTiers.find((t) => area <= t.upTo)?.factor ?? 1;
  }

  function calculate() {
    const area = clampArea(Number(areaEl.value));
    const type = objectTypes.find((o) => o.id === val('objectType')) ?? objectTypes[0];
    const kind = cleaningKinds.find((k) => k.id === val('kind')) ?? cleaningKinds[0];
    const freq = frequencies.find((f) => f.id === val('frequency')) ?? frequencies[2];
    const chosen = checkedExtras();

    const oneTime = (ONE_TIME_KINDS as readonly string[]).includes(kind.id);

    // Разовые работы считаются за смену — частота к ним не применяется
    const freqFactor = oneTime ? 1 : freq.factor;
    const extrasAdd = oneTime
      ? 0
      : extras.filter((e) => chosen.includes(e.id)).reduce((sum, e) => sum + e.add, 0);

    const rate = type.base * kind.factor * freqFactor * areaFactor(area) + extrasAdd;
    const total = Math.max(MIN_ORDER, rate * area);

    // --- вывод ---
    out.label.textContent = oneTime ? 'Ориентировочная стоимость работ' : 'Ориентировочная стоимость в месяц';
    out.min.textContent = money(total * (1 - SPREAD));
    out.max.textContent = money(total * (1 + SPREAD));
    out.rate.textContent = rate.toFixed(rate < 10 ? 1 : 0);
    out.area.textContent = area.toLocaleString('ru-RU');

    const rows: [string, string][] = [
      ['Объект', type.label],
      ['Уборка', kind.label],
    ];
    if (!oneTime) rows.push(['График', freq.label]);
    if (extrasAdd) rows.push(['Допуслуги', `${chosen.length} шт. · +${extrasAdd} ₽/м²`]);

    out.summary.innerHTML = rows
      .map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`)
      .join('');

    // Частота для разовых работ не нужна — прячем шаг, а не молчим об этом
    freqNote.hidden = !oneTime;
    freqStep.classList.toggle('is-muted', oneTime);
    freqStep
      .querySelectorAll<HTMLInputElement>('input')
      .forEach((i) => (i.disabled = oneTime));

    // Полезная нагрузка уезжает вместе с заявкой
    const payload = JSON.stringify({
      type: type.label,
      kind: kind.label,
      frequency: oneTime ? null : freq.label,
      area,
      extras: chosen,
      rate: Math.round(rate),
      total: Math.round(total),
    });
    document
      .querySelectorAll<HTMLInputElement>('[data-calc-payload]')
      .forEach((i) => (i.value = payload));

    // Ползунок закрашивается до бегунка
    const pct = ((Number(rangeEl.value) - Number(rangeEl.min)) / (Number(rangeEl.max) - Number(rangeEl.min))) * 100;
    rangeEl.style.setProperty('--fill', `${pct}%`);
  }

  /* --- Синхронизация ползунка и поля ------------------------------------ */
  rangeEl.addEventListener('input', () => {
    areaEl.value = rangeEl.value;
    calculate();
  });

  areaEl.addEventListener('input', () => {
    const n = Number(areaEl.value);
    if (n >= Number(rangeEl.min) && n <= Number(rangeEl.max)) rangeEl.value = String(n);
    calculate();
  });

  areaEl.addEventListener('blur', () => {
    areaEl.value = String(clampArea(Number(areaEl.value)));
    calculate();
  });

  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'areaRange' || t.name === 'area') return;
    calculate();
    reachGoal('calc_change', { field: t.name, value: t.value });
  });

  /* --- Пошаговый режим на мобильном ------------------------------------- */
  let current = 1;
  const stepEls = Array.from(root.querySelectorAll<HTMLElement>('.calc__step'));
  const progressEls = Array.from(root.querySelectorAll<HTMLElement>('[data-progress-step]'));
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-calc-prev]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-calc-next]')!;
  const nextLabel = nextBtn.querySelector('span')!;

  const mq = window.matchMedia('(max-width: 720px)');

  function paintStep() {
    stepEls.forEach((el) => el.classList.toggle('is-current', el.dataset.step === String(current)));
    progressEls.forEach((el) =>
      el.classList.toggle('is-done', Number(el.dataset.progressStep) <= current)
    );
    prevBtn.disabled = current === 1;
    nextLabel.textContent = current === STEPS ? 'Показать стоимость' : 'Далее';
  }

  function applyMode() {
    const stepped = mq.matches;
    form.classList.toggle('is-stepped', stepped);
    if (stepped) paintStep();
    else stepEls.forEach((el) => el.classList.remove('is-current'));
  }

  nextBtn.addEventListener('click', () => {
    if (current < STEPS) {
      current += 1;
      paintStep();
      reachGoal('calc_step', { step: current });
    } else {
      root.querySelector('.calc__result')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      reachGoal('calc_complete');
    }
  });

  prevBtn.addEventListener('click', () => {
    if (current > 1) {
      current -= 1;
      paintStep();
    }
  });

  mq.addEventListener('change', applyMode);
  applyMode();
  calculate();
}

initCalculator();
document.addEventListener('astro:page-load', initCalculator);
