import { PageInterface } from '../../pageInterface';

export const Manhwa18: PageInterface = {
  name: 'Manhwa18',
  domain: 'https://manhwa18.net',
  languages: ['English'],
  type: 'manga',
  urls: {
    match: ['*://manhwa18.net/*'],
  },
  sync: {
    isSyncPage($c) {
      return $c
        .and(
          $c.url().urlPart(3).equals('manga').run(),
          $c.url().urlPart(5).boolean().run(),
        )
        .run();
    },
    getTitle($c) {
      return $c.url().urlPart(4).replaceAll('-', ' ').run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getOverviewUrl($c) {
      return $c
        .string('/manga/')
        .concat($c.this('sync.getIdentifier').run())
        .urlAbsolute()
        .run();
    },
    getEpisode($c) {
      return $c.url().urlPart(5).regex('chapter[_-]?(\\d+)', 1).number().ifNotReturn().run();
    },
    readerConfig: [
      {
        current: {
          selector: '.m18-reading img',
          mode: 'countAbove',
        },
        total: {
          selector: '.m18-reading img',
          mode: 'count',
        },
      },
    ],
  },
  overview: {
    isOverviewPage($c) {
      return $c
        .and(
          $c.url().urlPart(3).equals('manga').run(),
          $c.url().urlPart(4).boolean().run(),
          $c.url().urlPart(5).boolean().not().run(),
        )
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
      return $c.querySelectorAll('.m18-ch-list a.m18-ch-row').run();
    },
    elementUrl($c) {
      return $c.getAttribute('href').urlAbsolute().run();
    },
    elementEp($c) {
      return $c.find('.m18-ch-num').text().trim().number().run();
    },
  },
  lifecycle: {
    setup($c) {
      return $c.addStyle(require('./style.less?raw').toString()).run();
    },
    ready($c) {
      return $c
        .detectURLChanges($c.trigger().run())
        // La lista carga de a tandas con el botón .m18-load-more; re-procesa
        // cuando crece para resaltar capítulos viejos que el usuario expande.
        .detectChanges($c.this('list.elementsSelector').length().run(), $c.trigger().run())
        .domReady()
        .trigger()
        .run();
    },
  },
};
