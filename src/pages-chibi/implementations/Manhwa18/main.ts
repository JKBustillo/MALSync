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
      return $c.querySelector('.ip-reader-heading b').text().trim().run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getOverviewUrl($c) {
      return $c.string('/manga/').concat($c.this('sync.getIdentifier').run()).urlAbsolute().run();
    },
    getEpisode($c) {
      // The slug drops the decimal point (316.5 → `chapter-3165`), so read it from the <title>.
      return $c.title().regex('Chapter\\s+(\\d+(?:\\.\\d+)?)', 1).number().ifNotReturn().run();
    },
    readerConfig: [
      {
        // Images are mounted lazily near the viewport, so count the page containers instead.
        current: $c =>
          $c.querySelectorAll('.ip-reader-pages [data-reader-page-index]').countAbove().run(),
        total: $c =>
          $c.querySelectorAll('.ip-reader-pages [data-reader-page-index]').length().run(),
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
      return $c.querySelectorAll('.ip-info-ch-list a.ip-info-ch').run();
    },
    elementUrl($c) {
      return $c.getAttribute('href').urlAbsolute().run();
    },
    elementEp($c) {
      return $c.find('.ip-info-ch-stub').text().trim().number().run();
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
          // The list only shows recent chapters until "Show all" expands it.
          .detectChanges($c.this('list.elementsSelector').length().run(), $c.trigger().run())
          .domReady()
          .trigger()
          .run()
      );
    },
  },
};
