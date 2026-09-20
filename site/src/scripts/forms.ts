/* ==========================================================================
   Формы: маска телефона, валидация, UTM в скрытые поля, отправка,
   цели Яндекс.Метрики.

   Требование ТЗ §5: ни одна форма не публикуется без настроенной цели,
   и в каждой заявке должен быть источник.
   ========================================================================== */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const STORE = 'co_utm';
const ENDPOINT = '/form.php';

/* --- UTM: запоминаем на первый визит, подставляем во все формы ----------- */
function readUtm(): Record<string, string> {
  const params = new URLSearchParams(location.search);
  const fresh: Record<string, string> = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) fresh[k] = v;
  });

  if (Object.keys(fresh).length) {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(fresh));
    } catch {
      /* приватный режим — переживём */
    }
    return fresh;
  }

  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? '{}');
  } catch {
    return {};
  }
}

function fillHidden(form: HTMLFormElement, utm: Record<string, string>) {
  form.querySelectorAll<HTMLInputElement>('[data-utm]').forEach((input) => {
    input.value = utm[input.dataset.utm ?? ''] ?? '';
  });
  const page = form.querySelector<HTMLInputElement>('[data-page-url]');
  if (page) page.value = location.href;
  const ref = form.querySelector<HTMLInputElement>('[data-referrer]');
  if (ref) ref.value = document.referrer;
}

/* --- Маска телефона ------------------------------------------------------ */
function maskPhone(input: HTMLInputElement) {
  const format = () => {
    let digits = input.value.replace(/\D/g, '');

    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);

    const p = digits.slice(1);
    let out = '+7';
    if (p.length) out += ' ' + p.slice(0, 3);
    if (p.length > 3) out += ' ' + p.slice(3, 6);
    if (p.length > 6) out += '-' + p.slice(6, 8);
    if (p.length > 8) out += '-' + p.slice(8, 10);

    input.value = out;
  };

  input.addEventListener('focus', () => {
    if (!input.value) input.value = '+7 ';
  });
  input.addEventListener('input', format);
  input.addEventListener('blur', () => {
    if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
  });
}

/* --- Валидация ----------------------------------------------------------- */
function validate(form: HTMLFormElement): boolean {
  let ok = true;

  form.querySelectorAll<HTMLInputElement>('.field__control').forEach((input) => {
    const field = input.closest('.field');
    if (!field) return;

    let bad = false;
    if (input.required && !input.value.trim()) bad = true;
    if (input.dataset.phone !== undefined && input.value.replace(/\D/g, '').length !== 11) bad = true;
    if (input.type === 'email' && input.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value)) bad = true;

    field.classList.toggle('has-error', bad);
    if (bad) ok = false;
  });

  const consent = form.querySelector<HTMLInputElement>('[data-consent]');
  const consentWrap = consent?.closest('.consent');
  if (consent && consentWrap) {
    const bad = !consent.checked;
    consentWrap.classList.toggle('has-error', bad);
    if (bad) ok = false;
  }

  return ok;
}

/* --- Цели Метрики -------------------------------------------------------- */
function reachGoal(goal: string, params?: Record<string, unknown>) {
  const w = window as unknown as Record<string, unknown>;
  const id = (document.querySelector('[data-metrika-id]') as HTMLElement | null)?.dataset.metrikaId;
  const fn = id ? (w[`yaCounter${id}`] as { reachGoal?: Function } | undefined) : undefined;
  if (fn?.reachGoal) fn.reachGoal(goal, params);
  else if (typeof w.ym === 'function' && id) (w.ym as Function)(Number(id), 'reachGoal', goal, params);
}

/* --- Отправка ------------------------------------------------------------ */
async function submit(form: HTMLFormElement) {
  const btn = form.querySelector<HTMLButtonElement>('[data-submit]');
  const label = btn?.querySelector('span:first-child');
  const original = label?.textContent ?? '';

  btn?.classList.add('is-loading');
  btn?.setAttribute('aria-disabled', 'true');
  if (label) label.textContent = 'Отправляем…';

  const data = new FormData(form);
  let sent = false;

  try {
    const res = await fetch(ENDPOINT, { method: 'POST', body: data });
    sent = res.ok;
  } catch {
    sent = false;
  }

  // В локальной разработке form.php не запускается — показываем успех,
  // чтобы состояние формы можно было проверить глазами.
  if (!sent && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    console.info('[форма] form.php недоступен локально — показываю состояние успеха.', Object.fromEntries(data));
    sent = true;
  }

  btn?.classList.remove('is-loading');
  btn?.removeAttribute('aria-disabled');
  if (label) label.textContent = original;

  form.classList.toggle('is-sent', sent);
  form.classList.toggle('is-failed', !sent);

  if (sent) {
    reachGoal('lead', { form: form.dataset.formName });
    form.querySelector<HTMLElement>('.form__status--ok')?.focus?.();
  }
}

/* --- Инициализация ------------------------------------------------------- */
export function initForms() {
  const utm = readUtm();

  document.querySelectorAll<HTMLFormElement>('[data-form]:not([data-ready])').forEach((form) => {
    form.setAttribute('data-ready', '');
    fillHidden(form, utm);

    form.querySelectorAll<HTMLInputElement>('[data-phone]').forEach(maskPhone);

    // Убираем подсветку ошибки, как только человек начал исправлять
    form.addEventListener('input', (e) => {
      const t = e.target as HTMLElement;
      t.closest('.field')?.classList.remove('has-error');
      t.closest('.consent')?.classList.remove('has-error');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(form)) {
        form.querySelector<HTMLElement>('.has-error .field__control, .has-error input')?.focus();
        return;
      }
      submit(form);
    });
  });

  // Клики по телефону и мессенджерам — тоже цели
  document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]:not([data-goal])').forEach((a) => {
    a.setAttribute('data-goal', '');
    a.addEventListener('click', () => reachGoal('phone_click'));
  });
  document.querySelectorAll<HTMLAnchorElement>('a[href*="t.me"], a[href*="wa.me"]').forEach((a) => {
    if (a.hasAttribute('data-goal')) return;
    a.setAttribute('data-goal', '');
    a.addEventListener('click', () => reachGoal('messenger_click'));
  });
}

initForms();
document.addEventListener('astro:page-load', initForms);
