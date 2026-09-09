---
name: screens-artifact
description: Update the CineReact screens mockup artifact (the phone-frame HTML page published at a fixed claude.ai URL) whenever a screen changes, and append an entry to the change log inside it. Use when the user asks to see the screens, update the mockup or artifact, or after a UI change that alters what a screen looks like.
---

# The screens mockup artifact

The user keeps a visual mockup of every app screen as a published artifact and
wants it to track the code. It is one page of phone frames drawn in plain
HTML and CSS (no library, no external images), plus a change log at the
bottom.

- Artifact URL: https://claude.ai/code/artifact/69cded94-36a0-4e11-bdca-b7fb3480f67a
- Source of truth: `preview/screens.html` in this repo (committed). Edit that
  file; never rebuild the page from scratch in a scratchpad.
- Favicon is already set (film clapper). Do not pass a new one.

## When to update it

- A screen was added, removed, or visibly changed (layout, controls, wording
  the mockup shows, a new state worth drawing).
- The user asks to see the screens or the draft.

Small copy tweaks that the mockup does not show do not need an update, but
say so in the recap.

## How to update it

1. Read the live page first so you build on the current version:
   `Artifact` with `action: "read"` and the URL above. If it differs from
   `preview/screens.html` (someone published from elsewhere), merge that
   into the file before editing.
2. Edit `preview/screens.html`. Keep to what is there:
   - App tokens are copied from `src/theme/index.ts` (dark ground, yellow
     accent). The phones are always dark; the page around them follows the
     viewer's theme.
   - One `<figure>` per screen inside `.grid`, with a `<figcaption>` that
     names the screen and says what it does. Each phone scrolls, so draw the
     whole screen instead of clipping it.
   - Icons are inline `<symbol>` definitions at the top; add one there
     rather than loading an icon font. Covers are CSS gradients or the icon
     fallback; the artifact CSP blocks remote images.
   - Example data only, never the user's real entries.
3. Append an entry to the change log (`<section class="changes">`, newest
   first): bump the version in the eyebrow at the top (`v2`, `v3`, ...),
   give the date, and list what changed in the app and which phones were
   redrawn.
4. Publish with the same file path and the URL:
   `Artifact` with `file_path: preview/screens.html`,
   `url: <the URL above>`, and a short `label` such as `v3 diary filters`.
   Omit `favicon`. Publishing without `url` creates a second artifact; do
   not do that.
5. Put the link in the recap.

## Notes

- `preview/` is in `.prettierignore`, so `npm run format` leaves the file
  alone; keep the hand formatting readable.
- The page is a design reference, not a live capture. Say so if the user
  asks for screenshots of the running app; the `run-app` skill covers that.
- The older `preview/mock.html` and `preview/screens.png` are from the
  OMDb-only version and are not maintained.
