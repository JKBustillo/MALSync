import { PageInterface } from '../../pageInterface';

export const PlotNoFansub: PageInterface = {
  name: 'PlotNoFansub',
  domain: 'https://plotnofansub.com',
  languages: ['Spanish'],
  type: 'manga',
  urls: {
    match: ['*://plotnofansub.com/*'],
  },
  sync: {
    // `/manga/page/2/` (paginación del archivo) y `/manga/<slug>/feed/` también
    // cuelgan de `/manga/`, así que se filtran aquí en vez de con urlPart.
    isSyncPage($c) {
      return $c.url().matches('/manga/(?!page/)[^/]+/\\d+(?:-\\d+)?/?$').run();
    },
    getTitle($c) {
      return $c.querySelector('h1').text().trim().run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getOverviewUrl($c) {
      return $c
        .string('/manga/')
        .concat($c.this('sync.getIdentifier').run())
        .concat('/')
        .urlAbsolute()
        .run();
    },
    getEpisode($c) {
      // Los capítulos decimales llevan guion en la URL (`251-5` es el 251.5);
      // nos quedamos con la parte entera.
      return $c.url().urlPart(5).regex('^(\\d+)', 1).number().run();
    },
    readerConfig: [
      {
        current: {
          selector: '.reading-content .rd-panel img',
          mode: 'countAbove',
        },
        total: {
          selector: '.reading-content .rd-panel img',
          mode: 'count',
        },
      },
    ],
  },
  overview: {
    isOverviewPage($c) {
      return $c.url().matches('/manga/(?!page/|feed/)[^/]+/?$').run();
    },
    getTitle($c) {
      return $c.querySelector('h1.mn-detail-title').text().trim().run();
    },
    getIdentifier($c) {
      return $c.url().urlPart(4).run();
    },
    getImage($c) {
      return $c.querySelector('[property="og:image"]').getAttribute('content').ifNotReturn().run();
    },
    uiInjection($c) {
      return $c.querySelector('h1.mn-detail-title').uiAfter().run();
    },
  },
  list: {
    elementsSelector($c) {
      return $c.querySelectorAll('#mn-detail-chapter-list a.mn-detail-chapter-item').run();
    },
    elementUrl($c) {
      return $c.getAttribute('href').urlAbsolute().run();
    },
    // El core ya hace parseInt sobre esto, así que los capítulos decimales
    // colapsan solos en su entero (251.5 -> 251).
    elementEp($c) {
      return $c.find('.mn-detail-chapter-name').text().trim().number().run();
    },
  },
  lifecycle: {
    setup($c) {
      return $c.addStyle(require('./style.less?raw').toString()).run();
    },
    // La lista llega de 20 en 20 con el botón #mn-detail-load-more; detectChanges
    // re-procesa cuando crece, para resaltar los capítulos viejos que el usuario expande.
    ready($c) {
      return $c
        .detectURLChanges($c.trigger().run())
        .detectChanges($c.this('list.elementsSelector').length().run(), $c.trigger().run())
        .domReady()
        .trigger()
        .run();
    },
  },
};
