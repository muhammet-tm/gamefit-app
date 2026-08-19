# GameFit brand assets

Everything in this folder is **generated**. Do not hand-edit it.

```bash
npx tsx scripts/generate-brand-assets.mjs
```

The single source is [`src/lib/brand.js`](../src/lib/brand.js). It holds the
mark as shape descriptors, which both `src/components/brand/Logo.jsx` (React,
as real JSX elements) and the generator script consume. That indirection exists
so the logo in the running app and the logo on the app icon cannot drift, and
so React never needs `dangerouslySetInnerHTML` to draw it.

## Which file to reach for

| Context | File |
|---|---|
| Anywhere inside the React app | `Logo.jsx` — import it, don't link a file |
| Dark ground (navy, `#0B1A24`/`#112532`) | `logo-horizontal-on-dark.svg` |
| Light ground (white, `#EDF2F5`) | `logo-horizontal-on-light.svg` |
| Narrow or square space | `logo-stacked-on-*.svg` |
| Lettering only, mark already present | `wordmark-on-*.svg` |
| Mark only — avatars, badges, favicons | `mascot.svg` |
| Below 48px | `mascot-simplified.svg` |
| iOS / Android / PWA icon | `app-icon.svg` |
| Android adaptive icon | `app-icon-maskable.svg` |

## Three rules that are easy to get wrong

1. **Gold is two values, not one.** `#F4B044` measures 1.9:1 on white and fails
   as text. On a light ground gold *lettering* becomes `#8A5A06`. As a fill it
   stays `#F4B044` in both. This is why `-on-dark` and `-on-light` exist and
   why they are not interchangeable. In the app, `Wordmark` defaults to
   `tone="auto"` and reads `--gf-gold-text`, which already encodes the split.

2. **The simplified mascot is not just "the same thing smaller."** It drops the
   eye catchlights, the smile and the inner-ear shadow, and thickens the
   outline from 7 to 10 units. Those details are under half a pixel at 16px and
   render as grey noise. It also widens the ears, because a heavy outline
   closes a thin triangle. Use it at or below 48px; `Mascot` switches
   automatically on `size`.

3. **The app icon's navy square is load-bearing.** iOS and Android composite
   icons against wallpaper nobody controls. But do not reuse the app icon
   *inside* the app on a navy screen — the rounded corner draws a visible box.
   Use the bare `Mascot` there.

## Provenance

`reference/founder-wordmark-original-1486.png` is the founder's original
lettering, kept unmodified. The vector in `src/lib/brand.js` was redrawn from
it on a 100-unit cap height (stem 27, chamfer 9, pointed A, deep M).

That redraw was the point. The lettering had arrived as a base64 PNG inside an
SVG wrapper — element census `image:1, path:0` — which meant it could not scale
past 1486px, could not be recoloured without regenerating images, and could not
drive embroidery, foil, vinyl or laser, none of which accept a bitmap. It is
true vector now.

The husky itself is drawn, not sourced. It is owned outright, which matters for
an App Store submission where a stock lookalike would be someone else's artwork.
