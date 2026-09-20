/* ==========================================================================
   Коэффициенты калькулятора.

   Это единственный файл, который нужно править, чтобы поменять расчёт.
   Формула:
     ставка = base(тип объекта)
            × kind(вид уборки)
            × frequency(частота)
            × areaDiscount(площадь)
            + сумма(допуслуги)

     итог за месяц = ставка × площадь, показывается ВИЛКОЙ ±spread.

   Требование ТЗ §5: результат виден ДО запроса контактов.
   Реальные ставки подставить после ответов на OPEN-QUESTIONS.md, п. 4.
   ========================================================================== */

export const CURRENCY = '₽';
export const SPREAD = 0.1; // ширина вилки: ±10%
export const MIN_ORDER = 12_000; // минимальный месячный заказ, ₽

export const objectTypes = [
  { id: 'office', label: 'Офис', base: 45, icon: 'office' },
  { id: 'retail', label: 'Магазин', base: 40, icon: 'shop' },
  { id: 'mall', label: 'ТЦ или БЦ', base: 38, icon: 'building' },
  { id: 'warehouse', label: 'Склад, производство', base: 25, icon: 'warehouse' },
  { id: 'horeca', label: 'Ресторан, кафе', base: 55, icon: 'restaurant' },
  { id: 'residential', label: 'ЖК, подъезды', base: 30, icon: 'residential' },
] as const;

export const cleaningKinds = [
  { id: 'regular', label: 'Регулярная поддерживающая', factor: 1 },
  { id: 'general', label: 'Генеральная', factor: 3.4 },
  { id: 'renovation', label: 'После ремонта', factor: 4.2 },
] as const;

export const frequencies = [
  { id: 'f2', label: '2 раза в неделю', factor: 0.55 },
  { id: 'f3', label: '3 раза в неделю', factor: 0.75 },
  { id: 'f5', label: '5 дней в неделю', factor: 1 },
  { id: 'f6', label: '6 дней в неделю', factor: 1.16 },
  { id: 'f7', label: 'Ежедневно, включая выходные', factor: 1.3 },
] as const;

/** Скидка за объём: чем больше площадь, тем ниже ставка за м². */
export const areaTiers = [
  { upTo: 200, factor: 1.25 },
  { upTo: 500, factor: 1.1 },
  { upTo: 1_000, factor: 1 },
  { upTo: 3_000, factor: 0.9 },
  { upTo: 10_000, factor: 0.82 },
  { upTo: Infinity, factor: 0.75 },
] as const;

/** Допуслуги: добавка к ставке в ₽/м² в месяц. */
export const extras = [
  { id: 'night', label: 'Ночные смены', add: 8 },
  { id: 'windows', label: 'Мойка окон раз в квартал', add: 6 },
  { id: 'upholstery', label: 'Химчистка мебели раз в полгода', add: 4 },
  { id: 'consumables', label: 'Расходники для санузлов', add: 5 },
  { id: 'territory', label: 'Прилегающая территория', add: 7 },
  { id: 'daytime', label: 'Дневной оператор на объекте', add: 12 },
] as const;

/** Разовые виды уборки считаются за смену, а не за месяц. */
export const ONE_TIME_KINDS = ['general', 'renovation'] as const;

export const areaLimits = { min: 50, max: 20_000, step: 10, default: 400 } as const;
