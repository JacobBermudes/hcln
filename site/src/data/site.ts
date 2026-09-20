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
  domain: 'https://hcln.ru',

  phone: '+7 (343) 346-79-53',
  phoneHref: 'tel:+73433467953',
  mobile: '+7 967 639-79-53',
  telegram: 'https://t.me/79676397953',
  whatsapp: 'https://wa.me/79676397953',
  email: 'info@hcln.ru', // УТОЧНИТЬ: почты нет в базе знаний
  hours: 'Ежедневно 09:00–19:00',

  metrikaId: '88211131',
  yandexVerification: 'b775cf8fd3839e0b',
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
  { label: 'Услуги', href: '/uslugi/', mega: true },
  { label: 'Цены', href: '/ceny/' },
  { label: 'Кейсы', href: '/kejsy/' },
  { label: 'О компании', href: '/o-kompanii/' },
  { label: 'Документы', href: '/dokumenty/' },
  { label: 'Контакты', href: '/kontakty/' },
] as const;

export const footerNav = [
  {
    title: 'Компания',
    links: [
      { label: 'О компании', href: '/o-kompanii/' },
      { label: 'Кейсы', href: '/kejsy/' },
      { label: 'Наши работы', href: '/nashi-raboty/' },
      { label: 'Отзывы', href: '/otzyvy/' },
      { label: 'Документы', href: '/dokumenty/' },
      { label: 'Контакты', href: '/kontakty/' },
    ],
  },
  {
    title: 'Клиентам',
    links: [
      { label: 'Цены и тарифы', href: '/ceny/' },
      { label: 'Рассчитать стоимость', href: '/#kalkulyator' },
      { label: 'Частые вопросы', href: '/#faq' },
      { label: 'Блог', href: '/blog/' },
      { label: 'Вакансии', href: '/vakansii/' },
    ],
  },
] as const;
