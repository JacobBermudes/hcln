<?php
/**
 * Приём заявок с сайта. Кладётся в корень сайта на хостинге рядом с index.html.
 *
 * Работает на любом шаблонном тарифе с PHP 7.4+ (Timeweb, Beget, REG.RU,
 * Sprinthost). Node на сервере не нужен.
 *
 * Заявка уходит:
 *   1) в Telegram-чат менеджеров,
 *   2) на почту,
 *   3) в CRM — если заполнен CRM_WEBHOOK.
 *
 * Персональные данные нигде не сохраняются на диск, только пересылаются.
 * Сервер должен находиться в РФ (152-ФЗ).
 *
 * ── НАСТРОЙКА ──────────────────────────────────────────────────────────────
 * Заполните константы ниже. Токен бота получается у @BotFather,
 * chat_id — у @userinfobot или через getUpdates.
 */

declare(strict_types=1);

const TELEGRAM_TOKEN = '';           // 1234567890:AA...
const TELEGRAM_CHAT_ID = '';         // -1001234567890
const MAIL_TO = 'info@hcln.ru';
const MAIL_FROM = 'site@hcln.ru';
const CRM_WEBHOOK = '';              // URL входящего вебхука Битрикс24 / amoCRM
const RATE_LIMIT_SECONDS = 20;       // не чаще одной заявки с IP

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['ok' => false, 'error' => 'method_not_allowed']));
}

// --- Ловушка для ботов: живой человек это поле не видит ---------------------
if (!empty($_POST['company_website'] ?? '')) {
    exit(json_encode(['ok' => true]));  // молча принимаем и выбрасываем
}

// --- Согласие на обработку персональных данных обязательно ------------------
if (empty($_POST['consent'] ?? '')) {
    http_response_code(422);
    exit(json_encode(['ok' => false, 'error' => 'consent_required']));
}

// --- Ограничение частоты по IP ---------------------------------------------
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$lockFile = sys_get_temp_dir() . '/lead_' . md5($ip);
if (is_file($lockFile) && (time() - (int) filemtime($lockFile)) < RATE_LIMIT_SECONDS) {
    http_response_code(429);
    exit(json_encode(['ok' => false, 'error' => 'too_many_requests']));
}
touch($lockFile);

// --- Разбор и очистка ------------------------------------------------------
function field(string $key, int $max = 300): string
{
    $raw = (string) ($_POST[$key] ?? '');
    $clean = trim(strip_tags($raw));
    return mb_substr($clean, 0, $max);
}

$name  = field('name', 120);
$phone = field('phone', 32);
$email = field('email', 160);
$area  = field('area', 16);

if ($name === '' || preg_match_all('/\d/', $phone) < 11) {
    http_response_code(422);
    exit(json_encode(['ok' => false, 'error' => 'invalid_fields']));
}

$lead = [
    'Форма'      => field('form_name', 120),
    'Источник'   => field('source', 120),
    'Имя'        => $name,
    'Телефон'    => $phone,
    'E-mail'     => $email,
    'Площадь'    => $area !== '' ? $area . ' м²' : '',
    'Страница'   => field('page_url', 400),
    'Переход с'  => field('referrer', 400),
    'utm_source' => field('utm_source', 120),
    'utm_medium' => field('utm_medium', 120),
    'utm_campaign' => field('utm_campaign', 160),
    'utm_term'   => field('utm_term', 160),
    'utm_content' => field('utm_content', 160),
    'Калькулятор' => field('calc', 800),
    'IP'         => $ip,
];

$lines = [];
foreach ($lead as $label => $value) {
    if ($value !== '') {
        $lines[] = $label . ': ' . $value;
    }
}
$text = "Заявка с сайта CLEAN OFFICE\n\n" . implode("\n", $lines);

// --- Доставка --------------------------------------------------------------
$delivered = false;

if (TELEGRAM_TOKEN !== '' && TELEGRAM_CHAT_ID !== '') {
    $ch = curl_init('https://api.telegram.org/bot' . TELEGRAM_TOKEN . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_POSTFIELDS => http_build_query([
            'chat_id' => TELEGRAM_CHAT_ID,
            'text' => $text,
            'disable_web_page_preview' => true,
        ]),
    ]);
    $delivered = curl_exec($ch) !== false && curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
    curl_close($ch);
}

if (MAIL_TO !== '') {
    $headers = "From: CLEAN OFFICE <" . MAIL_FROM . ">\r\n"
        . "Content-Type: text/plain; charset=utf-8\r\n";
    if ($email !== '') {
        $headers .= "Reply-To: " . $email . "\r\n";
    }
    $sentMail = @mail(MAIL_TO, 'Заявка с сайта: ' . $lead['Форма'], $text, $headers);
    $delivered = $delivered || $sentMail;
}

if (CRM_WEBHOOK !== '') {
    $ch = curl_init(CRM_WEBHOOK);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($lead, JSON_UNESCAPED_UNICODE),
    ]);
    curl_exec($ch);
    curl_close($ch);
}

if (!$delivered) {
    http_response_code(502);
    exit(json_encode(['ok' => false, 'error' => 'delivery_failed']));
}

echo json_encode(['ok' => true]);
