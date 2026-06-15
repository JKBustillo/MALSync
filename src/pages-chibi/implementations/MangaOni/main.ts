import { PageInterface } from '../../pageInterface';

export const MangaOni: PageInterface = {
  name: 'MangaOni',
  domain: 'https://manga-oni.com',
  languages: ['Spanish'],
  type: 'manga',
  urls: {
    match: ['*://manga-oni.com/manga/*', '*://manga-oni.com/manhwa/*', '*://manga-oni.com/lector/*'],
  },
  search: 'https://manga-oni.com/?s={searchtermPlus}&post_type=wp-manga',
  sync: {
    isSyncPage($c) {
      return $c.url().urlPart(3).equals('lector').run();
    },
    getTitle($c) {
      return $c.title().replaceRegex('\\s+[Cc]ap[íi]tulo.*$', '').trim().run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getOverviewUrl($c) {
      return $c.querySelector('.azul.ajp').getAttribute('href').ifNotReturn().urlAbsolute().run();
    },
    getEpisode($c) {
      return $c
        .title()
        .regex('(?:[Cc]ap[íi]tulo|[Cc]hapter)[_\\s-]*(\\d+)', 1)
        .number()
        .run();
    },
    readerConfig: [
      {
        current: {
          selector: '[id="m_img"]',
          mode: 'countAbove',
        },
        total: {
          selector: '[id="m_img"]',
          mode: 'count',
        },
      },
    ],
  },
  overview: {
    isOverviewPage($c) {
      return $c
        .and(
          $c.url().urlPart(3).matches('^(?:manga|manhwa)$').run(),
          $c.url().urlPart(4).boolean().run(),
          $c.url().urlPart(5).boolean().not().run(),
        )
        .run();
    },
    getTitle($c) {
      return $c.querySelector('h1.post-title > a').text().trim().run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getImage($c) {
      return $c.querySelector('[property="og:image"]').getAttribute('content').ifNotReturn().run();
    },
    uiInjection($c) {
      return $c.querySelector('#info-i').uiAfter().run();
    },
  },
  list: {
    elementsSelector($c) {
      return $c.querySelectorAll('#c_list > a').run();
    },
    elementUrl($c) {
      return $c.closest('a').getAttribute('href').urlAbsolute().run();
    },
    elementEp($c) {
      return $c
        .find('.entry-title > h3')
        .text()
        .trim()
        .regex('(?:[Cc]ap[íi]tulo|[Cc]hapter)[_\\s-]*(\\d+)', 1)
        .number()
        .run();
    },
  },
  lifecycle: {
    setup($c) {
      return $c.addStyle(require('./style.less?raw').toString()).run();
    },
    ready($c) {
      return $c
        .title()
        .contains('not found')
        .ifThen($c => $c.string('404').log().return().run())
        .domReady()
        .trigger()
        .run();
    },
    overviewIsReady($c) {
      return $c.waitUntilTrue($c.querySelector('#c_list > a').boolean().run()).trigger().run();
    },
  },
};
