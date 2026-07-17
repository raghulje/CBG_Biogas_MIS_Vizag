# Mobile & PWA / iOS Readiness

## Summary

The app is **mobile-responsive** and **PWA-ready** with **iOS-safe** layout. Below is what was implemented and what to test on iOS.

---

## Implemented

### 1. PWA basics

- **`/manifest.json`** (in `public/`)
  - `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color`, `icons`
- **`index.html`**
  - `<link rel="manifest" href="/manifest.json" />`
  - `<meta name="theme-color" content="#2879b6" />`
  - `<meta name="apple-mobile-web-app-capable" content="yes" />`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`
  - `<meta name="apple-mobile-web-app-title" content="Biogas MIS" />`
  - `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`
  - `<link rel="apple-touch-icon" href="/vite.svg" />`

To make it a full **installable PWA** (offline/cache), add a service worker (e.g. `vite-plugin-pwa`). The current setup allows “Add to Home Screen” and standalone display on iOS/Android.

### 2. iOS safe area & viewport

- **Viewport**
  - `viewport-fit=cover` so safe-area insets are available on notched iPhones.
- **Height**
  - `min-height: 100vh`, `-webkit-fill-available`, `100dvh` on `html` / `body` / `#root` to avoid iOS address-bar issues.
- **Safe area**
  - **AppBar:** `paddingTop: env(safe-area-inset-top)` so the bar doesn’t sit under the notch.
  - **Main content:** `mt` uses `calc(56px + env(safe-area-inset-top))` (xs) / `calc(64px + env(safe-area-inset-top))` (sm); `paddingBottom` includes `env(safe-area-inset-bottom)` so content clears the home indicator.
  - **Mobile drawer:** `paddingTop: env(safe-area-inset-top)` on the paper.
  - **MIS form sticky footer:** `paddingBottom: calc(16px + env(safe-area-inset-bottom))` on mobile.
  - **`.mobile-sticky-footer`** in CSS: same bottom safe-area padding.
- **Misc**
  - `-webkit-text-size-adjust: 100%` on `html`.
  - `-webkit-overflow-scrolling: touch` on `body`.
  - `WebkitBackdropFilter` where `backdropFilter` is used (Layout AppBar, Drawer, MISFormView footer).

### 3. Responsive behaviour (already in place)

- **Layout**
  - Mobile: temporary drawer, hamburger, main `p: 1.5`, `mt` as above.
  - Desktop: permanent drawer, no hamburger.
- **Pages**
  - **MIS Entry:** `useMediaQuery(breakpoints.down('sm'))`, mobile sticky footer with Save Draft / Submit, fullScreen Add Customer dialog on small screens.
  - **MIS List:** Table hidden on small, card list shown; filters stack.
  - **Dashboard:** Filter buttons scroll horizontally, date/custom range stack; cards grid.
  - **Customer:** Responsive grid and dialogs.
  - **Admin:** Tables hidden on small, card/stack layouts; tabs and forms adapt.
  - **Final MIS / Consolidated:** Responsive grids and overflow scroll.
- **Touch**
  - Min touch targets ~44px in `index.css` for buttons/inputs on small screens.

---

## Modules overview

| Module           | Mobile layout        | iOS notes                                  |
|-----------------|----------------------|--------------------------------------------|
| Layout          | Drawer + AppBar      | Safe area on AppBar, main, drawer          |
| MIS Entry       | Form + sticky footer  | Footer safe-area; fullScreen dialogs       |
| MIS List        | Cards on xs          | Horizontal scroll filters                  |
| Dashboard       | Stack + scroll       | OK                                         |
| Customer        | Grid + dialogs       | OK                                         |
| Admin           | Cards/tabs on xs     | Tables → cards                              |
| Final MIS       | Responsive           | overflow-x on tables                        |
| Login           | Single column        | OK                                         |

---

## What to test on iOS

1. **Safe area**
   - Open in Safari, add to Home Screen, open as standalone.
   - Check: status bar / notch don’t cover AppBar; home indicator doesn’t cover sticky footer or main bottom padding.
2. **Height**
   - Portrait/landscape: no big gap at bottom; main content fills screen.
3. **Scroll**
   - Long MIS form and list: smooth scroll; no “rubber band” issues in wrong areas.
4. **Dialogs**
   - Add Customer and other modals: fullScreen on small; no overlap with notch/safe area.
5. **Date pickers**
   - MUI DatePicker on Dashboard/MIS: iOS native picker should open without layout glitches.
6. **Inputs**
   - Focus and keyboard: no fixed elements hidden by keyboard; sticky footer above keyboard if needed.

---

## Optional next steps

- **Service worker:** Add `vite-plugin-pwa` for offline/cache and install prompt.
- **Icons:** Replace `vite.svg` with 192×192 and 512×512 PNGs in `manifest.json` and as `apple-touch-icon`.
- **Standalone:** If status bar looks wrong in standalone, try `apple-mobile-web-app-status-bar-style`: `black-translucent` (content under status bar) or `black` (content below it).
