# Brand assets

The mark is an **open ring with a core and an incoming call**: a boundary with an
aperture, a proposed action crossing it, and the core that decides. It is the
execution rule drawn once — propose → authorize → execute → record.

## Files

| File | Use |
| --- | --- |
| `logo-mark.svg` | Primary mark; adapts to light/dark via `prefers-color-scheme`. |
| `logo-mark-light.svg` / `logo-mark-dark.svg` | Fixed-color marks for contexts that ignore CSS (GitHub, email, slides). |
| `favicon.svg` | Same as `logo-mark.svg`; linked from both pages. |
| `apple-touch-icon.png` | 180×180, opaque background with rounded corners. |
| `logo-512.png` / `logo-512-dark.png` | Square mark with padding, for avatars and app listings. |
| `logo-lockup.png` / `-dark.png` | Mark + `autonomykernel.org`, 2× density, trimmed. |
| `logo-wordmark.png` / `-dark.png` | Mark + `Autonomy Kernel`, 2× density, trimmed. |
| `og.png` / `og-primitives.png` | 1200×630 social cards. |

## Colors

| Token | Light | Dark |
| --- | --- | --- |
| Accent | `#345fb2` | `#87b1fd` |
| Ink | `#24201a` | `#e5e3de` |
| Background | `#fcfaf6` | `#0d0e12` |

Display face: Space Grotesk 400. The `.` in `autonomykernel.org` is accent-colored.

## Geometry

32×32 grid, center `16,16`. Ring radius 11 with the gap on the right; core radius
3.6; stroke 2.4, round caps. The call line is ink, everything else accent. Keep
clear space of at least the core diameter on all sides. Do not recolor the core
away from accent, rotate the aperture, or close the ring.

## Regenerating

Both PNG generators are HTML rendered with headless Chrome (they pull Space
Grotesk from Google Fonts, so they need network at render time).

```sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# social cards — text is overridable: ?title=…&sub=…&tag=…&meta=…
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1200,630 \
  --virtual-time-budget=6000 --screenshot=assets/og.png \
  "file://$PWD/assets/og.html"

# lockups — ?theme=dark for dark, ?word=short for "Autonomy Kernel"
"$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --default-background-color=00000000 --window-size=1400,240 \
  --virtual-time-budget=6000 --screenshot=assets/logo-lockup.png \
  "file://$PWD/assets/logo-lockup.html"
magick assets/logo-lockup.png -trim +repage -bordercolor none -border 24 assets/logo-lockup.png
```

Square PNGs come from the SVG. The shipped ones use a padded `viewBox`
(`-6 -6 44 44`) so the mark isn't flush to the edge:

```sh
rsvg-convert -w 512 -h 512 assets/logo-mark-light.svg -o assets/logo-512.png
```
