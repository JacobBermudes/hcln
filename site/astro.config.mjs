import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://jacobBermudes.github.io';

export default defineConfig({
  site: SITE,
  base: '/hcln/',
  output: 'static',
  integrations: [
    sitemap({
      // Служебные и рекламные страницы в карту сайта не попадают
      filter: (page) => !/\/(debug-|lp\/|spasibo)/.test(page),
    }),
  ],
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    server: {
      // Vite по умолчанию отдаёт dev-сервер только на localhost — это защита
      // от DNS-rebinding. Через туннель запрос приходит с чужим именем хоста
      // и отклоняется. Разрешаем домены сервисов, через которые показываем
      // работу заказчику. Точка в начале означает «и все поддомены».
      allowedHosts: ['.cloudpub.ru', '.trycloudflare.com', '.ngrok-free.app', '.loca.lt'],
    },
  },
  devToolbar: {
    enabled: false,
  },
});
