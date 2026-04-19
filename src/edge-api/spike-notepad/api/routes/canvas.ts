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
    #canvas.pan-ready { cursor: grab; }
    #canvas.panning { cursor: grabbing; }
    #canvas-inner {
      position: absolute; left: 0; top: 0; width: 10000px; height: 10000px;
      transform-origin: 0 0;
      will-change: transform;
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

    /* Connection anchor — visible on hover, used for shift+drag to connect */
    .note-anchor {
      position: absolute; left: -6px; top: 50%; width: 12px; height: 12px;
      transform: translateY(-50%); border-radius: 50%; background: #7c8aff;
      opacity: 0; cursor: crosshair; transition: opacity 0.15s;
      box-shadow: 0 0 0 2px #0a0a0f;
    }
    .note:hover .note-anchor { opacity: 1; }

    /* Connection SVG layer — inside canvas-inner so it pans/zooms together */
    #conn-layer {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; overflow: visible;
    }
    #conn-layer .conn-line {
      stroke: #3a3a55; stroke-width: 2; fill: none;
      pointer-events: stroke; cursor: pointer;
      transition: stroke 0.15s, stroke-width 0.15s;
    }
    #conn-layer .conn-hit {
      stroke: transparent; stroke-width: 14; fill: none;
      pointer-events: stroke; cursor: pointer;
    }
    #conn-layer g.conn:hover .conn-line { stroke: #f77; stroke-width: 3; }
    #conn-layer g.conn:hover .conn-arrow { fill: #f77; }
    #conn-layer .conn-arrow { fill: #3a3a55; transition: fill 0.15s; }
    #conn-layer .conn-preview {
      stroke: #7c8aff; stroke-width: 2; fill: none;
      stroke-dasharray: 6 4; pointer-events: none;
    }

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
      <svg id="conn-layer" width="10000" height="10000" viewBox="0 0 10000 10000" preserveAspectRatio="none"></svg>
      <div id="empty-state">
        <h2>Click anywhere to create a note</h2>
        <p>Double-click to edit &middot; Drag to move &middot; Space+drag to pan &middot; Ctrl+scroll to zoom &middot; Shift-drag from a note's left anchor to connect</p>
      </div>
    </div>
  </div>

  <div id="statusbar">
    <span><span class="status-dot"></span> Connected</span>
    <span id="statusNotes">0 notes</span>
    <span id="statusSaved">Saved</span>
    <span id="statusZoom" style="margin-left:auto;font-variant-numeric:tabular-nums">100%</span>
    <span id="statusCoords" style="font-variant-numeric:tabular-nums;min-width:140px;text-align:right">0, 0</span>
  </div>

  <div id="context-menu">
    <div class="ctx-item" onclick="pinSelectedNote()">📌 Pin / Unpin</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item danger" onclick="deleteSelectedNote()">🗑 Delete</div>
  </div>

  <script>
    const API = '';
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 3;
    const NOTE_W = 280;
    const NOTE_H_EST = 80;
    let projectId = null;
    let notesMap = new Map();
    let connMap = new Map();
    let dragState = null;
    let panState = null;
    let connectState = null;
    let spaceHeld = false;
    let editingNoteId = null;
    let contextNoteId = null;
    let saveTimers = new Map();
    let viewport = { x: 0, y: 0, zoom: 1 };
    let lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const canvasEl = document.getElementById('canvas');
    const innerEl = document.getElementById('canvas-inner');
    const connLayer = document.getElementById('conn-layer');
    const emptyState = document.getElementById('empty-state');
    const ctxMenu = document.getElementById('context-menu');
    const zoomEl = document.getElementById('statusZoom');
    const coordsEl = document.getElementById('statusCoords');

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function applyViewport() {
      innerEl.style.transform = 'translate(' + viewport.x + 'px,' + viewport.y + 'px) scale(' + viewport.zoom + ')';
      zoomEl.textContent = Math.round(viewport.zoom * 100) + '%';
    }

    function screenToWorld(sx, sy) {
      const rect = canvasEl.getBoundingClientRect();
      return {
        x: (sx - rect.left - viewport.x) / viewport.zoom,
        y: (sy - rect.top - viewport.y) / viewport.zoom,
      };
    }

    function zoomAt(screenX, screenY, newZoom) {
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      const rect = canvasEl.getBoundingClientRect();
      const cx = screenX - rect.left;
      const cy = screenY - rect.top;
      const wx = (cx - viewport.x) / viewport.zoom;
      const wy = (cy - viewport.y) / viewport.zoom;
      viewport.zoom = newZoom;
      viewport.x = cx - wx * newZoom;
      viewport.y = cy - wy * newZoom;
      applyViewport();
    }

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
      const [notesRes, connsRes] = await Promise.all([
        fetch(API + '/api/projects/' + projectId + '/notes'),
        fetch(API + '/api/projects/' + projectId + '/connections'),
      ]);
      const notesData = await notesRes.json();
      const connsData = await connsRes.json();

      // Clear existing
      document.querySelectorAll('.note').forEach(el => el.remove());
      notesMap.clear();
      connMap.clear();

      notesData.notes.forEach(n => {
        notesMap.set(n.id, n);
        renderNote(n);
      });
      (connsData.connections || []).forEach(c => connMap.set(c.id, c));

      redrawConnections();
      updateCounts();
    }

    function noteCenter(note) {
      const el = document.getElementById('note-' + note.id);
      const h = el ? el.offsetHeight : NOTE_H_EST;
      return { x: note.position_x + NOTE_W / 2, y: note.position_y + h / 2 };
    }

    function noteRectEdgePoint(note, towardX, towardY) {
      const el = document.getElementById('note-' + note.id);
      const h = el ? el.offsetHeight : NOTE_H_EST;
      const cx = note.position_x + NOTE_W / 2;
      const cy = note.position_y + h / 2;
      const dx = towardX - cx;
      const dy = towardY - cy;
      if (dx === 0 && dy === 0) return { x: cx, y: cy };
      const halfW = NOTE_W / 2;
      const halfH = h / 2;
      const scale = Math.min(halfW / Math.abs(dx || 1), halfH / Math.abs(dy || 1));
      return { x: cx + dx * scale, y: cy + dy * scale };
    }

    function redrawConnections() {
      while (connLayer.firstChild) connLayer.removeChild(connLayer.firstChild);
      connMap.forEach(c => {
        const src = notesMap.get(c.source_note_id);
        const dst = notesMap.get(c.target_note_id);
        if (!src || !dst) return;
        const srcCenter = noteCenter(src);
        const dstCenter = noteCenter(dst);
        const a = noteRectEdgePoint(src, dstCenter.x, dstCenter.y);
        const b = noteRectEdgePoint(dst, srcCenter.x, srcCenter.y);

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        // Perpendicular offset for a gentle curve
        const curve = Math.min(80, dist * 0.25);
        const nx = -dy / dist;
        const ny = dx / dist;
        const mx = (a.x + b.x) / 2 + nx * curve;
        const my = (a.y + b.y) / 2 + ny * curve;
        const d = 'M ' + a.x + ' ' + a.y + ' Q ' + mx + ' ' + my + ' ' + b.x + ' ' + b.y;

        // Arrow head — triangle pointing at b, tangent direction approximated from (mx,my)->b
        const tdx = b.x - mx;
        const tdy = b.y - my;
        const tlen = Math.hypot(tdx, tdy) || 1;
        const ux = tdx / tlen;
        const uy = tdy / tlen;
        const size = 10;
        const base = 6;
        const tipX = b.x;
        const tipY = b.y;
        const leftX = tipX - ux * size - uy * base;
        const leftY = tipY - uy * size + ux * base;
        const rightX = tipX - ux * size + uy * base;
        const rightY = tipY - uy * size - ux * base;
        const arrowPoints = tipX + ',' + tipY + ' ' + leftX + ',' + leftY + ' ' + rightX + ',' + rightY;

        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('class', 'conn');
        g.dataset.connId = c.id;

        const hit = document.createElementNS(SVG_NS, 'path');
        hit.setAttribute('class', 'conn-hit');
        hit.setAttribute('d', d);
        g.appendChild(hit);

        const line = document.createElementNS(SVG_NS, 'path');
        line.setAttribute('class', 'conn-line');
        line.setAttribute('d', d);
        g.appendChild(line);

        const arrow = document.createElementNS(SVG_NS, 'polygon');
        arrow.setAttribute('class', 'conn-arrow');
        arrow.setAttribute('points', arrowPoints);
        g.appendChild(arrow);

        g.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!confirm('Delete this connection?')) return;
          deleteConnection(c.id);
        });

        connLayer.appendChild(g);
      });
    }

    async function createConnection(sourceId, targetId) {
      const res = await fetch(API + '/api/projects/' + projectId + '/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_note_id: sourceId, target_note_id: targetId }),
      });
      if (!res.ok) return;
      const c = await res.json();
      connMap.set(c.id, c);
      redrawConnections();
    }

    async function deleteConnection(id) {
      await fetch(API + '/api/connections/' + id, { method: 'DELETE' });
      connMap.delete(id);
      redrawConnections();
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
        '<div class="note-anchor" data-anchor="1"></div>' +
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
      const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
      createNoteAt(center.x - 140, center.y - 30);
    }

    // --- Canvas click to create ---
    canvasEl.addEventListener('click', (e) => {
      if (e.target !== canvasEl && e.target !== innerEl && !e.target.closest('#empty-state')) return;
      closeContextMenu();
      if (editingNoteId) { finishEdit(editingNoteId); return; }
      if (panState && panState.moved) return; // suppress create after pan
      const w = screenToWorld(e.clientX, e.clientY);
      createNoteAt(w.x, w.y);
    });

    // --- Drag ---
    function startDrag(e, noteId) {
      if (editingNoteId === noteId) return;
      if (e.button !== 0) return;
      if (spaceHeld) return; // let canvas-level pan take over

      const isAnchor = e.target && e.target.dataset && e.target.dataset.anchor === '1';
      if (isAnchor || e.shiftKey) {
        startConnectionDrag(e, noteId);
        return;
      }

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

    function startConnectionDrag(e, sourceId) {
      e.preventDefault();
      e.stopPropagation();
      const src = notesMap.get(sourceId);
      if (!src) return;
      const start = noteCenter(src);
      const preview = document.createElementNS(SVG_NS, 'line');
      preview.setAttribute('class', 'conn-preview');
      preview.setAttribute('x1', start.x);
      preview.setAttribute('y1', start.y);
      preview.setAttribute('x2', start.x);
      preview.setAttribute('y2', start.y);
      connLayer.appendChild(preview);
      connectState = { sourceId, preview, start };
    }

    document.addEventListener('mousemove', (e) => {
      lastPointer.x = e.clientX; lastPointer.y = e.clientY;
      if (panState) {
        const dx = e.clientX - panState.startX;
        const dy = e.clientY - panState.startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) panState.moved = true;
        viewport.x = panState.origX + dx;
        viewport.y = panState.origY + dy;
        applyViewport();
        coordsEl.textContent = Math.round(-viewport.x / viewport.zoom) + ', ' + Math.round(-viewport.y / viewport.zoom);
        return;
      }
      if (connectState) {
        const w = screenToWorld(e.clientX, e.clientY);
        connectState.preview.setAttribute('x2', w.x);
        connectState.preview.setAttribute('y2', w.y);
        return;
      }
      if (!dragState) {
        const w = screenToWorld(e.clientX, e.clientY);
        coordsEl.textContent = Math.round(w.x) + ', ' + Math.round(w.y);
        return;
      }
      const dx = (e.clientX - dragState.startX) / viewport.zoom;
      const dy = (e.clientY - dragState.startY) / viewport.zoom;
      const el = document.getElementById('note-' + dragState.noteId);
      const newX = dragState.origX + dx;
      const newY = dragState.origY + dy;
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';

      // Live-update any connections touching this note
      const note = notesMap.get(dragState.noteId);
      if (note) { note.position_x = newX; note.position_y = newY; redrawConnections(); }
    });

    document.addEventListener('mouseup', (e) => {
      if (panState) {
        canvasEl.classList.remove('panning');
        if (spaceHeld) canvasEl.classList.add('pan-ready');
        setTimeout(() => { panState = null; }, 0);
        return;
      }
      if (connectState) {
        const targetEl = e.target && e.target.closest ? e.target.closest('.note') : null;
        const targetId = targetEl ? targetEl.dataset.noteId : null;
        connectState.preview.remove();
        if (targetId && targetId !== connectState.sourceId) {
          createConnection(connectState.sourceId, targetId);
        }
        connectState = null;
        return;
      }
      if (!dragState) return;
      const el = document.getElementById('note-' + dragState.noteId);
      el.classList.remove('dragging');

      const dx = (e.clientX - dragState.startX) / viewport.zoom;
      const dy = (e.clientY - dragState.startY) / viewport.zoom;
      const newX = dragState.origX + dx;
      const newY = dragState.origY + dy;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        const note = notesMap.get(dragState.noteId);
        note.position_x = newX;
        note.position_y = newY;
        saveNote(dragState.noteId, { position_x: newX, position_y: newY });
        redrawConnections();
      }

      dragState = null;
    });

    // --- Pan + zoom ---
    function startPan(e) {
      e.preventDefault();
      canvasEl.classList.remove('pan-ready');
      canvasEl.classList.add('panning');
      panState = {
        startX: e.clientX, startY: e.clientY,
        origX: viewport.x, origY: viewport.y,
        moved: false,
      };
    }

    canvasEl.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && spaceHeld)) startPan(e);
    });

    canvasEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomAt(e.clientX, e.clientY, viewport.zoom * factor);
      } else {
        viewport.x -= e.deltaX;
        viewport.y -= e.deltaY;
        applyViewport();
      }
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !editingNoteId && !spaceHeld) {
        spaceHeld = true;
        canvasEl.classList.add('pan-ready');
        e.preventDefault();
      }
      if (editingNoteId) return;
      const rect = canvasEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); zoomAt(cx, cy, viewport.zoom * 1.2);
      } else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); zoomAt(cx, cy, viewport.zoom / 1.2);
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        viewport = { x: 0, y: 0, zoom: 1 };
        applyViewport();
      } else if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const w = screenToWorld(lastPointer.x, lastPointer.y);
        createNoteAt(w.x - NOTE_W / 2, w.y - NOTE_H_EST / 2);
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        spaceHeld = false;
        canvasEl.classList.remove('pan-ready');
      }
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
        const tagMatches = content.match(/#([\\p{L}\\p{N}_]+)/gu);
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
      // Server cascade-deletes connections; clean up our local map too
      connMap.forEach((c, id) => {
        if (c.source_note_id === contextNoteId || c.target_note_id === contextNoteId) {
          connMap.delete(id);
        }
      });
      redrawConnections();
      updateCounts();
      closeContextMenu();
    }

    // --- Keyboard ---
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (editingNoteId) finishEdit(editingNoteId);
        if (connectState) {
          connectState.preview.remove();
          connectState = null;
        }
        closeContextMenu();
      }
    });

    // --- Start ---
    applyViewport();
    init();
  </script>
</body>
</html>`,
  );
});

export { canvas };
