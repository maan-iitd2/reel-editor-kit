# D'YOU brand kit (for motion-design videos)

Sources: dyou.co page source (fonts) + pixel sampling of 6 @dyou.co posts, 23 Oct 2026 (`refs/`).
Use the grammar, never their logos or product shots unless this is work for D'YOU.

## Type

| Role | Font on dyou.co | Free stand-in | How they use it |
|---|---|---|---|
| Headline | **Le Monde Journal** (Typofonderie, paid) | Newsreader or Instrument Serif | lowercase, big, tight leading; one word or phrase switches to *italic* ("serum *cheat sheet*", "*skin concern?*", "*actually* need") |
| Kicker / labels | **Montserrat** (variable) | same (Google Fonts) | UPPERCASE, small, light weight with the key part in bold ("YOUR D'YOUEY ROUTINE, **MADE SIMPLER**") |
| UI / accents | **Barlow** 400/700 | same (Google Fonts) | buttons, small print |
| Logo | D'YOU wordmark, wide-tracked caps | Montserrat 500, letter-spacing 0.2em | never redraw the real mark |

Voice: lowercase, playful, pun-led ("your d'youey routine", "lets order some room service"), sparkle/heart emoji only in captions, never on the graphic.

## Colour

Core blues (most posts):
- `#215da0` headline blue (site: `#2a6dcb`)
- `#2c5e9b` / `#254f79` deep navy text
- `#153d75` darkest folder blue
- `#5678b2` soft headline blue
- `#94c0f1` hustle bottle sky
- `#c7ddf3` pale folder blue
- `#e2f5fe` sky-wash background
- `#a6e0ec` peptight aqua
- logo bubble: periwinkle, around `#c3d9f9`

Secondary product worlds (one per post, never mixed):
- violet (inbalance): `#52339f` ink, `#9173e6` mid, `#f7f4fc` bg
- pink (in my defence): `#e59caf` bg, `#e7b6bc` bottle, `#ac344f` label
- warm editorial (lifestyle shots): cream type over photos, single red accent `#d62c05`

Neutrals: paper `#f1f0ed` / `#fbf7ee` (textured, slightly warm), white `#f8f8f8`.

Rule: one product world per frame. Blue is the default, violet/pink only when that product is the subject.

## Layout grammar
- Text sits top-left or top-centre on a calm, soft background, product in the lower two thirds.
- Paper / notebook textures, binder rings, folder tabs, letter dice: tactile props, real photography.
- Soft daylight, low contrast, pastel. No neon, no gradients-as-decoration, no hard black.

## Motion translation (for the motion-design skill)
- Headline: masked rise per word, the italic word lands last on its own spring (heavy-type preset 120/24).
- Kicker: fade + 8 px rise, 60 ms letter-spacing settle.
- Captions on talking heads (justyn.ai style, recoloured): box `#153d75` at 90 %, upcoming words `#94c0f1` at 60 %, spoken word `#fbf7ee`; emphasis words swap to the serif italic.
- Big background words behind the speaker: serif, `#fbf7ee`, needs a subject matte.
- Transitions: folder-tab slide, paper flip, soft blur dissolve. Nothing bouncy (damping >= 0.72).
- Sound: soft, airy; paper rustle, glass tap, gentle pops. No hard hits.
