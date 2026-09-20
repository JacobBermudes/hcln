/* ==========================================================================
   Общие данные сайта.

   ВАЖНО. Всё, что лежит в блоке PLACEHOLDERS ниже, — цифры-примеры из
   04-kontent-i-teksty.md, а не реальные данные компании. Ответы собираются
   в OPEN-QUESTIONS.md (41 вопрос). Заменить одним движением, когда фактура
   появится: они больше нигде в коде не повторяются.
   ========================================================================== */

export const site = {
  brand: 'CLEAN OFFICE',
  brandShort: 'CO',
  city: 'Екатеринбург',
  cityIn: 'в Екатеринбурге',
  region: 'Свердловская область',
  domain: 'https://jacobBermudes.github.io',

  phone: '+7 (343) 346-79-53',
  phoneHref: 'tel:+73433467953',
  mobile: '+7 967 639-79-53',
  telegram: 'https://t.me/79676397953',
  whatsapp: 'https://wa.me/79676397953',
  email: 'info@hcln.ru', // УТОЧНИТЬ: почты нет в базе знаний
  hours: 'Ежедневно 09:00–19:00',

  // analytics disabled by default for deployed copy
  metrikaId: '',
  yandexVerification: '',
} as const;

/* --------------------------------------------------------------------------
   ЗАГЛУШКИ. Требуют подтверждения у заказчика — см. OPEN-QUESTIONS.md
   -------------------------------------------------------------------------- */
export const PLACEHOLDERS = {
  yearsOnMarket: 7, // вопрос 3.1
  objectsServed: 48, // вопрос 3.2
  sqmPerMonth: 120_000, // вопрос 3.3
  vat: 'работаем с НДС', // вопрос 2.2
  priceFromOffice: 45, // ₽/м², вопрос 4.1
  checklistPoints: 47,
  replacementHours: 2, // вопрос 5.4
  responseMinutes: 15, // вопрос 5.1
  contractDays: 3,
  fixDefectHours: 24, // вопрос 5.5

  // Реквизиты — вопрос 2.1. Без них сайт нельзя публиковать.
  legalName: 'ООО «{{наименование}}»',
  inn: '{{ИНН}}',
  ogrn: '{{ОГРН}}',
  legalAddress: '{{юридический адрес}}',
} as const;

export const trustStrip = [
  { label: 'На рынке', value: PLACEHOLDERS.yearsOnMarket, suffix: ' лет', caption: 'в коммерческом клининге' },
  { label: 'Объектов', value: PLACEHOLDERS.objectsServed, suffix: '', caption: 'на постоянном обслуживании' },
  { label: 'Площадь', value: 120, suffix: ' тыс.', caption: 'м² убираем каждый месяц' },
  { label: 'Замена', value: PLACEHOLDERS.replacementHours, suffix: ' часа', caption: 'выводим замену сотрудника' },
] as const;

export const heroBullets = [
  `От ${PLACEHOLDERS.priceFromOffice} ₽/м² при регулярном обслуживании — цена в договоре не меняется`,
  `Постоянный состав на объекте, замена сотрудника за ${PLACEHOLDERS.replacementHours} часа`,
  'Выезжаем на осмотр бесплатно в день обращения',
] as const;

export const heroBadges = [
  { icon: 'shield', title: 'Договор', text: `за ${PLACEHOLDERS.contractDays} дня` },
  { icon: 'clock', title: 'Ответ', text: `${PLACEHOLDERS.responseMinutes} минут` },
] as const;

export const nav = [
  { label: 'Услуги', href: '/hcln/uslugi/', mega: true },
  { label: 'Цены', href: '/hcln/ceny/' },
  { label: 'Кейсы', href: '/hcln/kejsy/' },
  { label: 'О компании', href: '/hcln/o-kompanii/' },
  { label: 'Документы', href: '/hcln/dokumenty/' },
  { label: 'Контакты', href: '/hcln/kontakty/' },
] as const;

export const footerNav = [
  {
    title: 'Компания',
    links: [
      { label: 'О компании', href: '/hcln/o-kompanii/' },
      { label: 'Кейсы', href: '/hcln/kejsy/' },
      { label: 'Наши работы', href: '/hcln/nashi-raboty/' },
      { label: 'Отзывы', href: '/hcln/otzyvy/' },
      { label: 'Документы', href: '/hcln/dokumenty/' },
      { label: 'Контакты', href: '/hcln/kontakty/' },
    ],
  },
  {
    title: 'Клиентам',
    links: [
      { label: 'Цены и тарифы', href: '/hcln/ceny/' },
      { label: 'Рассчитать стоимость', href: '/hcln/#kalkulyator' },
      { label: 'Частые вопросы', href: '/hcln/#faq' },
      { label: 'Блог', href: '/hcln/blog/' },
      { label: 'Вакансии', href: '/hcln/vakansii/' },
    ],
  },
] as const;
