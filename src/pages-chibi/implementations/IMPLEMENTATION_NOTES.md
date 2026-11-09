# Notas de implementación — pages-chibi

Bugs y soluciones encontrados durante implementaciones reales. Útil como referencia antes de debuggear un problema nuevo.

---

## 1. jQuery optimiza `$('#id')` y devuelve solo el primer elemento

**Síntoma:** El contador de páginas del lector salta de 0% a 100% en cuanto la primera imagen cabe en el viewport.

**Causa:** jQuery usa `document.getElementById()` internamente cuando el selector es solo `#id`. Eso devuelve únicamente el **primer** elemento, aunque haya varios con el mismo `id` en el DOM (HTML técnicamente inválido pero habitual en readers). Resultado: `total = 1`, y en cuanto `countAbove = 1`, se marca el capítulo como leído.

**Solución:** Usar el selector de atributo equivalente, que fuerza `querySelectorAll`:

```typescript
// ❌ Devuelve 1 elemento
selector: '#m_img'

// ✅ Devuelve todos los elementos con ese id
selector: '[id="m_img"]'
```

---

## 2. Imágenes lazy-loaded con altura 0 falsifican `countAbove`

**Síntoma:** El capítulo se marca como leído al ver la segunda página, o la barra de progreso salta a completa prematuramente.

**Causa:** Las imágenes que aún no han cargado (solo tienen `data-src`, sin `src`) tienen `height: 0` en el DOM. Al estar apiladas en la misma posición Y que la última imagen cargada, en cuanto el viewport supera esa posición, `countAbove` las cuenta a todas como "por encima" → `current = total`.

**Solución (a nivel de lógica, la buena):** desde el fix de `countAbove` (`src/utils/mangaProgress/modes/countAbove.ts`), el modo **ignora las `<img>` con `naturalWidth === 0`** (aún sin descargar). Así una imagen no cuenta como leída hasta que carga de verdad, sin importar su altura colapsada, su clase ni el `min-height` que ponga el sitio. Esto cubre tanto `data-src` como lazy nativo (`loading="lazy"`) y **no hace falta ningún hack de CSS** en `style.less`.

**Historia (por qué NO usar el hack CSS de `min-height`):** durante Toonily se intentó forzar altura a las imgs para que ocuparan espacio real. Falló tres veces:
1. `.reading-content img { min-height: 70vh }` — lo pisaba el `min-height:200px` del propio sitio (más especificidad/`!important`).
2. `.reading-content img.wp-manga-chapter-img { min-height: 100vh !important }` — funcionó… hasta que el sitio sirvió una variante del lector con otra clase y el selector dejó de casar.

Moraleja: pelear la geometría/CSS del sitio es frágil (clase, `min-height`, orden de carga, plantillas A/B cambian solos). La señal robusta es `naturalWidth`, que no depende del DOM del sitio. El hack de `min-height` solo tendría sentido para lectores que NO usan `<img>` (canvas/background), donde `naturalWidth` no aplica.

---

## 3. Lista de capítulos cargada por AJAX no se resalta

**Síntoma:** El widget de MAL-Sync aparece correctamente en la página del manga, pero ningún capítulo tiene el resaltado de "último leído".

**Causa:** En el tema Madara (y otros) la lista de capítulos se inyecta por AJAX tras el montaje de la página. MAL-Sync procesa la lista antes de que esté disponible en el DOM y no la re-procesa cuando llega.

**Solución:** Añadir `overviewIsReady` en el `lifecycle` para retrasar el procesamiento hasta que haya al menos un elemento de la lista en el DOM:

```typescript
lifecycle: {
  overviewIsReady($c) {
    return $c.waitUntilTrue($c.querySelector('#c_list > a').boolean().run()).trigger().run();
  },
}
```

Sustituir `#c_list > a` por el selector real del primer ítem de la lista del sitio en cuestión.

---

## 4. Clase `mal-sync-active` aplicada pero resaltado invisible

**Síntoma:** Inspectando el DOM se ve la clase `mal-sync-active` en el elemento correcto, pero visualmente no hay ningún cambio.

**Causa:** La regla base de `pages.less` usa `background-color: #002e7459` (muy transparente). El CSS del sitio puede ganarle en especificidad, o el color simplemente no contrasta con el fondo del sitio.

**Solución:** Sobrescribir con el selector específico del sitio y `!important` en `style.less`:

```less
#c_list > a.mal-sync-active {
  background-color: @activeEp !important;
}
```

Si el color sigue sin verse, definir un `@activeEp` propio con más opacidad:

```less
@activeEp: #2e51a280; // más visible que el valor base
```

---

## 5. Listas con "cargar más" (load more): chibi no puede hacer click

**Síntoma:** La lista de capítulos solo muestra los más recientes (ej. los últimos 40) detrás de un botón "cargar más". Los capítulos viejos no se resaltan porque no están en el DOM.

**Causa:** La DSL de chibi es declarativa y sandboxeada (se serializa a JSON). Las `domFunctions` son de **solo lectura** (`querySelector`, `text`, `getAttribute`, `setStyle`, inyección de UI). **No existe ninguna acción `click`, `scroll` ni `dispatchEvent`**, así que no se puede pulsar el botón ni forzar la carga desde la implementación.

**Solución parcial:** No se puede auto-cargar, pero sí re-resaltar cuando el usuario expande la lista manualmente. Vigilar el número de elementos con `detectChanges` en el `ready` y re-disparar cuando crezca:

```typescript
ready($c) {
  return $c
    .detectURLChanges($c.trigger().run())
    .detectChanges($c.this('list.elementsSelector').length().run(), $c.trigger().run())
    .domReady()
    .trigger()
    .run();
}
```

Así, el primer lote se resalta solo; al pulsar "cargar más", `detectChanges` (polling cada 500ms) detecta el cambio y re-procesa, resaltando el capítulo viejo. Mismo patrón que usan AnimeNexus y animeLib.
