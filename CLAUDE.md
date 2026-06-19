# CLAUDE.md — opml-builder

Guidance for Claude Code when working in this directory.

## What this is

A standalone, dependency-free static site where Juoruankka users tick checkboxes
next to RSS feeds and download a ready-made **OPML 2.0** file. It is separate from
the main Juoruankka app (the parent repo) and is meant to be hosted on **GitHub
Pages**. No backend, no build step, no frameworks — plain HTML/CSS/vanilla JS.

The visual theme (colors, BigBlueTerm logo font, dark header) mirrors
juoruankka.com so it feels like part of the same site.

## Files

```
opml-builder/
├── index.html      # Page structure (header, intro, toolbar, feed groups, download bar)
├── styles.css      # Juoruankka dark theme (CSS variables mirror the main site)
├── app.js          # Logic only: loads feeds.json, renders, builds + downloads OPML
├── feeds.json      # THE feed catalog — the only file you edit to change feeds
├── fonts/          # BigBlueTerm437NerdFontMono-Regular.ttf (logo font)
├── images/         # juoruankka-icon-48.png (header) + favicons
└── README.md       # User-facing setup/deploy/editing guide
```

## How it works

- On load, `app.js` `fetch()`es `feeds.json` and renders one collapsible-style
  group per category, each feed a clickable row with a checkbox.
- "Valitse kaikki" / "Tyhjennä" toggle everything; each group has a "Valitse
  ryhmä" button that toggles just that group.
- "Lataa OPML-tiedosto" builds an OPML 2.0 document in memory and downloads it as
  `juoruankka-feeds.opml`. Selected feeds are grouped into OPML `<outline>`
  folders by category, in catalog order.
- Because it uses `fetch()`, the page must be served over http(s) — opening
  `index.html` as a `file://` URL fails and shows a Finnish error message.

## feeds.json — the data model

This is the source of truth for the catalog. **To add/remove feeds, edit this
file only — never hardcode feeds in `app.js`.**

```json
{
  "groups": [
    {
      "id": "paauutiset",
      "name": "Pääuutiset",
      "feeds": [
        { "name": "YLE | Pääuutiset", "url": "https://yle.fi/rss/uutiset/paauutiset" }
      ]
    }
  ]
}
```

- `id` → written as the OPML folder `text`/`title`; `name` → the page heading only.
- **`id` MUST be a valid Juoruankka topic id** (one of `TOPIC_ORDER` in the main
  app's `frontend/app.js`: `paauutiset`, `tuoreimmat`, `luetuimmat`, `kotimaa`,
  `politiikka`, `ulkomaat`, `talous`, `teknologia`, `urheilu`, `viihde`, `tiede`,
  `paakirjoitukset`, `kolumnit`, `youtube`, `podcasts`, `blogs`, `github`).
  Juoruankka's importer reads the OPML folder title as the feed's category and
  only shows a topic / lists the feed in settings when it matches a known id.
  Using a display name (e.g. `Pääuutiset`) makes feeds import but with no topic
  and the settings list silently drops them. This mirrors Juoruankka's own
  export, which also writes ids as folder titles.
- Group order in the file = order on the page = order of folders in the OPML.
- Put plain `&`, `<`, `>` in names/URLs; `app.js` (`escapeXml`) escapes them on
  output. Don't pre-escape in the JSON.

## Conventions

- UI text is in **Finnish** (the audience is Finnish Juoruankka users).
- Keep it dependency-free and build-free — no npm, no bundler, no frameworks.
- All asset paths are **relative** so the site works from any GitHub Pages base
  URL. Keep them relative.
- Theme colors live as CSS variables in `:root` (`styles.css`) and match
  `COLOR-PALETTE.md` in the parent repo. Reuse the variables rather than
  hardcoding hex values.
- Build DOM with `textContent` / `createElement`, not `innerHTML`, for
  user/catalog-derived strings (the catalog is trusted, but this keeps it safe).

## Verifying changes

No test suite. After editing `feeds.json`:

```bash
# JSON valid + no duplicate URLs
node -e 'const d=require("./feeds.json");const u=new Set();let n=0;for(const g of d.groups)for(const f of g.feeds){n++;if(u.has(f.url))throw new Error("dup "+f.url);u.add(f.url);}console.log("ok",d.groups.length,"groups",n,"feeds")'

# Preview locally (needs a server — fetch() won't work over file://)
python3 -m http.server 8090   # http://localhost:8090
```

To sanity-check generated OPML, select feeds in the browser, download, and
confirm the file opens in an RSS reader / parses as XML.

## Commits

- Do **not** add a `Co-Authored-By` line (or any other AI/assistant trailer) to
  commit messages.

## Relationship to the parent repo

This lives inside the Juoruankka repo but is independent. The feed catalog
overlaps with the main app's `STARTER_PACK_FEEDS` (`frontend/app.js`) but is
maintained separately here in `feeds.json` — they are not auto-synced.
