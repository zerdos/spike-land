import { Hono } from "hono";
import { html } from "hono/html";

import type { Env, Variables } from "../../core-logic/env";

const canvas = new Hono<{ Bindings: Env; Variables: Variables }>();

canvas.get("/app", (c) => {
  return c.html(
    html`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>notepad.spike.land</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #0a0a0f;
      color: #e0e0e0;
      overflow: hidden;
      height: 100vh;
    }

    /* Top bar */
    #topbar {
      position: fixed; top: 0; left: 0; right: 0;
      height: 48px; background: #111118; border-bottom: 1px solid #222;
      display: flex; align-items: center; padding: 0 16px; z-index: 100;
      justify-content: space-between;
    }
    #topbar h1 { font-size: 14px; font-weight: 600; color: #888; letter-spacing: 0.5px; }
    #topbar .project-name { font-size: 14px; color: #ccc; margin-left: 12px; }
    #topbar .note-count { font-size: 12px; color: #555; margin-left: 8px; }
    .topbar-right { display: flex; gap: 8px; align-items: center; }
    .topbar-btn {
      background: #1a1a24; border: 1px solid #333; color: #aaa; padding: 6px 12px;
      border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.15s;
    }
    .topbar-btn:hover { background: #252530; color: #fff; border-color: #555; }
    .topbar-btn.active { background: #2a2a3a; color: #7c8aff; border-color: #7c8aff; }

    /* Status bar */
    #statusbar {
      position: fixed; bottom: 0; left: 0; right: 0;
      height: 28px; background: #111118; border-top: 1px solid #222;
      display: flex; align-items: center; padding: 0 16px; z-index: 100;
      font-size: 11px; color: #555; gap: 16px;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #3a3; display: inline-block; margin-right: 4px; }

    /* Canvas */
    #canvas {
      position: fixed; top: 48px; left: 0; right: 0; bottom: 28px;
      overflow: hidden; cursor: crosshair;
    }
    #canvas-inner {
      position: absolute; width: 10000px; height: 10000px;
      transform-origin: 0 0;
    }

    /* Grid */
    #canvas-inner::before {
      content: ''; position: absolute; inset: 0;
      background-image:
        radial-gradient(circle, #1a1a24 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    /* Note card */
    .note {
      position: absolute; width: 280px; min-height: 60px;
      background: #16161e; border: 1px solid #2a2a35; border-radius: 10px;
      padding: 12px; cursor: grab; user-select: none;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .note:hover { border-color: #444; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    .note.dragging { cursor: grabbing; box-shadow: 0 8px 30px rgba(0,0,0,0.6); z-index: 50; opacity: 0.9; }
    .note.editing { cursor: text; border-color: #7c8aff; box-shadow: 0 0 0 2px rgba(124,138,255,0.2); }

    .note-type {
      display: inline-block; font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px;
    }
    .type-general { background: #2a2a35; color: #888; }
    .type-claim { background: #2a1f1f; color: #f77; }
    .type-question { background: #1f2a1f; color: #7d7; }
    .type-idea { background: #2a2a1f; color: #dd7; }
    .type-task { background: #1f1f2a; color: #77f; }
    .type-entity { background: #2a1f2a; color: #d7d; }
    .type-quote { background: #1f2a2a; color: #7dd; }
    .type-reference { background: #2a251f; color: #da7; }
    .type-definition { background: #1f252a; color: #7ad; }
    .type-opinion { background: #2a1f25; color: #f7a; }
    .type-reflection { background: #251f2a; color: #a7f; }
    .type-narrative { background: #1f2a25; color: #7fa; }
    .type-comparison { background: #2a2a25; color: #dda; }
    .type-thesis { background: #251f1f; color: #faa; }

    .note-content {
      font-size: 13px; line-height: 1.5; color: #ccc; white-space: pre-wrap; word-break: break-word;
    }
    .note-content:empty::before {
      content: 'Type something...'; color: #444;
    }
    .note textarea {
      width: 100%; min-height: 40px; background: transparent; border: none; color: #ccc;
      font: inherit; font-size: 13px; line-height: 1.5; resize: none; outline: none;
    }

    .note-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .tag-chip {
      font-size: 10px; padding: 2px 6px; border-radius: 8px;
      background: #1a1a2a; color: #7c8aff; border: 1px solid #333;
    }

    .note-pin {
      position: absolute; top: 8px; right: 8px; font-size: 12px; cursor: pointer; opacity: 0.3;
      transition: opacity 0.15s;
    }
    .note-pin:hover, .note.pinned .note-pin { opacity: 1; }

    /* Empty state */
    #empty-state {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      text-align: center; color: #333; pointer-events: none;
    }
    #empty-state h2 { font-size: 20px; font-weight: 400; margin-bottom: 8px; }
    #empty-state p { font-size: 13px; }

    /* Context menu */
    #context-menu {
      display: none; position: fixed; background: #1a1a24; border: 1px solid #333;
      border-radius: 8px; padding: 4px; min-width: 160px; z-index: 200;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    }
    #context-menu.visible { display: block; }
    .ctx-item {
      padding: 8px 12px; font-size: 12px; color: #ccc; border-radius: 4px; cursor: pointer;
    }
    .ctx-item:hover { background: #252530; }
    .ctx-item.danger { color: #f77; }
    .ctx-item.danger:hover { background: #2a1f1f; }
    .ctx-sep { height: 1px; background: #2a2a35; margin: 4px 0; }
  </style>
</head>
<body>
  <div id="topbar">
    <div style="display:flex;align-items:center">
      <h1>NOTEPAD</h1>
      <span class="project-name" id="projectName">Loading...</span>
      <span class="note-count" id="noteCount"></span>
    </div>
    <div class="topbar-right">
      <button class="topbar-btn" onclick="createNoteAtCenter()">+ New Note</button>
    </div>
  </div>

  <div id="canvas">
    <div id="canvas-inner">
      <div id="empty-state">
        <h2>Click anywhere to create a note</h2>
        <p>Double-click to edit &middot; Drag to move &middot; Right-click for options</p>
      </div>
    </div>
  </div>

  <div id="statusbar">
    <span><span class="status-dot"></span> Connected</span>
    <span id="statusNotes">0 notes</span>
    <span id="statusSaved">Saved</span>
  </div>

  <div id="context-menu">
    <div class="ctx-item" onclick="pinSelectedNote()">📌 Pin / Unpin</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item danger" onclick="deleteSelectedNote()">🗑 Delete</div>
  </div>

  <script>
    const API = '';
    let projectId = null;
    let notesMap = new Map();
    let dragState = null;
    let editingNoteId = null;
    let contextNoteId = null;
    let saveTimers = new Map();
    let panOffset = { x: 0, y: 0 };

    const canvasEl = document.getElementById('canvas');
    const innerEl = document.getElementById('canvas-inner');
    const emptyState = document.getElementById('empty-state');
    const ctxMenu = document.getElementById('context-menu');

    // --- Init ---
    async function init() {
      // Get or create default project
      const res = await fetch(API + '/api/projects');
      const data = await res.json();

      if (data.projects.length > 0) {
        projectId = data.projects[0].id;
        document.getElementById('projectName').textContent = data.projects[0].name;
      } else {
        const cr = await fetch(API + '/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'My Notepad' }),
        });
        const proj = await cr.json();
        projectId = proj.id;
        document.getElementById('projectName').textContent = proj.name;
      }

      await loadNotes();
    }

    async function loadNotes() {
      const res = await fetch(API + '/api/projects/' + projectId + '/notes');
      const data = await res.json();

      // Clear existing
      document.querySelectorAll('.note').forEach(el => el.remove());
      notesMap.clear();

      data.notes.forEach(n => {
        notesMap.set(n.id, n);
        renderNote(n);
      });

      updateCounts();
    }

    // --- Render ---
    function renderNote(note) {
      const existing = document.getElementById('note-' + note.id);
      if (existing) existing.remove();

      const el = document.createElement('div');
      el.className = 'note' + (note.pinned ? ' pinned' : '');
      el.id = 'note-' + note.id;
      el.style.left = note.position_x + 'px';
      el.style.top = note.position_y + 'px';
      el.dataset.noteId = note.id;

      const tags = (note.tags || [])
        .map(t => '<span class="tag-chip">#' + escHtml(t) + '</span>')
        .join('');

      el.innerHTML =
        '<span class="note-type type-' + note.type + '">' + note.type + '</span>' +
        '<span class="note-pin">' + (note.pinned ? '📌' : '📍') + '</span>' +
        '<div class="note-content">' + escHtml(note.content) + '</div>' +
        (tags ? '<div class="note-tags">' + tags + '</div>' : '');

      // Events
      el.addEventListener('mousedown', (e) => startDrag(e, note.id));
      el.addEventListener('dblclick', (e) => startEdit(e, note.id));
      el.addEventListener('contextmenu', (e) => showContextMenu(e, note.id));

      innerEl.appendChild(el);
    }

    function escHtml(s) {
      const d = document.createElement('div');
      d.textContent = s || '';
      return d.innerHTML;
    }

    function updateCounts() {
      const count = notesMap.size;
      document.getElementById('noteCount').textContent = '(' + count + ')';
      document.getElementById('statusNotes').textContent = count + ' note' + (count !== 1 ? 's' : '');
      emptyState.style.display = count === 0 ? 'block' : 'none';
    }

    // --- Create note ---
    async function createNoteAt(x, y) {
      const res = await fetch(API + '/api/projects/' + projectId + '/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', position_x: x, position_y: y }),
      });
      const note = await res.json();
      notesMap.set(note.id, note);
      renderNote(note);
      updateCounts();
      startEdit(null, note.id);
    }

    function createNoteAtCenter() {
      const rect = canvasEl.getBoundingClientRect();
      createNoteAt(
        rect.width / 2 - 140 - panOffset.x,
        rect.height / 2 - 30 - panOffset.y
      );
    }

    // --- Canvas click to create ---
    canvasEl.addEventListener('click', (e) => {
      if (e.target !== canvasEl && e.target !== innerEl && !e.target.closest('#empty-state')) return;
      closeContextMenu();
      if (editingNoteId) { finishEdit(editingNoteId); return; }

      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left - panOffset.x;
      const y = e.clientY - rect.top - panOffset.y;
      createNoteAt(x, y);
    });

    // --- Drag ---
    function startDrag(e, noteId) {
      if (editingNoteId === noteId) return;
      if (e.button !== 0) return;
      e.preventDefault();

      const el = document.getElementById('note-' + noteId);
      const note = notesMap.get(noteId);
      el.classList.add('dragging');

      dragState = {
        noteId,
        startX: e.clientX,
        startY: e.clientY,
        origX: note.position_x,
        origY: note.position_y,
      };
    }

    document.addEventListener('mousemove', (e) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const el = document.getElementById('note-' + dragState.noteId);
      const newX = dragState.origX + dx;
      const newY = dragState.origY + dy;
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', (e) => {
      if (!dragState) return;
      const el = document.getElementById('note-' + dragState.noteId);
      el.classList.remove('dragging');

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const newX = dragState.origX + dx;
      const newY = dragState.origY + dy;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        const note = notesMap.get(dragState.noteId);
        note.position_x = newX;
        note.position_y = newY;
        saveNote(dragState.noteId, { position_x: newX, position_y: newY });
      }

      dragState = null;
    });

    // --- Edit ---
    function startEdit(e, noteId) {
      if (e) e.stopPropagation();
      if (editingNoteId && editingNoteId !== noteId) finishEdit(editingNoteId);

      editingNoteId = noteId;
      const el = document.getElementById('note-' + noteId);
      const note = notesMap.get(noteId);
      el.classList.add('editing');

      const contentEl = el.querySelector('.note-content');
      const ta = document.createElement('textarea');
      ta.value = note.content || '';
      ta.rows = Math.max(2, (note.content || '').split('\\n').length);
      contentEl.replaceWith(ta);
      ta.focus();

      ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        debouncedSave(noteId, { content: ta.value });
      });

      ta.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') finishEdit(noteId);
      });

      // Auto-size
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }

    function finishEdit(noteId) {
      const el = document.getElementById('note-' + noteId);
      if (!el) return;
      el.classList.remove('editing');

      const ta = el.querySelector('textarea');
      if (ta) {
        const content = ta.value;
        const note = notesMap.get(noteId);
        note.content = content;

        // Parse tags
        const tagMatches = content.match(/#(\\w+)/g);
        const tags = tagMatches ? tagMatches.map(t => t.slice(1)) : [];
        note.tags = tags;

        saveNote(noteId, { content, tags });
        renderNote(note);
      }

      editingNoteId = null;
    }

    // --- Save ---
    function saveNote(noteId, fields) {
      document.getElementById('statusSaved').textContent = 'Saving...';
      fetch(API + '/api/notes/' + noteId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      }).then(() => {
        document.getElementById('statusSaved').textContent = 'Saved';
      });
    }

    function debouncedSave(noteId, fields) {
      if (saveTimers.has(noteId)) clearTimeout(saveTimers.get(noteId));
      saveTimers.set(noteId, setTimeout(() => {
        const note = notesMap.get(noteId);
        if (note) Object.assign(note, fields);
        saveNote(noteId, fields);
        saveTimers.delete(noteId);
      }, 800));
    }

    // --- Context menu ---
    function showContextMenu(e, noteId) {
      e.preventDefault();
      contextNoteId = noteId;
      ctxMenu.style.left = e.clientX + 'px';
      ctxMenu.style.top = e.clientY + 'px';
      ctxMenu.classList.add('visible');
    }

    function closeContextMenu() {
      ctxMenu.classList.remove('visible');
      contextNoteId = null;
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#context-menu')) closeContextMenu();
    });

    async function pinSelectedNote() {
      if (!contextNoteId) return;
      const note = notesMap.get(contextNoteId);
      note.pinned = !note.pinned;
      await saveNote(contextNoteId, { pinned: note.pinned });
      renderNote(note);
      closeContextMenu();
    }

    async function deleteSelectedNote() {
      if (!contextNoteId) return;
      if (!confirm('Delete this note?')) { closeContextMenu(); return; }
      await fetch(API + '/api/notes/' + contextNoteId, { method: 'DELETE' });
      document.getElementById('note-' + contextNoteId).remove();
      notesMap.delete(contextNoteId);
      updateCounts();
      closeContextMenu();
    }

    // --- Keyboard ---
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (editingNoteId) finishEdit(editingNoteId);
        closeContextMenu();
      }
    });

    // --- Start ---
    init();
  </script>
</body>
</html>`,
  );
});

export { canvas };
