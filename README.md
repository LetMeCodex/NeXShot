# NexShot Technologies — Website

Open `index.html` in Chrome or Edge to view the site (an internet connection is needed for fonts and animation libraries).

## Folder structure

```
NexShot-Website/
├── index.html                  Page markup (all sections + footer)
├── README.md
└── assets/
    ├── css/
    │   └── style.css           Colours, typography, layout, liquid-glass styles
    ├── js/
    │   ├── data.js             Content: contacts, competitions, scores, NRAI calendar, gallery list
    │   ├── main.js             Animations and interactions
    │   └── gallery.js          Gallery: wall / reel / index views, scope loupe, lightbox
    └── img/
        ├── favicon.svg
        ├── nexshot-mark.svg    Temporary logo mark
        └── gallery/            Web-optimised photos (nexshot-NN-category.jpg + -sm.jpg thumbnails)
```

## Common edits

- **Scores, competitions, events, phone numbers:** edit `assets/js/data.js`.
- **Colours and fonts:** edit the `:root` block at the top of `assets/css/style.css`.
- **Official logo:** put `nexshot-icon.png` in `assets/img/`, then in `index.html` replace each
  `<svg><use href="#nx-mark"/></svg>` inside a `.brand-logo` with `<img src="assets/img/nexshot-icon.png" alt="">`.
- **Gallery photos:** save a full-size JPG (max ~1600px) and a small `-sm.jpg` (~720px) in `assets/img/gallery/`,
  then add one line to `window.GALLERY` in `assets/js/data.js` with its size, category, title and subtitle.
- **Slot timings:** search for `name="slot"` in `index.html`.

## Libraries (loaded from CDN)

- GSAP 3.13.0 + ScrollTrigger — scroll and timeline animations
- GSAP Flip — morphs the gallery between Wall, Reel and Index and animates filters
- GSAP Draggable + InertiaPlugin — throwable gallery wall and film reel
- GSAP Observer — swipe in the photo viewer, trackpad scrolling in the reel
- Lenis 1.1.13 — smooth scrolling
- SplitType 0.3.4 — splitting headings into letters/words
- Motion 11.11.13 — spring physics for buttons, nav, tilt cards

## Notes

- The booking form and certificate check run in the page only. Connect them to your backend to save bookings
  and verify real certificate IDs.
- The liquid-glass refraction map is embedded inside `index.html` (the `#liquid-glass` SVG filter).
- The liquid-glass refraction shows fully in Chrome and Edge; Safari and Firefox show frosted glass.
