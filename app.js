// Juoruankka OPML builder — pick feeds, download an OPML file.
// The feed catalog lives in feeds.json so it can be edited without touching
// this logic. Structure: { groups: [{ id, name, feeds: [{ name, url }] }] }.

const groupsEl = document.getElementById("feed-groups");
const countLabel = document.getElementById("count-label");
const downloadBtn = document.getElementById("download");
const selectAllBtn = document.getElementById("select-all");
const clearAllBtn = document.getElementById("clear-all");

// Loaded from feeds.json: array of { id, name, feeds: [{ name, url }] }.
let GROUPS = [];

// --- Load -------------------------------------------------------------------

async function loadFeeds() {
  try {
    const res = await fetch("feeds.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    GROUPS = Array.isArray(data.groups) ? data.groups : [];
    render();
    updateCount();
  } catch (err) {
    groupsEl.innerHTML = "";
    const msg = document.createElement("p");
    msg.className = "load-error";
    msg.textContent =
      "Syötelistan lataaminen epäonnistui. Avaa sivu palvelimen kautta (esim. GitHub Pages), ei suoraan tiedostona.";
    groupsEl.appendChild(msg);
    selectAllBtn.disabled = true;
    clearAllBtn.disabled = true;
    console.error("Failed to load feeds.json:", err);
  }
}

// --- Render -----------------------------------------------------------------

function render() {
  groupsEl.innerHTML = "";

  for (const group of GROUPS) {
    if (!group.feeds || group.feeds.length === 0) continue;

    const section = document.createElement("section");
    section.className = "feed-group";

    const header = document.createElement("div");
    header.className = "feed-group-header";

    const title = document.createElement("span");
    title.className = "feed-group-title";
    title.textContent = group.name || group.id;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "feed-group-toggle";
    toggle.textContent = "Valitse ryhmä";
    toggle.addEventListener("click", () => toggleGroup(section));

    header.append(title, toggle);

    const list = document.createElement("ul");
    list.className = "feed-list";

    for (const feed of group.feeds) {
      const li = document.createElement("li");
      li.className = "feed-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = feed.url;
      checkbox.dataset.name = feed.name;
      checkbox.dataset.category = group.id;
      checkbox.dataset.categoryName = group.name || group.id;
      checkbox.addEventListener("change", updateCount);

      const text = document.createElement("span");
      text.className = "feed-item-text";

      const name = document.createElement("span");
      name.className = "feed-name";
      name.textContent = feed.name;

      const url = document.createElement("span");
      url.className = "feed-url";
      url.textContent = feed.url;

      text.append(name, url);
      li.append(checkbox, text);

      // Clicking the row toggles the checkbox (except clicks on the box itself).
      li.addEventListener("click", (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
          updateCount();
        }
      });

      list.appendChild(li);
    }

    section.append(header, list);
    groupsEl.appendChild(section);
  }
}

function toggleGroup(section) {
  const boxes = section.querySelectorAll('input[type="checkbox"]');
  const allChecked = Array.from(boxes).every((b) => b.checked);
  boxes.forEach((b) => (b.checked = !allChecked));
  updateCount();
}

// --- Selection state --------------------------------------------------------

function checkedBoxes() {
  return Array.from(
    document.querySelectorAll('.feed-item input[type="checkbox"]:checked')
  );
}

function updateCount() {
  const n = checkedBoxes().length;
  countLabel.textContent =
    n === 1 ? "1 syöte valittu" : `${n} syötettä valittu`;
  downloadBtn.disabled = n === 0;
}

selectAllBtn.addEventListener("click", () => {
  document
    .querySelectorAll('.feed-item input[type="checkbox"]')
    .forEach((b) => (b.checked = true));
  updateCount();
});

clearAllBtn.addEventListener("click", () => {
  document
    .querySelectorAll('.feed-item input[type="checkbox"]')
    .forEach((b) => (b.checked = false));
  updateCount();
});

// --- OPML generation --------------------------------------------------------

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildOpml(selected) {
  // Group selected feeds by category into OPML folders, preserving the order
  // categories appear in the catalog.
  const byCat = new Map();
  for (const feed of selected) {
    if (!byCat.has(feed.category)) {
      byCat.set(feed.category, { name: feed.categoryName, feeds: [] });
    }
    byCat.get(feed.category).feeds.push(feed);
  }

  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<opml version="2.0">');
  lines.push("  <head>");
  lines.push("    <title>Juoruankka-syötteet</title>");
  lines.push(`    <dateCreated>${new Date().toUTCString()}</dateCreated>`);
  lines.push("  </head>");
  lines.push("  <body>");

  // Order categories by their position in GROUPS.
  const orderedIds = GROUPS.map((g) => g.id).filter((id) => byCat.has(id));
  for (const id of byCat.keys()) {
    if (!orderedIds.includes(id)) orderedIds.push(id);
  }

  for (const id of orderedIds) {
    const entry = byCat.get(id);
    // Use the category id (not the display name) as the folder title: Juoruankka
    // maps an imported feed's category from the OPML folder title, and it must
    // match a Juoruankka topic id (e.g. "paauutiset") for topics + the settings
    // feed list to populate. This mirrors Juoruankka's own export format.
    const label = escapeXml(id);
    lines.push(`    <outline text="${label}" title="${label}">`);
    for (const feed of entry.feeds) {
      const t = escapeXml(feed.name);
      const u = escapeXml(feed.url);
      lines.push(
        `      <outline text="${t}" title="${t}" type="rss" xmlUrl="${u}" />`
      );
    }
    lines.push("    </outline>");
  }

  lines.push("  </body>");
  lines.push("</opml>");
  return lines.join("\n");
}

downloadBtn.addEventListener("click", () => {
  const selected = checkedBoxes().map((b) => ({
    name: b.dataset.name,
    url: b.value,
    category: b.dataset.category,
    categoryName: b.dataset.categoryName,
  }));
  if (selected.length === 0) return;

  const opml = buildOpml(selected);
  const blob = new Blob([opml], { type: "text/x-opml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "juoruankka-feeds.opml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

loadFeeds();
