import { PageInterface } from '../../pageInterface';

export const LectorXD: PageInterface = {
  name: 'LectorXD',
  domain: 'https://lectorxd.com',
  languages: ['Spanish'],
  type: 'manga',
  urls: {
    // /novela/* también existe pero su lector es de texto, no de imágenes.
    match: [
      '*://lectorxd.com/manga/*',
      '*://lectorxd.com/manhwa/*',
      '*://lectorxd.com/manhua/*',
      '*://lectorxd.com/doujinshi/*',
    ],
  },
  sync: {
    isSyncPage($c) {
      return $c
        .and($c.url().urlPart(5).equals('leer').run(), $c.url().urlPart(6).boolean().run())
        .run();
    },
    getTitle($c) {
      return $c.querySelector('h1 > span').text().trim().run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getOverviewUrl($c) {
      return $c
        .string('/')
        .concat($c.url().urlPart(3).run())
        .concat('/')
        .concat($c.this('sync.getIdentifier').run())
        .urlAbsolute()
        .run();
    },
    getEpisode($c) {
      return $c.url().urlPart(6).number().run();
    },
    readerConfig: [
      {
        current: $c => $c.querySelectorAll('.page-container img.page-image').countAbove().run(),
        total: $c => $c.querySelectorAll('.page-container img.page-image').length().run(),
      },
    ],
  },
  overview: {
    isOverviewPage($c) {
      return $c
        .and($c.url().urlPart(4).boolean().run(), $c.url().urlPart(5).boolean().not().run())
        .run();
    },
    getTitle($c) {
      return $c.querySelector('h1').text().trim().run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getImage($c) {
      return $c.querySelector('[property="og:image"]').getAttribute('content').ifNotReturn().run();
    },
    uiInjection($c) {
      return $c.querySelector('h1').uiAfter().run();
    },
  },
  list: {
    elementsSelector($c) {
      return $c.querySelectorAll('#chapter-list-top a[href*="/leer/"]').run();
    },
    elementUrl($c) {
      return $c.getAttribute('href').urlAbsolute().run();
    },
    elementEp($c) {
      return $c.getAttribute('href').urlAbsolute().urlPart(6).number().run();
    },
  },
  lifecycle: {
    setup($c) {
      return $c.addStyle(require('./style.less?raw').toString()).run();
    },
    ready($c) {
      return $c.detectURLChanges($c.trigger().run()).domReady().trigger().run();
    },
    // La lista se pagina en el cliente de 20 en 20 sin cambiar la URL ni el
    // número de filas, así que se vigila el primer capítulo visible.
    listChange($c) {
      return $c
        .detectChanges(
          $c
            .querySelector('#chapter-list-top a[href*="/leer/"]')
            .ifThen($el => $el.getAttribute('href').run())
            .run(),
          $c.trigger().run(),
        )
        .run();
    },
  },
};
