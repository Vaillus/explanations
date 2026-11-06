/* view-concept — the frame script: the page's own script, written at the start of every
   HTML section the page, the published page or the vault note draws (frame.py), after the
   theme tokens. The page cannot read the frame, nor the frame the page: the frame has an
   origin of its own, so they talk by frame messages, each an object whose `viewConcept`
   names it. The frame script is the frame's end of every one; the section's own scripts
   take part only through the channel (below).

   - The theme (page -> frame): the tokens define every theme, keyed by data-theme on
     <html>. The page posts its theme at load and at every change; until then (and where
     no page posts one, as in a vault note) the frame keeps the theme already set, or
     takes the page's default: Catppuccin Latte in light mode, Tokyo Night in dark mode.
   - The height (frame -> page): posted whenever the content's height changes, so the
     frame takes that height.
   - The selection (frame -> page): each time the reader's selection in the section
     changes (a finger's handles, as a mouse's drag), the quoted text and the few
     characters before it (the anchor a passage of a Markdown section gets), with where
     the selection sits in the frame, and the id of the element of the drawing holding the
     whole selection, if any (`element`): the nearest marked element (see the pins), else
     the nearest element whose id is a drawing's element id (e1, e2…); an empty quote when
     the selection is gone. The page opens the same box to comment or to ask on it.
   - The anchors (page -> frame), answered by "placed" (frame -> page): the passages the
     page's drafts, sent comments and side threads quote in this section. Each is
     highlighted, and highlighted again when a script of the section redraws its text.
     The frame answers with the side threads whose passage it found, and posts that list
     again when a redraw changes it, so the page shows a chip in the section's heading
     only for the others, as in a Markdown section.
   - The reveal (page -> frame), answered by "revealed" (frame -> page): a passage to
     show. The frame highlights it for a moment and answers with where it sits, so the
     page scrolls to it; the frame takes the height of its content, so the scrolling is
     the page's.
   - The thread click (frame -> page): a click, with nothing selected, on a passage
     highlighted for a side thread gives the thread's id and where the passage sits, so
     the page opens that thread on it. Under touch controls (the device's main pointer
     cannot hover) a tap on an underlined term in that passage shows the term's tip
     instead (the term hover), and a tap on the rest of it opens the thread.
   - The changes (page -> frame): the passages an agent added since the last batch or
     « mark read ». The page finds them by comparing the section's visible text now and
     then; the frame highlights a passage only while the pointer is over a block holding
     it (the block of its start or of its end, so a passage over two blocks shows whole
     when either is hovered), or, under touch controls, from a tap on that block until a
     tap elsewhere; the page's bar marks the whole frame.
   - The terms (page -> frame): the lexicon terms, the one this section is the home of,
     and the words the vocabulary audit flags in it. The frame underlines each
     occurrence by painting a style over the word, as it paints the anchors: no element
     of the section is changed, so its scripts find their text as they wrote it.
   - The term hover (frame -> page): the underlined word the pointer rests on and where
     it sits, or nothing once the pointer leaves it, so the page shows that term's tip.
     Under touch controls, the word tapped, or nothing on a tap elsewhere or a scroll;
     a term tapped again is posted again, since the page may have hidden its tip.
   - The pins (page -> frame): one entry per element of the drawing bearing open pin
     records, {element (an id in the section), pins (their ids), tone (a kind of pin, or
     "waiting")}. The frame sets `data-vc-pin` (the pin ids, space-separated) and
     `data-vc-tone` (the tone) on each element, which frame.css draws as the mark (the
     kind's colour, or grey), and sets them again when a script of the section
     redraws its text. Unlike the paint of passages, this changes attributes of the
     section's elements; its scripts never read them.
   - The pin click (frame -> page): a click, with nothing selected and off a side
     thread's passage: the innermost marked element it falls in (`element`, its id), its
     pin ids and where it sits, so the page opens their pin window on that element (a
     marked element inside another opens only its own pins); no pin when it falls in
     none, even in a frame with no mark, so the page closes the window.
   - The escape (frame -> page): Escape pressed in the frame, which holds the focus after
     a click in it, so the page closes its pin window as on its own Escape.
   - The element reveal (page -> frame), answered by "revealed" (frame -> page): the
     element of a pin to show. The frame opens its holders (and selects it when it is a
     tab of the kit), then answers with where it sits, as for a passage.
   - The tap (frame -> page) and the tap elsewhere (page -> frame), under touch controls
     only: the frame says it was tapped, so the page clears the paint of a changed passage
     in its own text and has every other frame clear its paint; a tap on the page's own
     text has every frame clear it.
   - The channel (frame -> page), answered by "channel-answer" (page -> frame): a request
     of the section's own script, {id (a prefix of the frame's load, and its count), op
     ("load", "save" or "ask"), saved (save), key, instruction and schema (ask)}. The page
     runs it against its server (app.js) and answers {id, ok, data} or {id, ok: false,
     error}. The published page answers from the published files instead (reader.js),
     with no server behind it, and adds `reason: "not-received"` to the answer to a
     request never received before publishing.

   The channel is the section's script's way to ask an agent for data and draw the answer
   itself, without its section being redrawn: the frame script gives every section a
   global `viewConcept` object, whose three calls each return a Promise.
   - `viewConcept.load()` -> {saved, received}: the section's entry of the parameters file,
     what its script saved last and the answers it received (each {} when none).
   - `viewConcept.save(saved)`: replace what the section's script saved (an object), kept
     by the server across every redraw of the section.
   - `viewConcept.ask(key, instruction, schema)` -> the answer: a small agent answers the
     instruction with data held to the JSON schema, kept as `received[key]`. It takes the
     seconds of a model call; it rejects with an Error when the agent fails, times out or
     breaks the schema, or when no page answers (a frame opened alone, a vault note). On
     a published page, a request never received before publishing rejects with an Error
     named "NotReceivedError": no failure, only nothing to draw.

   The frame script also runs the component kit's tabs (`.tabs`, see frame.css): a click
   on a `.tab` selects it and shows its panel, the n-th `.tab-panel` child of its `.tabs`,
   hiding the others; at load each `.tabs` is made consistent (no tab selected: the
   first). The section writes no script for them. A passage can sit in a holder that hides
   it, a closed <details> or a hidden `.tab-panel`: it is found but has no box on screen.
   So before measuring a passage to reveal, the frame opens each holder around it (sets
   `open` on the <details>, selects the panel's tab); and the first time it finds a
   passage of a comment, a side thread or a change, it opens its holders once, and
   remembers the passage, so a tab the reader closes afterwards is not reopened by a later
   message. A term opens nothing.

   Every highlight and underline is painted again when a script of the section redraws
   its text, from the anchors, changes and terms the frame already holds. Text a script
   paints into a <canvas> is pixels, not text: it cannot be selected, highlighted nor
   underlined. */
(function () {
  var root = document.documentElement;
  if (!root.hasAttribute("data-theme")) {
    var dark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", dark ? "tokyo-night" : "catppuccin-latte");
  }
  var framed = parent !== window;
  // Touch controls: the device's main pointer cannot hover (a finger), as the page reads it.
  var touch = window.matchMedia ? matchMedia("(hover: none)").matches : false;
  function post(message) { if (framed) parent.postMessage(message, "*"); }

  /* ---- the channel ---- */
  var LOAD_WAIT = 15000, ASK_WAIT = 200000; // ms before a request with no answer rejects
  // A call's id: this load's own prefix and its count. The page may reload the frame
  // while an ask runs; the answer to a call of the previous load then finds no call here
  // and is dropped, instead of resolving the call of this load that has its count.
  var calls = {}, callCount = 0, loadId = Math.random().toString(36).slice(2, 10);
  function request(op, fields, wait) {
    return new Promise(function (resolve, reject) {
      if (!framed) { reject(new Error("viewConcept: no page to ask")); return; }
      var id = loadId + ":" + ++callCount;
      var timer = setTimeout(function () {
        delete calls[id];
        reject(new Error("viewConcept: no answer from the page"));
      }, wait);
      calls[id] = { resolve: resolve, reject: reject, timer: timer };
      var message = { viewConcept: "channel", id: id, op: op };
      for (var k in fields) message[k] = fields[k];
      post(message);
    });
  }
  function answered(d) {
    var c = calls[d.id];
    if (!c) return;
    delete calls[d.id];
    clearTimeout(c.timer);
    if (d.ok) { c.resolve(d.data); return; }
    var error = new Error(String(d.error || "viewConcept: the request failed"));
    if (d.reason === "not-received") error.name = "NotReceivedError";
    c.reject(error);
  }
  window.viewConcept = {
    load: function () { return request("load", {}, LOAD_WAIT); },
    save: function (saved) {
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return Promise.reject(new Error("viewConcept.save takes an object"));
      return request("save", { saved: saved }, LOAD_WAIT);
    },
    ask: function (key, instruction, schema) {
      if (!key || !instruction || !schema || typeof schema !== "object") {
        return Promise.reject(new Error("viewConcept.ask takes a key, an instruction and a JSON schema"));
      }
      return request("ask", { key: String(key), instruction: String(instruction), schema: schema }, ASK_WAIT);
    },
  };

  /* ---- the height ---- */
  var last = -1;
  function postHeight() {
    var height = Math.ceil(root.getBoundingClientRect().height);
    if (height === last) return;
    last = height;
    post({ viewConcept: "height", height: height });
  }
  if (window.ResizeObserver) new ResizeObserver(postHeight).observe(root);
  addEventListener("load", postHeight);

  /* ---- quotes <-> ranges, as the page finds them in a Markdown section ---- */
  var HIDDEN = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1 };
  // The elements whose text is not run on with the text around them (as app.js): a space
  // stands between two of them, so two paragraphs do not make one word.
  var BLOCKS = "address, article, aside, blockquote, dd, details, div, dl, dt, figcaption, figure, footer, " +
    "form, h1, h2, h3, h4, h5, h6, header, hr, li, main, nav, ol, p, pre, section, summary, table, td, th, tr, ul, " +
    "button, caption, label, option, text, tspan, br";
  function collapse(s) { return s.replace(/\s+/g, " ").trim(); }

  // The section's text, whitespace collapsed and its scripts and styles left out, with
  // the DOM position of every character (the space between two blocks takes the
  // position of the character after it).
  function textIndex() {
    var text = "", pos = [], space = true, block = null;
    if (!document.body) return { text: text, pos: pos };
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        for (var p = n.parentElement; p; p = p.parentElement) if (HIDDEN[p.tagName]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) {
      var n = walker.currentNode, b = n.parentElement.closest(BLOCKS);
      if (b !== block && !space && n.data.length) { text += " "; pos.push([n, 0]); space = true; }
      block = b;
      for (var i = 0; i < n.data.length; i++) {
        var ws = /\s/.test(n.data[i]);
        if (ws && space) continue;
        text += ws ? " " : n.data[i];
        pos.push([n, i]);
        space = ws;
      }
    }
    return { text: text, pos: pos };
  }

  function findQuote(index, quote, prefix) {
    var q = collapse(quote || "");
    if (!q) return null;
    // The prefix is collapsed, so a space between it and the quote is trimmed off it.
    var p = collapse(prefix || ""), at = -1;
    if (p) {
      at = index.text.indexOf(p + q);
      if (at >= 0) at += p.length;
      else if ((at = index.text.indexOf(p + " " + q)) >= 0) at += p.length + 1;
    }
    if (at < 0) at = index.text.indexOf(q);
    if (at < 0) return null;
    var s = index.pos[at], e = index.pos[at + q.length - 1];
    var r = document.createRange();
    r.setStart(s[0], s[1]);
    r.setEnd(e[0], e[1] + 1);
    return r;
  }

  /* ---- the kit's tabs and the holders of a passage ---- */
  function tabsOf(tabs) {
    var row = null, panels = [];
    for (var i = 0; i < tabs.children.length; i++) {
      var c = tabs.children[i];
      if (!row && c.classList.contains("tab-row")) row = c;
      else if (c.classList.contains("tab-panel")) panels.push(c);
    }
    var buttons = row ? Array.prototype.filter.call(row.children, function (c) { return c.classList.contains("tab"); }) : [];
    return { buttons: buttons, panels: panels };
  }
  // Select the k-th tab of a `.tabs` and show its panel; the others are hidden.
  function selectTab(tabs, k) {
    var t = tabsOf(tabs);
    t.buttons.forEach(function (b, i) { b.setAttribute("aria-selected", i === k ? "true" : "false"); });
    t.panels.forEach(function (p, i) { if (i === k) p.removeAttribute("hidden"); else p.setAttribute("hidden", ""); });
  }
  function initTabs() {
    Array.prototype.forEach.call(document.querySelectorAll(".tabs"), function (tabs) {
      var t = tabsOf(tabs), k = 0;
      t.buttons.forEach(function (b, i) { if (!k && b.getAttribute("aria-selected") === "true") k = i; });
      selectTab(tabs, k);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initTabs);
  else initTabs();
  addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".tab");
    var row = b && b.parentElement, tabs = row && row.parentElement;
    if (!tabs || !row.classList.contains("tab-row") || !tabs.classList.contains("tabs")) return;
    selectTab(tabs, tabsOf(tabs).buttons.indexOf(b));
  });

  // Open every holder around a node: each closed <details> it is in (not its summary,
  // which shows while closed) and each hidden `.tab-panel` (by selecting its tab).
  function openFrom(node) {
    var child = null;
    for (var p = node && (node.nodeType === 1 ? node : node.parentElement); p; child = p, p = p.parentElement) {
      if (p.tagName === "DETAILS" && !p.open && !(child && child.tagName === "SUMMARY" && child.parentElement === p)) p.open = true;
      else if (p.classList.contains("tab-panel") && p.hasAttribute("hidden") && p.parentElement && p.parentElement.classList.contains("tabs")) {
        var k = tabsOf(p.parentElement).panels.indexOf(p);
        if (k >= 0) selectTab(p.parentElement, k);
      }
    }
  }
  function openHolders(range) {
    openFrom(range.startContainer);
    if (range.endContainer !== range.startContainer) openFrom(range.endContainer);
  }
  // The passages (comment, side thread, change) whose holders were opened once already.
  var opened = {};
  function openOnce(passage, range) {
    var key = collapse(passage.prefix || "") + "\n" + collapse(passage.quote || "");
    if (opened[key]) return;
    opened[key] = true;
    openHolders(range);
  }

  /* ---- the selection ---- */
  var selected = false;
  function selection() {
    var sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    var range = sel.getRangeAt(0);
    var quote = collapse(sel.toString());
    if (!quote) return null;
    var index = textIndex(), k = 0;
    while (k < index.pos.length && range.comparePoint(index.pos[k][0], index.pos[k][1]) < 0) k++;
    var r = range.getBoundingClientRect();
    var common = range.commonAncestorContainer;
    if (common.nodeType !== 1) common = common.parentElement;
    var marked = common && common.closest ? common.closest("[data-vc-pin]") : null;
    return { quote: quote, prefix: collapse(index.text.slice(0, k)).slice(-32),
             rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
             element: marked ? marked.id : drawnElement(common) };
  }
  // The nearest element holding `node` whose id is a drawing's element id (e1, e2…), "".
  var ELEMENT_ID = /^e[0-9]+$/;
  function drawnElement(node) {
    for (var n = node; n && n.nodeType === 1; n = n.parentElement) if (ELEMENT_ID.test(n.id || "")) return n.id;
    return "";
  }
  // Posted on every change of the selection: a finger releases no mouse button.
  var lastQuote = null;
  function postSelection() {
    var s = selection();
    if (!s && !selected) return null;
    var key = s ? s.prefix + "\n" + s.quote + "\n" + s.rect.top + "," + s.rect.left + "\n" + s.element : "";
    if (key === lastQuote) return s;
    lastQuote = key;
    selected = !!s;
    post(s ? { viewConcept: "selection", quote: s.quote, prefix: s.prefix, rect: s.rect, element: s.element }
           : { viewConcept: "selection", quote: "" });
    return s;
  }
  var selectionTimer = null;
  document.addEventListener("selectionchange", function () {
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(postSelection, 0);
  });
  addEventListener("mouseup", function (e) {
    setTimeout(function () {
      var s = postSelection();
      if (!s && !touch) clickAt(e.target, e.clientX, e.clientY);
    }, 0);
  });

  /* ---- the anchors, the changes, the terms and the reveal ---- */
  var anchors = []; // { kind: draft | sent | thread, quote, prefix, thread? }
  var changes = []; // { quote, prefix }
  var terms = [];   // { term, kind: term | def | audit, key }
  var focus = null; // { quote, prefix } of the passage being revealed
  var pins = [];    // { element, pins: [pin ids], tone }: the marked elements of the drawing
  var threadRanges = [], termRanges = []; // [anchor, range], [term, range] as last painted
  var changeRanges = []; // [blocks holding the change's start and end, range] as last found
  var pointer = null;    // { x, y } of the pointer over the frame, null once it left
  var shownChanges = null; // the indexes in changeRanges painted now, joined
  var placed = null; // the side threads' ids last posted as "placed", joined
  var KINDS = ["draft", "sent", "thread", "focus", "updated", "term", "def", "audit"];
  var marks = document.createElement("style");
  marks.textContent =
    "::highlight(ev-draft) { background-color: var(--flagbg); }\n" +
    "::highlight(ev-sent) { background-color: var(--accentbg); }\n" +
    "::highlight(ev-thread) { background-color: var(--altbg); }\n" +
    "::highlight(ev-focus) { background-color: var(--accent); color: var(--on-accent); }\n" +
    "::highlight(ev-updated) { background-color: var(--okbg); text-decoration: underline 2px var(--ok); text-underline-offset: 3px; }\n" +
    "::highlight(ev-term) { text-decoration: underline dotted var(--line-strong); text-underline-offset: 3px; }\n" +
    "::highlight(ev-def) { text-decoration: underline solid var(--accent); text-underline-offset: 3px; }\n" +
    "::highlight(ev-audit) { text-decoration: underline wavy var(--warn); text-underline-offset: 3px; }\n";
  (document.head || root).appendChild(marks);

  // Letter-aware word boundaries, as the page uses: "état" does not match in "étatique".
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function termRe(term) {
    try { return new RegExp("(?<![\\p{L}\\p{N}])" + escapeRe(term) + "(?![\\p{L}\\p{N}])", "giu"); }
    catch (err) { return null; }
  }
  function rangeAt(index, start, end) {
    var s = index.pos[start], e = index.pos[end - 1];
    var r = document.createRange();
    r.setStart(s[0], s[1]);
    r.setEnd(e[0], e[1] + 1);
    return r;
  }

  // The underlines, in the page's order: the audit's first, then the home section's
  // first occurrence of its term, then every other occurrence; a word already
  // underlined is not underlined again.
  function underline(index) {
    var taken = [], out = [];
    var free = function (a, b) { return taken.every(function (t) { return b <= t[0] || a >= t[1]; }); };
    ["audit", "def", "term"].forEach(function (kind) {
      terms.forEach(function (t) {
        if (t.kind !== kind || !String(t.term || "").trim()) return;
        var re = termRe(String(t.term)), m;
        if (!re) return;
        while ((m = re.exec(index.text))) {
          var a = m.index, b = a + m[0].length;
          if (!m[0].length) { re.lastIndex++; continue; }
          if (!free(a, b)) continue;
          taken.push([a, b]);
          out.push([t, rangeAt(index, a, b)]);
          if (kind === "def") break;
        }
      });
    });
    return out;
  }

  // The answer to the anchors: posted after each anchors message (answer set), and
  // after a redraw only when the list of side threads found changed.
  function postPlaced(answer) {
    var ids = threadRanges.map(function (tr) { return String(tr[0].thread); });
    var key = ids.join("\n");
    if (!answer && key === placed) return;
    placed = key;
    post({ viewConcept: "placed", threads: ids });
  }

  function highlight(answer) {
    if (!window.CSS || !CSS.highlights) { if (answer) post({ viewConcept: "placed", threads: [] }); return; }
    var index = textIndex(), ranges = {};
    KINDS.forEach(function (k) { ranges[k] = []; });
    threadRanges = [];
    anchors.forEach(function (a) {
      var r = ranges[a.kind] && findQuote(index, a.quote, a.prefix);
      if (!r) return;
      openOnce(a, r);
      ranges[a.kind].push(r);
      if (a.kind === "thread" && a.thread) threadRanges.push([a, r]);
    });
    changeRanges = [];
    changes.forEach(function (c) {
      var r = findQuote(index, c.quote, c.prefix);
      if (!r) return;
      openOnce(c, r);
      changeRanges.push([[blockOf(r.startContainer), blockOf(r.endContainer)], r]);
    });
    var under = pointer && document.elementFromPoint(pointer.x, pointer.y);
    shownChanges = hoveredChanges(under).join(",");
    ranges.updated = hoveredChanges(under).map(function (k) { return changeRanges[k][1]; });
    var f = focus && findQuote(index, focus.quote, focus.prefix);
    if (f) ranges.focus.push(f);
    termRanges = underline(index);
    termRanges.forEach(function (tr) { ranges[tr[0].kind].push(tr[1]); });
    KINDS.forEach(function (k) {
      CSS.highlights.set("ev-" + k, new (Function.prototype.bind.apply(Highlight, [null].concat(ranges[k])))());
    });
    postPlaced(answer);
  }

  // The block a change passage's start or end sits in.
  function blockOf(node) {
    var e = node.nodeType === 1 ? node : node.parentElement;
    return e && e.closest(BLOCKS);
  }
  // The indexes of the changes with a block holding `target`.
  function hoveredChanges(target) {
    var out = [];
    if (target) changeRanges.forEach(function (cr, k) {
      if (cr[0].some(function (b) { return b && b.contains(target); })) out.push(k);
    });
    return out;
  }
  // Paint the changes of the blocks under the pointer, when they are not painted already.
  function paintChanges(target) {
    if (!window.CSS || !CSS.highlights) return;
    var shown = hoveredChanges(target);
    if (shown.join(",") === shownChanges) return;
    shownChanges = shown.join(",");
    CSS.highlights.set("ev-updated", new (Function.prototype.bind.apply(Highlight,
      [null].concat(shown.map(function (k) { return changeRanges[k][1]; }))))());
  }

  // A script that redraws the section's text drops the ranges with the old nodes: find
  // the passages and the terms again once the change is done.
  var pending = false;
  function rehighlight() {
    if (pending || (!anchors.length && !changes.length && !terms.length && !focus && !pins.length)) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; highlight(); markPins(); });
  }
  new MutationObserver(rehighlight).observe(root, { childList: true, characterData: true, subtree: true });

  function reveal(quote, prefix) {
    var r = findQuote(textIndex(), quote, prefix);
    if (!r) { post({ viewConcept: "revealed", found: false }); return; }
    openHolders(r);
    var b = r.getBoundingClientRect();
    post({ viewConcept: "revealed", found: true, top: b.top + scrollY, bottom: b.bottom + scrollY });
    focus = { quote: quote, prefix: prefix };
    highlight();
    setTimeout(function () { focus = null; highlight(); }, 1500);
  }

  /* ---- the pins ---- */
  function markPins() {
    var marked = document.querySelectorAll("[data-vc-pin]");
    for (var i = 0; i < marked.length; i++) { marked[i].removeAttribute("data-vc-pin"); marked[i].removeAttribute("data-vc-tone"); }
    pins.forEach(function (h) {
      var n = h.element && document.getElementById(h.element);
      if (!n || !Array.isArray(h.pins) || !h.pins.length) return;
      n.setAttribute("data-vc-pin", h.pins.join(" "));
      n.setAttribute("data-vc-tone", h.tone || "waiting");
    });
  }
  function revealElement(id) {
    var n = id && document.getElementById(id);
    if (!n) { post({ viewConcept: "revealed", found: false }); return; }
    openFrom(n);
    // A tab of the kit is shown by selecting it.
    var row = n.classList.contains("tab") && n.parentElement, tabs = row && row.parentElement;
    if (tabs && row.classList.contains("tab-row") && tabs.classList.contains("tabs")) {
      var k = tabsOf(tabs).buttons.indexOf(n);
      if (k >= 0) selectTab(tabs, k);
    }
    var b = n.getBoundingClientRect();
    post({ viewConcept: "revealed", found: true, top: b.top + scrollY, bottom: b.bottom + scrollY,
           left: b.left, right: b.right });
  }

  function rectOf(r) { return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }
  function hit(list, x, y) {
    for (var i = 0; i < list.length; i++) {
      var rects = list[i][1].getClientRects();
      for (var j = 0; j < rects.length; j++) {
        var b = rects[j];
        if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return [list[i][0], b];
      }
    }
    return null;
  }

  /* ---- the thread click and the pin click ----
     A click outside every marked element posts an empty pin click even when the frame
     bears no mark: the page closes a pin window opened from its index line. */
  function clickAt(target, x, y) {
    var h = hit(threadRanges, x, y);
    if (h) { post({ viewConcept: "thread-click", thread: h[0].thread, rect: rectOf(h[1]) }); return; }
    var n = target && target.closest ? target.closest("[data-vc-pin]") : null;
    post(n ? { viewConcept: "pin-click", pins: n.getAttribute("data-vc-pin").split(" "),
               element: n.id, rect: rectOf(n.getBoundingClientRect()) }
           : { viewConcept: "pin-click", pins: [] });
  }

  /* ---- Escape ----
     A click in the frame gives it the focus, so the page never sees the key: the frame
     passes Escape on, and the page closes its pin window as on its own Escape. */
  addEventListener("keydown", function (e) {
    if (e.key === "Escape") post({ viewConcept: "escape" });
  });

  /* ---- the term hover ---- */
  var hovered = null;
  // `always`: post even when the term is unchanged (a tap, since the page may have
  // hidden the tip since the last one).
  function hover(t, rect, always) {
    if (t === hovered && !always) return;
    hovered = t;
    post(t ? { viewConcept: "term-hover", key: t.key, rect: rectOf(rect) } : { viewConcept: "term-hover", key: null });
  }
  addEventListener("mousemove", function (e) {
    if (touch) return;
    pointer = { x: e.clientX, y: e.clientY };
    paintChanges(e.target);
    var h = hit(termRanges, e.clientX, e.clientY);
    hover(h && h[0], h && h[1]);
    // The passage of a thread is clickable: say so with the cursor.
    root.style.cursor = hit(threadRanges, e.clientX, e.clientY) ? "pointer" : "";
  });
  document.addEventListener("mouseleave", function () { if (!touch) { hover(null); pointer = null; paintChanges(null); } });
  // Under touch controls a tap does what a resting pointer does: on a term, its tip; on a
  // changed block, its new words, until a tap elsewhere; on a side thread's passage (off
  // its terms), the thread.
  addEventListener("click", function (e) {
    if (!touch) return;
    var sel = getSelection();
    if (sel && !sel.isCollapsed) return;
    post({ viewConcept: "tap" });
    pointer = { x: e.clientX, y: e.clientY };
    paintChanges(e.target);
    var h = hit(termRanges, e.clientX, e.clientY);
    hover(h && h[0], h && h[1], true);
    if (!h) clickAt(e.target, e.clientX, e.clientY);
  });
  addEventListener("scroll", function () { hover(null); });

  addEventListener("message", function (e) {
    var d = e.data;
    if (e.source !== parent || !d) return;
    if (d.viewConcept === "theme" && d.theme) root.setAttribute("data-theme", d.theme);
    else if (d.viewConcept === "anchors" && Array.isArray(d.anchors)) { anchors = d.anchors; highlight(true); }
    else if (d.viewConcept === "changes" && Array.isArray(d.changes)) { changes = d.changes; highlight(); }
    else if (d.viewConcept === "terms" && Array.isArray(d.terms)) { terms = d.terms; hover(null); highlight(); }
    else if (d.viewConcept === "reveal") reveal(d.quote, d.prefix);
    else if (d.viewConcept === "pins" && Array.isArray(d.pins)) { pins = d.pins; markPins(); }
    else if (d.viewConcept === "reveal-element") revealElement(d.element);
    else if (d.viewConcept === "tap-elsewhere" && touch) { pointer = null; paintChanges(null); }
    else if (d.viewConcept === "channel-answer") answered(d);
  });
})();

/* view-concept — the prerequisite tree, a component of the frame script: frame.py
   frame_js() appends this file to frame.js, so every section frame has it. A section's
   script draws one tree per element with one call, after the element is in the document:

     viewConcept.tree("e3", {
       concept: "keyword boosting for Whisper",   // the element's concept: the tree's root
       gloss: "a method that takes a lexicon…",   // what the drawing says the concept is
       reader: "a reader who has finetuned Whisper…", // whom the texts are written for
       preset: { "autoregressive decoding": "no" },   // answers set where none is given yet
     });

   What the reader sees:
   - Closed, the tree takes no room: the element carries a « ▸ prerequisites » tab on its
     bottom edge. The tab is not inside the element (it sits in a layer of its own over
     the document), so a click on it opens the tree, and never the element's pin window.
   - A click on the tab opens the tree, one at a time: a backdrop (--backdrop) dims the
     whole drawing, the element is raised above it where it stands, and the tree panel
     opens under it. While the panel is open, the document gets a minimum height that
     reaches the panel's bottom, so the frame grows to show it. A click on the backdrop,
     Escape, or the tab closes it.
   - The rows hang from the element's bottom edge and descend: each concept is answered
     yes (its text, and its own prerequisites in the row below), quickly (its one-sentence
     text) or no (the branch stops). A branch's line shows the answer on the concept at
     its end: thick for yes, thin for quickly, dashed for no, dotted for none yet. A
     concept met on two branches has one answer, marked « ·2 ». The text of the concept
     clicked shows in a lane beside the rows, linked to it by a dotted line.
   - The focus rule: clicking another concept of a row hides the rows below the one left,
     and keeps their answers; clicking the first again shows its rows as they were.
   - A row too wide for the panel keeps a strip at each end, where the concepts past that
     edge collapse to circles, stacked. The row slides only while the mouse rests in a
     strip, at about one concept every 300 ms, or under a horizontal scroll (a trackpad,
     or the wheel with Shift), or a swipe under touch controls; over the concepts it holds
     still, so a concept's buttons stay under the mouse. A click on a circle brings its
     concept into view.

   The rows come through the channel, one row ahead: each request (`viewConcept.ask`,
   keyed by the concept whose prerequisites it lists) asks for a row and, for each of its
   concepts, the concept's own prerequisites, so a yes shows the row below at once while
   the next one is asked. A row already received is never asked again. In the section's
   entry of the parameters file the tree keeps, under `saved[<element id>]`, the answers
   (keyed by concept name), the focus and the paths left; `received` holds the rows by
   concept. The tree saves the whole `saved` object, keeping the other keys it loaded: a
   section that draws a tree saves nothing else of its own. */
(function () {
  var vc = window.viewConcept;
  if (!vc) return;
  var root = document.documentElement;
  var CHIP = 150, GAP = 8, STRIP = 40, STEP_MS = 300, SHOWN_CIRCLES = 4;
  var ITEM = { type: "object", required: ["name", "quick", "text"], properties: {
    name: { type: "string" }, quick: { type: "string" }, text: { type: "string" } } };
  var SCHEMA = { type: "object", required: ["concepts"], properties: { concepts: { type: "array",
    items: { type: "object", required: ["name", "quick", "text", "prerequisites"], properties: {
      name: { type: "string" }, quick: { type: "string" }, text: { type: "string" },
      prerequisites: { type: "array", items: ITEM } } } } } };

  var STYLE = [
    ".vc-tree-tab { position: absolute; z-index: 5; font: inherit; font-family: var(--mono); font-size: var(--fs-label, 11px);",
    "  line-height: 1.5; color: var(--ink-dim); background: var(--bg); border: 1px solid var(--ink-dim); padding: 0 0.6em;",
    "  cursor: pointer; white-space: nowrap; }",
    ".vc-tree-tab:hover { color: var(--accent); border-color: var(--accent); }",
    ".vc-tree-tab.on { z-index: 1002; color: var(--accent); border-color: var(--accent); }",
    ".vc-tree-backdrop { position: fixed; inset: 0; z-index: 1000; background: var(--backdrop); }",
    ".vc-tree-panel { position: absolute; z-index: 1001; box-sizing: border-box; background: var(--bg); color: var(--ink);",
    "  border: 1px solid var(--line-strong); padding: 12px; font-family: var(--mono); font-size: var(--fs-small, 12px);",
    "  line-height: 1.5; }",
    ".vc-tree-panel button { font: inherit; }",
    ".vc-tree-grid { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(12rem, 16rem); gap: 1em; }",
    "@media (max-width: 640px) { .vc-tree-grid { grid-template-columns: 1fr; } }",
    ".vc-tree-wires { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }",
    ".vc-tree-rows { position: relative; display: flex; flex-direction: column; }",
    ".vc-tree-row { position: relative; height: 66px; overflow: hidden; margin-top: 30px; touch-action: pan-y; }",
    ".vc-tree-row:first-child { margin-top: 18px; }",
    ".vc-tree-row.note { height: auto; overflow: visible; color: var(--muted); padding: 0.3em 0; }",
    ".vc-tree-row .failed { color: var(--danger); cursor: pointer; }",
    ".vc-tree-chip { position: absolute; top: 4px; height: 56px; box-sizing: border-box; border: 1px solid var(--line);",
    "  background: var(--bg); padding: 2px 6px; }",
    ".vc-tree-chip.focus { border-color: var(--accent); }",
    ".vc-tree-name { display: block; width: 100%; text-align: left; background: none; border: 0; color: var(--ink);",
    "  padding: 0; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".vc-tree-twice { color: var(--muted); font-size: var(--fs-label, 11px); margin-left: 0.3em; }",
    ".vc-tree-answers { display: flex; gap: 3px; margin-top: 4px; }",
    ".vc-tree-answers button { font-size: var(--fs-label, 11px); background: none; color: var(--muted);",
    "  border: 1px solid var(--line); padding: 0 4px; cursor: pointer; }",
    ".vc-tree-answers button:hover { color: var(--ink); border-color: var(--ink-dim); }",
    ".vc-tree-answers button.on { color: var(--bg); background: var(--ink-dim); border-color: var(--ink-dim); }",
    ".vc-tree-chip.circle { width: 18px !important; height: 18px; top: 23px; border-radius: 50%; padding: 0; cursor: pointer;",
    "  background: var(--raised); border-color: var(--ink-dim); overflow: hidden; }",
    ".vc-tree-chip.circle:hover { border-color: var(--accent); }",
    ".vc-tree-chip.circle > * { display: none; }",
    ".vc-tree-more { position: absolute; top: 46px; font-size: var(--fs-label, 11px); color: var(--muted); pointer-events: none; }",
    ".vc-tree-lane { position: relative; display: flex; flex-direction: column; gap: 0.6em; }",
    ".vc-tree-head { display: flex; gap: 0.6em; align-items: baseline; color: var(--muted); }",
    ".vc-tree-head span { flex: 1; }",
    ".vc-tree-close { background: none; border: 1px solid var(--line); color: var(--muted); cursor: pointer; padding: 0 0.5em; }",
    ".vc-tree-close:hover { color: var(--ink); border-color: var(--ink-dim); }",
    ".vc-tree-text { border: 1px dotted var(--ink-dim); padding: 0.5em 0.7em; background: var(--raised); }",
    ".vc-tree-text b { display: block; color: var(--ink); margin-bottom: 0.2em; }",
    ".vc-tree-text.empty { color: var(--muted); border-color: var(--line); background: none; }",
  ].join("\n");

  var trees = [];
  var saved = {}, received = {};
  var pending = {}, failed = {}, absent = {};
  var loaded = false, loading = false;
  var saving = Promise.resolve();
  var opened = null; // the open tree
  var backdrop = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function find(list, name) {
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }

  // Saves run one after the other, each sending `saved` as it is when it runs.
  function persist() {
    saving = saving.then(function () { return vc.save(saved); }).catch(function () {});
  }

  // How many rows list a concept: a concept met on two branches is marked ·2.
  function parentsOf(name) {
    var n = 0;
    Object.keys(received).forEach(function (k) {
      var cs = (received[k] && received[k].concepts) || [];
      if (find(cs, name)) n++;
      cs.forEach(function (c) { if (find(c.prerequisites, name)) n++; });
    });
    return n;
  }

  // The client coordinates of the origin the absolute layer is placed against.
  function origin() {
    var b = document.body;
    if (getComputedStyle(b).position === "static") return { x: -scrollX, y: -scrollY };
    var r = b.getBoundingClientRect();
    return { x: r.left + b.clientLeft, y: r.top + b.clientTop };
  }

  function addStyle() {
    if (document.getElementById("vc-tree-style")) return;
    var s = el("style");
    s.id = "vc-tree-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function showBackdrop(on) {
    if (on && !backdrop) {
      backdrop = el("div", "vc-tree-backdrop");
      backdrop.addEventListener("click", function () { if (opened) opened.close(); });
      document.body.appendChild(backdrop);
    }
    if (backdrop) backdrop.hidden = !on;
  }

  function makeTree(id, cfg) {
    var elem = document.getElementById(id);
    var st = { answers: {}, focus: [], paths: {}, open: null };
    var offsets = {}; // per row, how far it slid
    var hold = null; // the row a click on a circle centred: no slide until the mouse leaves its strip
    var raisedStyle = null;
    var panel = null, rowsEl = null, laneEl = null, wires = null;
    var reader = cfg.reader || "the reader of this drawing";

    var tab = el("button", "vc-tree-tab");
    tab.type = "button";
    tab.addEventListener("click", function (ev) { ev.stopPropagation(); if (opened === api) close(); else open(); });
    document.body.appendChild(tab);

    function instruction(key, chain) {
      var about = "« " + cfg.concept + " »" + (cfg.gloss ? " (" + cfg.gloss + ")" : "");
      if (key === cfg.concept) {
        return "List the prerequisite concepts of " + about + ", for " + reader + ". Give 3 to 6 concepts, " +
          "each with a one-sentence text (quick) and a text of a few sentences (text), and for each, its own " +
          "prerequisite concepts (3 to 5) with the same two texts.";
      }
      return "List the prerequisite concepts of « " + key + " », for " + reader + ", who came to it from " + about +
        " by the branch " + chain.join(" → ") + ". Give 2 to 5 concepts, each with a one-sentence text (quick) " +
        "and a text of a few sentences (text), and for each, its own prerequisite concepts (2 to 4) with the " +
        "same two texts.";
    }

    function request(key, chain) {
      if (received[key] || pending[key] || absent[key]) return;
      pending[key] = true;
      delete failed[key];
      vc.ask(key, instruction(key, chain), SCHEMA).then(function (d) {
        received[key] = d;
        delete pending[key];
        renderOpen();
      }).catch(function (e) {
        delete pending[key];
        if (e && e.name === "NotReceivedError") absent[key] = true;
        else failed[key] = true;
        renderOpen();
      });
    }

    // The rows shown: the root's, then below each concept in focus answered yes, its own.
    function rowsToShow() {
      var out = [], chain = [cfg.concept], key = cfg.concept;
      var concepts = received[key] ? received[key].concepts : null;
      for (var level = 0; level < 40; level++) {
        out.push({ level: level, key: key, chain: chain.slice(), concepts: concepts });
        if (!concepts) break;
        var f = st.focus[level], c = find(concepts, f);
        if (!c || st.answers[f] !== "yes") break;
        chain.push(f);
        var next = received[f] ? received[f].concepts : (c.prerequisites && c.prerequisites.length ? c.prerequisites : null);
        request(f, chain.slice()); // one row ahead
        key = f;
        concepts = next;
        if (concepts && !concepts.length) break;
      }
      return out;
    }

    function setFocus(level, name) {
      var cur = st.focus[level];
      st.open = name;
      if (cur === name) return;
      if (cur) st.paths[cur] = st.focus.slice(level + 1);
      st.focus = st.focus.slice(0, level).concat([name], st.paths[name] || []);
    }

    function answer(level, name, a) {
      st.answers[name] = a;
      setFocus(level, name);
      persist();
      render();
    }

    /* ---- open and close ---- */
    function raise(on) {
      if (on) {
        var cs = getComputedStyle(elem);
        raisedStyle = { position: elem.style.position, zIndex: elem.style.zIndex,
                        background: elem.style.background, boxShadow: elem.style.boxShadow };
        if (cs.position === "static") elem.style.position = "relative";
        elem.style.zIndex = "1001";
        if (cs.backgroundColor === "transparent" || cs.backgroundColor === "rgba(0, 0, 0, 0)") elem.style.background = "var(--bg)";
        elem.style.boxShadow = "0 0 0 1px var(--accent), 0 8px 28px var(--backdrop)";
      } else if (raisedStyle) {
        for (var k in raisedStyle) elem.style[k] = raisedStyle[k];
        raisedStyle = null;
      }
    }

    function open() {
      if (opened) opened.close();
      opened = api;
      showBackdrop(true);
      raise(true);
      panel = el("div", "vc-tree-panel");
      var grid = el("div", "vc-tree-grid");
      wires = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      wires.setAttribute("class", "vc-tree-wires");
      rowsEl = el("div", "vc-tree-rows");
      laneEl = el("div", "vc-tree-lane");
      panel.appendChild(wires);
      grid.appendChild(rowsEl);
      grid.appendChild(laneEl);
      panel.appendChild(grid);
      document.body.appendChild(panel);
      render();
    }

    function close() {
      if (opened !== api) return;
      opened = null;
      showBackdrop(false);
      raise(false);
      if (panel) panel.remove();
      panel = rowsEl = laneEl = wires = null;
      root.style.minHeight = "";
      place();
    }

    /* ---- placing the tab and the panel ---- */
    function place() {
      var r = elem.getBoundingClientRect();
      var shown = r.width > 0 || r.height > 0;
      tab.hidden = !shown;
      if (!shown) return;
      var n = Object.keys(st.answers).length;
      tab.textContent = (opened === api ? "▾" : "▸") + " prerequisites" + (n ? " · " + n : "");
      tab.classList.toggle("on", opened === api);
      var o = origin();
      tab.style.top = (r.bottom - o.y - tab.offsetHeight / 2) + "px";
      tab.style.left = (r.right - o.x - tab.offsetWidth - 12) + "px";
      if (opened === api && panel) placePanel();
    }

    function placePanel() {
      var o = origin(), t = tab.getBoundingClientRect(), margin = 8;
      var top = t.bottom - o.y + 6;
      panel.style.top = top + "px";
      panel.style.left = (margin - o.x) + "px";
      panel.style.width = (root.clientWidth - 2 * margin) + "px";
      var bottom = panel.getBoundingClientRect().bottom + scrollY + 16;
      root.style.minHeight = Math.ceil(bottom) + "px";
    }

    /* ---- the rows ---- */
    function layoutRow(div) {
      var chips = div.querySelectorAll(".vc-tree-chip");
      var n = chips.length, cw = div.clientWidth || 1;
      var w = Math.min(CHIP, Math.max(110, cw * 0.45));
      var total = n * (w + GAP) - GAP;
      div._w = w;
      div.querySelectorAll(".vc-tree-more").forEach(function (m) { m.remove(); });
      if (total <= cw) {
        var start = (cw - total) / 2;
        chips.forEach(function (ch, i) {
          ch.classList.remove("circle");
          ch.style.width = w + "px";
          ch.style.left = (start + i * (w + GAP)) + "px";
          ch.style.zIndex = "";
        });
        div._slack = 0;
        return;
      }
      var inner = cw - 2 * STRIP;
      var slack = total - inner;
      // A row drawn for the first time shows its concept in focus, centred.
      if (offsets[div._key] === undefined && div._focus >= 0) offsets[div._key] = div._focus * (w + GAP) - (inner - w) / 2;
      var off = clamp(offsets[div._key] || 0, 0, slack);
      offsets[div._key] = off;
      div._slack = slack;
      div._inner = inner;
      var left = [], right = [];
      chips.forEach(function (ch, i) {
        var x = STRIP + i * (w + GAP) - off;
        ch.style.width = w + "px";
        if (x < STRIP - 1) left.push(ch);
        else if (x + w > cw - STRIP + 1) right.push(ch);
        else { ch.classList.remove("circle"); ch.style.left = x + "px"; ch.style.zIndex = ""; }
      });
      // The circles of a strip, stacked: the one nearest the concepts in view on top.
      left.forEach(function (ch, k) {
        var j = left.length - 1 - k;
        ch.classList.add("circle");
        ch.style.left = (STRIP - 22 - Math.min(j, SHOWN_CIRCLES - 1) * 6) + "px";
        ch.style.zIndex = String(10 - Math.min(j, 9));
      });
      right.forEach(function (ch, j) {
        ch.classList.add("circle");
        ch.style.left = (cw - STRIP + 4 + Math.min(j, SHOWN_CIRCLES - 1) * 6) + "px";
        ch.style.zIndex = String(10 - Math.min(j, 9));
      });
      if (left.length) { var l = el("span", "vc-tree-more", "‹ " + left.length); l.style.left = "2px"; div.appendChild(l); }
      if (right.length) { var m = el("span", "vc-tree-more", right.length + " ›"); m.style.right = "2px"; div.appendChild(m); }
    }

    function slideTo(div, off) {
      offsets[div._key] = clamp(off, 0, div._slack || 0);
      layoutRow(div);
      drawWires();
    }

    // While the mouse rests in a strip, the row slides toward that end at a steady speed.
    function glide(div) {
      if (div._gliding) return;
      div._gliding = true;
      var last = performance.now();
      function step(now) {
        var dt = Math.max(0, now - last);
        last = now;
        var off = offsets[div._key] || 0;
        var next = clamp(off + div._dir * (div._w + GAP) * dt / STEP_MS, 0, div._slack || 0);
        if (!div._dir || !div.isConnected || next === off && dt > 0) { div._gliding = false; return; }
        slideTo(div, next);
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function bindSlide(div) {
      div.addEventListener("pointermove", function (ev) {
        if (ev.pointerType === "touch" || !div._slack) return;
        var b = div.getBoundingClientRect(), x = ev.clientX - b.left;
        div._dir = x < STRIP ? -1 : x > b.width - STRIP ? 1 : 0;
        if (!div._dir && hold === div._key) hold = null;
        if (div._dir && hold !== div._key) glide(div);
      });
      div.addEventListener("pointerleave", function () {
        div._dir = 0;
        if (hold === div._key) hold = null;
      });
      div.addEventListener("wheel", function (ev) {
        if (!div._slack) return;
        var d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.shiftKey ? ev.deltaY : 0;
        if (!d) return;
        ev.preventDefault();
        slideTo(div, (offsets[div._key] || 0) + d);
      }, { passive: false });
      var swipe = null;
      div.addEventListener("pointerdown", function (ev) {
        if (ev.pointerType === "touch" && div._slack) swipe = { x: ev.clientX, off: offsets[div._key] || 0 };
      });
      div.addEventListener("pointermove", function (ev) {
        if (swipe && ev.pointerType === "touch") slideTo(div, swipe.off - (ev.clientX - swipe.x));
      });
      ["pointerup", "pointercancel"].forEach(function (t) { div.addEventListener(t, function () { swipe = null; }); });
    }

    function chipFor(r, c, i, div) {
      var ch = el("div", "vc-tree-chip" + (st.focus[r.level] === c.name ? " focus" : ""));
      ch.dataset.name = c.name;
      ch.title = c.name;
      var nm = el("button", "vc-tree-name", c.name);
      nm.type = "button";
      if (parentsOf(c.name) > 1) nm.appendChild(el("span", "vc-tree-twice", "·2"));
      nm.addEventListener("click", function () { setFocus(r.level, c.name); persist(); render(); });
      ch.appendChild(nm);
      var ans = el("div", "vc-tree-answers");
      ["yes", "quickly", "no"].forEach(function (a) {
        var b = el("button", st.answers[c.name] === a ? "on" : "", a);
        b.type = "button";
        b.addEventListener("click", function (ev) { ev.stopPropagation(); answer(r.level, c.name, a); });
        ans.appendChild(b);
      });
      ch.appendChild(ans);
      ch.addEventListener("click", function () {
        if (!ch.classList.contains("circle")) return;
        hold = div._key;
        offsets[div._key] = i * (div._w + GAP) - (div._inner - div._w) / 2;
        setFocus(r.level, c.name);
        persist();
        render();
      });
      return ch;
    }

    function render() {
      place();
      if (opened !== api || !panel) return;
      rowsEl.innerHTML = "";
      var rows = rowsToShow();
      rows.forEach(function (r) {
        var div = el("div", "vc-tree-row");
        div.dataset.level = r.level;
        if (!r.concepts) {
          div.className += " note";
          if (absent[r.key]) div.textContent = "";
          else if (failed[r.key]) {
            var f = el("span", "failed", "the concepts under « " + r.key + " » did not come: click to ask again");
            f.addEventListener("click", function () { delete failed[r.key]; request(r.key, r.chain); render(); });
            div.appendChild(f);
          } else {
            div.textContent = "asking for the concepts under « " + r.key + " »…";
            request(r.key, r.chain);
          }
          rowsEl.appendChild(div);
          return;
        }
        div._key = r.chain.join(" › ");
        div._focus = r.concepts.map(function (c) { return c.name; }).indexOf(st.focus[r.level]);
        r.concepts.forEach(function (c, i) { div.appendChild(chipFor(r, c, i, div)); });
        bindSlide(div);
        rowsEl.appendChild(div);
        layoutRow(div);
      });
      renderLane(rows);
      placePanel();
      drawWires();
    }

    function renderOpen() { if (opened === api) render(); else place(); }

    function conceptData(name, rows) {
      for (var i = 0; i < rows.length; i++) { var c = find(rows[i].concepts, name); if (c) return c; }
      return null;
    }

    function renderLane(rows) {
      laneEl.innerHTML = "";
      var head = el("div", "vc-tree-head");
      head.appendChild(el("span", "", "What « " + cfg.concept + " » rests on: yes, quickly or no on each concept."));
      var x = el("button", "vc-tree-close", "close");
      x.type = "button";
      x.addEventListener("click", close);
      head.appendChild(x);
      laneEl.appendChild(head);
      var box = el("div", "vc-tree-text");
      var c = st.open ? conceptData(st.open, rows) : null;
      var a = c ? st.answers[c.name] : null;
      if (!c) {
        box.className += " empty";
        box.textContent = rows[0] && rows[0].concepts ? "Click a concept to see its text here." : "";
      } else if (a === "yes" || a === "quickly") {
        box.appendChild(el("b", "", c.name));
        box.appendChild(el("span", "", a === "yes" ? c.text : c.quick));
      } else if (a === "no") {
        box.className += " empty";
        box.textContent = "« " + c.name + " »: you answered no, the branch stops here.";
      } else {
        box.className += " empty";
        box.textContent = "« " + c.name + " »: answer yes, quickly or no.";
      }
      laneEl.appendChild(box);
    }

    // Branches from the element's bottom edge down to the first row, and from each concept
    // in focus down to its row, none to a circle; then a dotted line from the open concept
    // to its text.
    function drawWires() {
      if (!panel) return;
      var pb = panel.getBoundingClientRect();
      var ox = pb.left + panel.clientLeft, oy = pb.top + panel.clientTop;
      var eb = elem.getBoundingClientRect();
      var paths = [];
      function line(x1, y1, x2, y2, style) {
        var my = (y1 + y2) / 2;
        paths.push('<path d="M' + x1 + " " + y1 + " C " + x1 + " " + my + ", " + x2 + " " + my + ", " + x2 + " " + y2 +
          '" fill="none" stroke="var(--ink-dim)" ' + style + "/>");
      }
      rowsEl.querySelectorAll(".vc-tree-row").forEach(function (div) {
        var level = Number(div.dataset.level), parent = null;
        if (level > 0) {
          var above = rowsEl.querySelector('.vc-tree-row[data-level="' + (level - 1) + '"] .vc-tree-chip.focus');
          if (!above) return;
          var ab = above.getBoundingClientRect();
          parent = [ab.left + ab.width / 2 - ox, ab.bottom - oy];
        }
        var chips = div.querySelectorAll(".vc-tree-chip");
        chips.forEach(function (ch, i) {
          if (ch.classList.contains("circle")) return; // a collapsed concept takes no branch
          var b = ch.getBoundingClientRect();
          var px = parent ? parent[0] : eb.left - ox + (eb.width * (i + 1)) / (chips.length + 1);
          var py = parent ? parent[1] : eb.bottom - oy;
          var a = st.answers[ch.dataset.name];
          var style = a === "yes" ? 'stroke-width="2.6"' : a === "quickly" ? 'stroke-width="1"' :
            a === "no" ? 'stroke-width="1" stroke-dasharray="4 3"' : 'stroke-width="1" stroke-dasharray="1 3" opacity="0.6"';
          line(px, py, b.left + b.width / 2 - ox, b.top - oy, style);
        });
      });
      var focus = st.open ? rowsEl.querySelector('.vc-tree-chip.focus[data-name="' + CSS.escape(st.open) + '"]') : null;
      var text = laneEl.querySelector(".vc-tree-text");
      if (focus && !focus.classList.contains("circle") && text && !text.classList.contains("empty")) {
        var fb = focus.getBoundingClientRect(), tb = text.getBoundingClientRect();
        var side = tb.left > fb.right;
        var x1 = side ? fb.right - ox : fb.left + fb.width / 2 - ox, y1 = side ? fb.top + fb.height / 2 - oy : fb.bottom - oy;
        var x2 = side ? tb.left - ox : tb.left + 12 - ox, y2 = side ? tb.top + 12 - oy : tb.top - oy;
        paths.push('<path d="M' + x1 + " " + y1 + " L " + x2 + " " + y2 +
          '" stroke="var(--ink-dim)" stroke-width="1" stroke-dasharray="1 3" fill="none"/>');
      }
      wires.innerHTML = paths.join("");
    }

    // Take the saved state of this tree, and set the preset answers not given yet.
    function adopt() {
      var s = saved[id];
      if (s) { st.answers = s.answers || {}; st.focus = s.focus || []; st.paths = s.paths || {}; st.open = s.open || null; }
      var changed = false;
      Object.keys(cfg.preset || {}).forEach(function (n) {
        if (st.answers[n] === undefined) { st.answers[n] = cfg.preset[n]; changed = true; }
      });
      saved[id] = st;
      return changed;
    }

    var api = { id: id, place: place, render: render, close: close, adopt: adopt,
                relayout: function () { if (opened === api) render(); else place(); } };
    return api;
  }

  function start(p) {
    var s = (p && p.saved) || {};
    Object.keys(s).forEach(function (k) { saved[k] = s[k]; });
    received = (p && p.received) || {};
    loaded = true;
    var changed = false;
    trees.forEach(function (t) { if (t.adopt()) changed = true; });
    if (changed) persist();
    trees.forEach(function (t) { t.place(); });
  }

  function placeAll() { trees.forEach(function (t) { t.place(); }); }

  vc.tree = function (id, cfg) {
    if (!cfg || !cfg.concept) throw new Error("viewConcept.tree takes an element id and {concept, gloss, reader, preset}");
    if (!document.getElementById(id)) throw new Error("viewConcept.tree: no element " + id);
    addStyle();
    var t = makeTree(id, cfg);
    trees.push(t);
    if (loaded) { if (t.adopt()) persist(); t.place(); return; }
    t.place();
    if (loading) return;
    loading = true;
    // Load once, after every tree the section's script draws in this run is registered.
    Promise.resolve().then(function () { vc.load().then(start, function () { start(null); }); });
  };

  addEventListener("keydown", function (e) { if (e.key === "Escape" && opened) opened.close(); });
  addEventListener("resize", function () { trees.forEach(function (t) { t.relayout(); }); });
  addEventListener("load", placeAll);
  if (window.ResizeObserver) new ResizeObserver(placeAll).observe(root);
})();
