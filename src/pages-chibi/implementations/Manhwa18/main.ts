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
        .and($c.url().urlPart(3).equals('manga').run(), $c.url().urlPart(5).boolean().run())
        .run();
    },
    getTitle($c) {
      return $c.querySelector('.m18-rbar-title .m18-t').text().trim().run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getOverviewUrl($c) {
      return $c.string('/manga/').concat($c.this('sync.getIdentifier').run()).urlAbsolute().run();
    },
    getEpisode($c) {
      // El slug pierde el punto decimal (316.5 → `chapter-3165`), así que el
      // número sale del <title>: "Manga - Chapter 316.5 - Manhwa18".
      return $c.title().regex('Chapter\\s+(\\d+(?:\\.\\d+)?)', 1).number().ifNotReturn().run();
    },
    readerConfig: [
      {
        current: $c => $c.querySelectorAll('.m18-reading img').countAbove().run(),
        total: $c => $c.querySelectorAll('.m18-reading img').length().run(),
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
      return (
        $c
          .detectURLChanges($c.trigger().run())
          // La lista carga de a tandas con el botón .m18-load-more; re-procesa
          // cuando crece para resaltar capítulos viejos que el usuario expande.
          .detectChanges($c.this('list.elementsSelector').length().run(), $c.trigger().run())
          .domReady()
          .trigger()
          .run()
      );
    },
  },
};
