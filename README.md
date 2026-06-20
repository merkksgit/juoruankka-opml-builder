# Juoruankka OPML-työkalu

A tiny, dependency-free static site where [Juoruankka](https://juoruankka.com)
users pick RSS feeds with checkboxes and download a ready-made **OPML 2.0**
file. Feeds are grouped into OPML folders by category.

No build step, no backend — just HTML, CSS and vanilla JS. Colors and fonts
match juoruankka.com.

## Files

```
opml-builder/
├── index.html      # Page structure
├── styles.css      # Juoruankka dark theme
├── app.js          # Renders the catalog + builds the OPML (logic only)
├── feeds.json      # The feed catalog — edit this to add/remove feeds
├── fonts/          # BigBlueTerm logo font
└── images/         # Icon + favicons
```

## Local preview

```bash
cd opml-builder
python3 -m http.server 8090
# open http://localhost:8090
```

## Deploy to GitHub Pages

The site is fully self-contained, so any of these works:

1. **Project subfolder** — push the repo and in _Settings → Pages_ select the
   branch with `/opml-builder` as the source folder (or move these files to a
   `docs/` folder).
2. **Dedicated repo** — copy the contents of `opml-builder/` into the root of a
   GitHub Pages repo (e.g. `username.github.io`).

All asset paths are relative, so it works from any base URL.

## Updating the feed list

Edit **`feeds.json`** — no JS changes needed. The app fetches it on load, so
adding a feed is just adding a line and committing.

Structure:

```json
{
  "groups": [
    {
      "id": "paauutiset",
      "name": "Pääuutiset",
      "feeds": [
        {
          "name": "YLE | Pääuutiset",
          "url": "https://yle.fi/rss/uutiset/paauutiset"
        }
      ]
    }
  ]
}
```

- **Add a feed:** add a `{ "name": ..., "url": ... }` object to the right group.
- **Add a category:** add a new group object. `id` is written as the OPML folder
  title and **must be a valid Juoruankka topic id** (e.g. `paauutiset`,
  `urheilu`, `teknologia`, `youtube`, `github`). Juoruankka categorises imported
  feeds by the folder title, so a non-topic id (or a display name like
  `Pääuutiset`) imports the feeds but shows no topic and hides them from the
  settings list. `name` is only the heading shown on this page.
- Group order in the file = order on the page = order of folders in the OPML.
- Use plain `&`, `<`, `>` in names/URLs — they're XML-escaped automatically.

> The app loads `feeds.json` with `fetch()`, so previewing locally needs a
> server (`python3 -m http.server`), not opening `index.html` as a file.

## License

Part of the Juoruankka project.
