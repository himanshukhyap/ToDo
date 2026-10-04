/**
 * Global search — shared by the web app (src/utils/search.js) and the
 * Android app (mobile/src/utils/search.js). Keep both copies identical.
 *
 * Every word of the query must appear somewhere in the item (title or body),
 * case-insensitive. Results are grouped by type and ranked:
 * title starts with query > title contains query > body-only match, then newest first.
 */

export const SEARCH_GROUPS = [
  { key: "task", label: "Tasks" },
  { key: "note", label: "Notes" },
  { key: "page", label: "Notebook pages" },
  { key: "notebook", label: "Notebooks" },
  { key: "section", label: "Sections" },
  { key: "category", label: "Categories" },
];

const SNIPPET_RADIUS = 48;

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function tokenize(query) {
  return clean(query).toLowerCase().split(" ").filter(Boolean);
}

function millis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

function matchesAll(haystack, tokens) {
  const h = haystack.toLowerCase();
  return tokens.every((t) => h.includes(t));
}

function score(title, query, updated) {
  const t = title.toLowerCase();
  const q = query.toLowerCase();
  const base = t.startsWith(q) ? 3 : t.includes(q) ? 2 : 1;
  return { base, updated };
}

/** A short piece of `body` around the first matching word ("" when nothing matches). */
export function makeSnippet(body, tokens) {
  const text = clean(body);
  if (!text) return "";
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of tokens) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return "";
  const start = Math.max(0, at - SNIPPET_RADIUS);
  const end = Math.min(text.length, at + SNIPPET_RADIUS * 2);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

/** Split text into [{ text, match }] parts so the UI can highlight matching words. */
export function highlightParts(text, tokens) {
  const value = String(text || "");
  if (!tokens.length || !value) return [{ text: value, match: false }];
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  return value
    .split(re)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: tokens.includes(part.toLowerCase()) }));
}

/**
 * @param {string} query
 * @param {{tasks, notes, notebooks, sections, pages, categories}} data
 * @returns {{ key, label, items: object[] }[]} only groups that have results
 */
export function searchAll(query, data, { limitPerGroup = 25 } = {}) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const q = clean(query);

  const categories = data.categories || [];
  const notebooks = data.notebooks || [];
  const sections = data.sections || [];
  const catById = new Map(categories.map((c) => [c.id, c]));
  const nbById = new Map(notebooks.map((n) => [n.id, n]));
  const secById = new Map(sections.map((s) => [s.id, s]));

  const groups = { task: [], note: [], page: [], notebook: [], section: [], category: [] };

  for (const t of data.tasks || []) {
    const title = clean(t.title) || "Untitled task";
    const subText = (t.subtasks || []).map((s) => s.text).join(" · ");
    if (!matchesAll(`${title} ${subText}`, tokens)) continue;
    const cat = catById.get(t.categoryId);
    groups.task.push({
      type: "task",
      id: t.id,
      title,
      snippet: matchesAll(title, tokens) ? "" : makeSnippet(subText, tokens),
      meta: [cat ? cat.name : "No category", t.completed ? "Done" : "Pending"].join(" · "),
      color: cat?.color || null,
      done: !!t.completed,
      target: { kind: "task", id: t.id, title, categoryId: t.categoryId || null, completed: !!t.completed },
      ...score(title, q, millis(t.updatedAt || t.createdAt)),
    });
  }

  for (const n of data.notes || []) {
    const body = clean(n.textContent || n.content);
    if (!matchesAll(body, tokens)) continue;
    const title = body.length > 60 ? `${body.slice(0, 60)}…` : body || "Untitled note";
    groups.note.push({
      type: "note",
      id: n.id,
      title,
      snippet: body.length > 60 ? makeSnippet(body, tokens) : "",
      meta: "",
      color: n.color || null,
      target: { kind: "note", id: n.id },
      ...score(body, q, millis(n.updatedAt || n.createdAt)),
    });
  }

  for (const p of data.pages || []) {
    const title = clean(p.pageName) || "Untitled Page";
    const body = clean(p.textContent);
    if (!matchesAll(`${title} ${body}`, tokens)) continue;
    const nb = nbById.get(p.notebookId);
    const sec = secById.get(p.sectionId);
    groups.page.push({
      type: "page",
      id: p.id,
      title,
      snippet: makeSnippet(body, tokens),
      meta: [nb?.notebookName, sec?.sectionName].filter(Boolean).join(" › "),
      color: sec?.color || nb?.color || null,
      target: { kind: "page", id: p.id, notebookId: p.notebookId, sectionId: p.sectionId },
      ...score(title, q, millis(p.updatedAt || p.createdAt)),
    });
  }

  for (const nb of notebooks) {
    const title = clean(nb.notebookName) || "Notebook";
    if (!matchesAll(title, tokens)) continue;
    groups.notebook.push({
      type: "notebook",
      id: nb.id,
      title,
      snippet: "",
      meta: "",
      color: nb.color || null,
      target: { kind: "notebook", id: nb.id },
      ...score(title, q, millis(nb.createdAt)),
    });
  }

  for (const s of sections) {
    const title = clean(s.sectionName) || "Section";
    if (!matchesAll(title, tokens)) continue;
    const nb = nbById.get(s.notebookId);
    if (!nb) continue; // orphaned section (its notebook was deleted)
    groups.section.push({
      type: "section",
      id: s.id,
      title,
      snippet: "",
      meta: nb.notebookName || "",
      color: s.color || null,
      target: { kind: "section", id: s.id, notebookId: s.notebookId },
      ...score(title, q, millis(s.createdAt)),
    });
  }

  for (const c of categories) {
    const title = clean(c.name) || "Category";
    if (!matchesAll(title, tokens)) continue;
    groups.category.push({
      type: "category",
      id: c.id,
      title,
      snippet: "",
      meta: "Task category",
      color: c.color || null,
      target: { kind: "category", id: c.id },
      ...score(title, q, millis(c.createdAt)),
    });
  }

  const byRank = (a, b) => b.base - a.base || b.updated - a.updated;
  return SEARCH_GROUPS
    .map((g) => {
      const all = groups[g.key].sort(byRank);
      return { ...g, total: all.length, items: all.slice(0, limitPerGroup) };
    })
    .filter((g) => g.items.length > 0);
}
