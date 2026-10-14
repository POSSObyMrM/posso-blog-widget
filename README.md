# posso-blog-widget

Script (`lw-rss-engine.js`) que lee el feed RSS del blog de POSSO en LearnWorlds (`https://posso.es/rss.xml`) y pinta una selección de entradas como tarjetas dentro de cualquier página, ya sea del propio sitio de LearnWorlds o de un dominio externo.

Es un único archivo JavaScript sin dependencias: se incluye con una etiqueta `<script>` y se configura con atributos `data-*`. Se publica con GitHub Pages en:

```
https://possobymrm.github.io/posso-blog-widget/lw-rss-engine.js
```

El script **no incluye estilos**: el CSS de las tarjetas vive en el proyecto de CSS de LearnWorlds (ver [Estilos](#estilos)).

## Uso rápido

```html
<!-- 1. Contenedor donde se insertarán las tarjetas -->
<div id="ultimas-actividades"></div>

<!-- 2. Script con su configuración -->
<script
  src="https://possobymrm.github.io/posso-blog-widget/lw-rss-engine.js"
  data-container="#ultimas-actividades"
  data-template="card-mini"
  data-category="actividades"
  data-filter="future"
  data-limit="3">
</script>
```

Se pueden poner varios scripts en la misma página, cada uno con su propio contenedor y configuración.

## Atributos de configuración

| Atributo | Obligatorio | Por defecto | Descripción |
|---|---|---|---|
| `data-container` | Sí | — | Selector CSS del elemento donde se insertan las tarjetas (`#id`, `.clase`…). Si no existe en la página, el script no hace nada. |
| `data-template` | No | `card-mini` | Diseño de las tarjetas. Ver [Plantillas](#plantillas). |
| `data-limit` | No | `3` | Número máximo de entradas a mostrar. |
| `data-category` | No | (todas) | Lista de categorías separadas por comas para incluir o excluir. Ver [Filtro por categoría](#filtro-por-categoría). |
| `data-filter` | No | (sin filtro) | `future`: solo entradas con fecha posterior a ahora. `past`: solo entradas con fecha pasada. |
| `data-remove` | No | — | Slug de una entrada que no debe mostrarse (último segmento de su URL). Útil para no listar el artículo que se está leyendo. |

### Filtro por categoría

`data-category` acepta varias categorías separadas por comas. No distingue mayúsculas y minúsculas.

- Sin prefijo: **incluir**. La entrada se muestra si tiene **al menos una** de estas categorías.
- Con `-` delante: **excluir**. La entrada se descarta si tiene **cualquiera** de estas categorías.
- La exclusión tiene prioridad sobre la inclusión.

```html
data-category="talleres, charlas"          <!-- talleres O charlas -->
data-category="-interno"                   <!-- todo menos lo etiquetado "interno" -->
data-category="talleres, -cancelado"       <!-- talleres que no estén cancelados -->
```

### Orden de los filtros

Para cada entrada del feed se aplican, en este orden: `data-remove`, `data-filter` (fecha), exclusión por categoría e inclusión por categoría. Después se toman las primeras `data-limit` entradas en el orden en que aparecen en el RSS.

## Plantillas

| Plantilla | Aspecto | Contenido | Imagen |
|---|---|---|---|
| `card-mini` | Tarjeta compacta con borde, distintivo "Actividad" y fecha grande. 3 por fila en escritorio. | Fecha y título | No |
| `card-list` | Tarjeta horizontal a ancho completo (vertical en pantallas < 992 px). | Título, descripción, fecha | Sí |
| `card-color` | Tarjeta de blog en tonos salmón, con etiquetas de categoría. 3 por fila. | Categorías, imagen, autor, fecha, título, descripción | Sí |
| `card-dark` | Igual que `card-color` pero con fondo oscuro, que pasa a salmón al pasar el ratón. | Igual que `card-color` | Sí |
| `card-hero` | Dos columnas al 50 % con 8 px de separación (una sobre otra en pantallas < 992 px). Izquierda: título, fecha y texto. Derecha: imagen y botón "Leer más"; la imagen se estira para que la columna mida lo mismo que la de texto. Solo el botón es enlace. | Título, fecha, descripción | Sí |
| `debug` | Muestra en bruto los datos de cada entrada en formato JSON. Para pruebas. | Todos los datos | Sí |

Si `data-template` tiene un valor que no existe, se usa `card-mini`.

### Variantes por clase

Añadiendo una clase a un elemento que contenga el widget se cambian algunos colores:

- `.beige-cards`: en `card-mini`, el texto claro pasa a usar `--soft-beige`.
- `.dark-cards`: en las tarjetas de blog (`card-color`, `card-dark`), el fondo de la columna pasa a `--blog-color`.

## Cómo funciona

1. **Descarga el RSS.** Si la página está en `posso.es`, lo pide directamente a `/rss.xml`. En cualquier otro dominio lo pide a través del proxy público `corsproxy.io` para saltar la restricción CORS.
2. **Filtra** las entradas según los atributos de configuración.
3. **Normaliza los datos** de cada entrada:
   - `link` y `categories` tal cual vienen en el RSS.
   - `title`: si contiene `:`, todo lo que va después de los primeros dos puntos se envuelve en un `<span>` para poder darle otro estilo (p. ej. `Taller:<span> Cerámica</span>`).
   - `description`: el HTML del RSS sin etiquetas, recortado a 180 caracteres.
   - `day`, `month`, `year`: a partir de `pubDate`, con el mes en español (`es-ES`).
   - `image`: la primera imagen (`src="..."`) que aparezca en la descripción del RSS.
4. **Busca imágenes** que falten (excepto con `card-mini`): descarga la página de cada entrada y toma su `og:image`. Fuera de `posso.es` también pasa por `corsproxy.io`.
5. **Pinta las tarjetas** en el contenedor. Antes vacía su contenido y le añade las clases de rejilla de LearnWorlds (`lw-event-wrapper`, `lw-cols`, `multiple-rows`…), conservando las clases que ya tuviera.

Los mensajes de progreso y error aparecen en la consola del navegador con el prefijo `> RSS Engine`.

## Estilos

El script solo genera el HTML; el aspecto de las tarjetas depende de CSS que debe estar cargado en la página:

- **Estilos propios de las tarjetas** (`.lw-card`, `.card-mini`, `.card-list`, `.card-color`, `.card-dark`, `.card-hero`, variables `--blog-color`, `--radius`…). Se mantienen en el proyecto de CSS de LearnWorlds. `lw-rss-engine.css` es la copia de la que se sacaron.
- **Estilos de LearnWorlds.** Las plantillas usan las clases de rejilla y tipografía de LearnWorlds (`span_4_of_12`, `learnworlds-heading3`, etc.) y variables CSS del tema (`--salmon-100` a `--salmon-300`, `--ash-700`, `--soft-beige`).

Fuera de una página de LearnWorlds que cargue ese CSS, las tarjetas se verán sin maquetar.

## Dependencias del entorno

- **corsproxy.io.** Fuera de `posso.es`, el widget depende de este servicio externo. Si cae o limita las peticiones, el widget no mostrará nada (o mostrará tarjetas sin imagen).
- **Fuente Poppins** para las etiquetas de categoría.

## Limitaciones conocidas

- El autor no se lee del RSS: `card-color` y `card-dark` siempre muestran "Equipo POSSO".
- Si una entrada no tiene imagen ni en el RSS ni en su `og:image`, se usa un marcador de `via.placeholder.com`.
- Los textos del RSS se insertan como HTML sin escapar.
- El script debe cargarse como `<script>` clásico (no `type="module"`), porque lee su configuración de `document.currentScript`.
- Los errores no se muestran en la página: si algo falla, el contenedor se queda como estaba y el detalle va a la consola.

## Desarrollo

El código fuente es `lw-rss-engine.js`, sin paso de compilación. Para cambiar la URL del feed o el dominio considerado "propio", edita `RSS_URL` y la comprobación de `isSameOrigin` al principio del archivo. Las plantillas están en el objeto `templates`. Si se añade una plantilla o se cambian sus clases, hay que actualizar también el CSS en LearnWorlds.

Los cambios en `main` se publican en GitHub Pages automáticamente; puede tardar unos minutos y la caché del navegador o de la CDN puede servir la versión anterior un rato.
