/* ==========================================================================
   Общий интерактив: появление при скролле, шапка, мегаменю, аккордеон,
   табы, счётчики, модальное окно.

   Библиотек нет. Всё вешается через init(), который вызывается и при
   первой загрузке, и после перехода View Transitions.
   ========================================================================== */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --- Появление при скролле ------------------------------------------------ */
function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
  if (!items.length) return;

  if (reduced() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;

        // Дети с data-reveal-group появляются каскадом
        const group = el.querySelectorAll<HTMLElement>('[data-reveal-item]');
        group.forEach((child, i) => {
          child.style.setProperty('--reveal-delay', `${i * 60}ms`);
          child.classList.add('is-in');
        });

        el.classList.add('is-in');
        obs.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );

  items.forEach((el) => io.observe(el));
}

/* --- Заголовок H1: всплытие по словам ------------------------------------- */
function initWordRise() {
  const el = document.querySelector<HTMLElement>('.word-rise:not([data-split])');
  if (!el) return;
  el.setAttribute('data-split', '');

  if (reduced()) {
    el.classList.add('is-in');
    return;
  }

  // Разбиваем только текстовые узлы, чтобы не потерять вложенный <span class="hl">
  const wrap = (node: Node, counter: { i: number }) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = (node.textContent ?? '').split(/(\s+)/).filter(Boolean);
      const frag = document.createDocumentFragment();
      words.forEach((w) => {
        if (/^\s+$/.test(w)) {
          frag.appendChild(document.createTextNode(w));
          return;
        }
        const s = document.createElement('span');
        s.textContent = w;
        s.style.setProperty('--i', String(counter.i++));
        frag.appendChild(s);
      });
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach((c) => wrap(c, counter));
    }
  };

  wrap(el, { i: 0 });
  requestAnimationFrame(() => el.classList.add('is-in'));
}

/* --- Шапка: сжатие при скролле -------------------------------------------- */
function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* --- Мегаменю и бургер ---------------------------------------------------- */
function initMenu() {
  const btn = document.querySelector<HTMLButtonElement>('[data-mega-btn]');
  const panel = document.querySelector<HTMLElement>('[data-mega-panel]');
  const wrap = document.querySelector<HTMLElement>('[data-mega]');

  // Пока раскрыто меню, шапка обязана быть плотной: на главной она лежит
  // поверх первого экрана и до прокрутки прозрачна, а белая панель под
  // прозрачной полосой читается как разрыв.
  const header = document.querySelector<HTMLElement>('[data-header]');
  const setSolid = (on: boolean) => header?.classList.toggle('is-solid', on);

  if (btn && panel && wrap) {
    const close = () => {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      setSolid(false);
    };
    const open = () => {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      setSolid(true);
    };

    btn.addEventListener('click', () => (panel.hidden ? open() : close()));
    wrap.addEventListener('mouseenter', open);
    wrap.addEventListener('mouseleave', close);
    document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target as Node)) close();
    });
    panel.addEventListener('focusout', (e) => {
      if (!wrap.contains(e.relatedTarget as Node)) close();
    });
  }

  const burger = document.querySelector<HTMLButtonElement>('[data-burger]');
  const mnav = document.querySelector<HTMLElement>('[data-mnav]');
  if (burger && mnav) {
    burger.addEventListener('click', () => {
      const open = mnav.hidden;
      mnav.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('no-scroll', open);
      setSolid(open);
    });
    mnav.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) {
        mnav.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
        setSolid(false);
      }
    });
  }
}

/* --- Аккордеон ------------------------------------------------------------ */
function initAccordion() {
  document.querySelectorAll<HTMLButtonElement>('[data-acc-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc__item');
      if (!item) return;
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

/* --- Табы ----------------------------------------------------------------- */
function initTabs() {
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((group) => {
    const tabs = Array.from(group.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

    const select = (tab: HTMLButtonElement) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
        if (panel) panel.hidden = !on;
      });
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        select(next);
      });
    });
  });
}

/* --- Счётчики ------------------------------------------------------------- */
function initCounters() {
  const nodes = document.querySelectorAll<HTMLElement>('[data-count]:not([data-counted])');
  if (!nodes.length) return;

  const run = (el: HTMLElement) => {
    el.setAttribute('data-counted', '');
    const target = Number(el.dataset.count ?? '0');
    if (reduced()) {
      el.textContent = target.toLocaleString('ru-RU');
      return;
    }

    const dur = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    nodes.forEach(run);
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run(e.target as HTMLElement);
        obs.unobserve(e.target);
      });
    },
    { threshold: 0.4 }
  );

  nodes.forEach((n) => io.observe(n));
}

/* --- Модальное окно ------------------------------------------------------- */
function initModal() {
  document.querySelectorAll<HTMLElement>('[data-modal-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const id = trigger.dataset.modalOpen;
      const dlg = document.getElementById(`modal-${id}`) as HTMLDialogElement | null;
      if (!dlg) return;

      // Запоминаем, откуда пришли: пригодится и для фокуса, и для аналитики
      const src = dlg.querySelector<HTMLInputElement>('input[name="source"]');
      if (src) src.value = trigger.textContent?.trim() ?? 'modal';

      dlg.showModal();
    });
  });

  document.querySelectorAll<HTMLElement>('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('dialog')?.close());
  });

  // Клик по подложке закрывает окно
  document.querySelectorAll<HTMLDialogElement>('dialog.modal').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
  });
}

/* --- Плавная прокрутка к якорю с учётом липкой шапки ---------------------- */
function initAnchors() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/#"], a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href')?.split('#')[1];
      if (!hash) return;
      const target = document.getElementById(hash);
      if (!target) return; // якорь на другой странице — уходим обычной ссылкой
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${hash}`);
    });
  });
}

export function init() {
  document.documentElement.classList.add('js-ready');
  initHeader();
  initMenu();
  initReveal();
  initWordRise();
  initAccordion();
  initTabs();
  initCounters();
  initModal();
  initAnchors();
}

init();
document.addEventListener('astro:page-load', init);
