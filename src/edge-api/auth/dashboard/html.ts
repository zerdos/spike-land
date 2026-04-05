export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildStyles(): string {
  return `<style>
:root{
  --bg:#06100c;
  --surface-1:rgba(14,28,22,.92);
  --surface-2:rgba(18,36,28,.88);
  --surface-3:rgba(10,20,16,.95);
  --border:rgba(130,249,200,.1);
  --border-hover:rgba(130,249,200,.22);
  --text:#e9f8ef;
  --text-2:#c4ddd0;
  --muted:#7a9e8e;
  --accent:#82f9c8;
  --accent-dim:rgba(130,249,200,.15);
  --warn:#f7c86a;
  --warn-dim:rgba(247,200,106,.15);
  --danger:#ff7b72;
  --danger-dim:rgba(255,123,114,.15);
  --radius:20px;
  --radius-sm:14px;
  --radius-xs:10px;
}
*{box-sizing:border-box;margin:0}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slide-in{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes slide-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
html{
  background:var(--bg);
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(130,249,200,.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 5%, rgba(102,173,255,.05) 0%, transparent 50%);
  background-attachment:fixed;
}
body{
  min-height:100vh;
  color:var(--text);
  font-family:"Rubik",system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit;text-decoration:none}
button{cursor:pointer;font-family:inherit}

/* ── Impersonation banner ── */
.impersonate-banner{
  position:fixed;top:0;left:0;right:0;z-index:9999;
  display:none;align-items:center;justify-content:center;gap:12px;
  padding:10px 20px;
  background:var(--warn);color:#1a1000;
  font-size:.82rem;font-weight:700;
}
.impersonate-banner.active{display:flex}
.impersonate-banner button{
  padding:4px 12px;border-radius:999px;border:2px solid rgba(0,0,0,.3);
  background:transparent;color:#1a1000;font-weight:800;font-size:.78rem;
  transition:background .15s;
}
.impersonate-banner button:hover{background:rgba(0,0,0,.12)}

/* ── Topbar ── */
.topbar{
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:16px 24px;
  background:rgba(6,16,12,.85);
  backdrop-filter:blur(20px) saturate(1.4);
  border-bottom:1px solid var(--border);
  transition:top .2s;
}
.topbar-brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:.95rem;letter-spacing:-.01em}
.topbar-brand svg{width:22px;height:22px;fill:var(--accent)}
.topbar-brand span{color:var(--accent)}
.topbar-right{display:flex;align-items:center;gap:10px}
.topbar-link{
  padding:6px 12px;border-radius:999px;border:1px solid var(--border);
  color:var(--muted);font-family:"JetBrains Mono",monospace;font-size:.72rem;font-weight:600;
  transition:all .2s;
}
.topbar-link:hover{border-color:var(--border-hover);color:var(--text-2)}
.avatar{
  display:flex;align-items:center;gap:8px;
  padding:5px 10px 5px 5px;border-radius:999px;
  border:1px solid var(--border);
  font-size:.82rem;font-weight:600;color:var(--text-2);
}
.avatar-img{width:28px;height:28px;border-radius:50%;object-fit:cover}
.avatar-fallback{
  width:28px;height:28px;border-radius:50%;
  background:var(--accent-dim);color:var(--accent);
  display:flex;align-items:center;justify-content:center;
  font-size:.78rem;font-weight:800;
}

/* ── Shell ── */
.shell{max-width:1400px;margin:0 auto;padding:0 24px 80px}

/* ── Tabs ── */
.tab-row{
  display:flex;gap:2px;padding:20px 0 0;
  border-bottom:1px solid var(--border);
  margin-bottom:24px;
  animation:fade-up .5s ease-out;
  overflow-x:auto;scrollbar-width:none;
}
.tab-row::-webkit-scrollbar{display:none}
.tab{
  display:flex;align-items:center;gap:6px;
  padding:10px 16px;border:none;background:none;
  color:var(--muted);font-family:inherit;font-size:.83rem;font-weight:600;
  cursor:pointer;border-bottom:2px solid transparent;
  transition:all .2s;margin-bottom:-1px;white-space:nowrap;
}
.tab:hover{color:var(--text-2)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.tab-count{
  display:inline-flex;align-items:center;justify-content:center;
  min-width:18px;height:18px;padding:0 5px;border-radius:999px;
  background:var(--accent-dim);color:var(--accent);
  font-size:.68rem;font-weight:800;font-family:"JetBrains Mono",monospace;
}

/* ── Content area ── */
.tab-content{animation:fade-up .4s ease-out}

/* ── Bento cards ── */
.bento{
  display:grid;grid-template-columns:repeat(4,1fr);gap:12px;
  margin-bottom:16px;
}
.bento-card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:20px;position:relative;overflow:hidden;transition:border-color .25s;
}
.bento-card:hover{border-color:var(--border-hover)}
.bento-card::after{
  content:"";position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(180deg, rgba(130,249,200,.03) 0%, transparent 50%);pointer-events:none;
}
.bento-label{display:block;color:var(--muted);font-size:.72rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
.bento-value{display:block;font-size:1.7rem;font-weight:800;letter-spacing:-.04em;line-height:1}
.bento-hint{display:block;margin-top:8px;color:var(--muted);font-size:.82rem}

/* ── Section titles ── */
.section-title{
  font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--muted);margin:24px 0 12px;
}

/* ── Cards ── */
.card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:20px;transition:border-color .25s;margin-bottom:16px;
}
.card:hover{border-color:var(--border-hover)}
.card h3{font-size:.95rem;font-weight:700;margin-bottom:16px;letter-spacing:-.01em}
.data-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;margin-bottom:16px}

/* ── Tables ── */
.table-wrap{overflow-x:auto;margin-bottom:16px;border-radius:var(--radius);border:1px solid var(--border)}
.table{width:100%;border-collapse:collapse;font-size:.85rem}
.table thead{position:sticky;top:0;z-index:10;background:var(--surface-3)}
.table th{
  padding:12px 16px;text-align:left;font-size:.72rem;font-weight:700;
  letter-spacing:.1em;text-transform:uppercase;color:var(--muted);
  border-bottom:1px solid var(--border);white-space:nowrap;
}
.table th.check-col,.table td.check-col{padding:12px 8px 12px 16px;width:40px}
.table td{
  padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.04);
  color:var(--text-2);vertical-align:middle;
}
.table tr:last-child td{border-bottom:none}
.table tbody tr:hover td{background:rgba(130,249,200,.025)}
.table .mono{font-family:"JetBrains Mono",monospace;font-size:.78rem}
.table .truncate{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── Checkboxes ── */
.checkbox{
  appearance:none;-webkit-appearance:none;
  width:16px;height:16px;border-radius:5px;
  border:1.5px solid rgba(130,249,200,.3);background:transparent;
  cursor:pointer;position:relative;transition:all .15s;flex-shrink:0;
}
.checkbox:checked{
  background:var(--accent);border-color:var(--accent);
}
.checkbox:checked::after{
  content:"";position:absolute;left:4px;top:1px;
  width:5px;height:9px;
  border:2px solid var(--bg);border-top:none;border-left:none;
  transform:rotate(45deg);
}
.checkbox:indeterminate{background:var(--accent-dim);border-color:var(--accent)}
.checkbox:indeterminate::after{
  content:"";position:absolute;left:3px;top:6px;
  width:8px;height:2px;background:var(--accent);border-radius:1px;
}

/* ── Form controls ── */
.search-input{
  width:100%;padding:10px 14px;
  background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--radius-xs);
  color:var(--text);font-family:inherit;font-size:.88rem;
  outline:none;transition:border-color .2s;
}
.search-input:focus{border-color:var(--border-hover)}
.search-input::placeholder{color:var(--muted)}
.dropdown{
  padding:8px 12px;
  background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--radius-xs);
  color:var(--text-2);font-family:inherit;font-size:.83rem;
  outline:none;cursor:pointer;transition:border-color .2s;
}
.dropdown:focus{border-color:var(--border-hover)}
.dropdown option{background:#0e1c16}

/* ── Badges ── */
.badge{
  display:inline-flex;align-items:center;
  padding:2px 8px;border-radius:999px;
  font-size:.68rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
}
.badge-user{background:rgba(196,221,208,.12);color:var(--text-2)}
.badge-admin{background:rgba(130,249,200,.15);color:var(--accent)}
.badge-super_admin{background:var(--danger-dim);color:var(--danger)}
.badge-free{background:rgba(196,221,208,.1);color:var(--muted)}
.badge-pro{background:var(--accent-dim);color:var(--accent)}
.badge-enterprise{background:rgba(247,200,106,.12);color:var(--warn)}
.badge-info{background:var(--accent-dim);color:var(--accent)}
.badge-warn{background:var(--warn-dim);color:var(--warn)}
.badge-danger{background:var(--danger-dim);color:var(--danger)}

/* ── Status dot ── */
.status-dot{
  display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;
}
.status-dot.ok{background:var(--accent)}
.status-dot.warn{background:var(--warn)}
.status-dot.error{background:var(--danger);animation:pulse 1.5s ease-in-out infinite}

/* ── Buttons ── */
.btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 14px;border-radius:var(--radius-xs);border:1px solid var(--border);
  background:transparent;color:var(--text-2);font-family:inherit;font-size:.8rem;font-weight:600;
  cursor:pointer;transition:all .15s;white-space:nowrap;
}
.btn:hover{border-color:var(--border-hover);color:var(--text)}
.btn-primary{background:var(--accent-dim);border-color:var(--accent);color:var(--accent)}
.btn-primary:hover{background:rgba(130,249,200,.25)}
.btn-danger{background:var(--danger-dim);border-color:var(--danger);color:var(--danger)}
.btn-danger:hover{background:rgba(255,123,114,.25)}
.btn-warn{background:var(--warn-dim);border-color:var(--warn);color:var(--warn)}
.btn-warn:hover{background:rgba(247,200,106,.25)}
.btn-sm{padding:4px 10px;font-size:.74rem}
.btn:disabled{opacity:.4;cursor:not-allowed}

/* ── Bulk action bar ── */
.bulk-bar{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
  z-index:200;
  display:none;align-items:center;gap:12px;
  padding:12px 20px;border-radius:var(--radius);
  background:var(--surface-2);border:1px solid var(--border-hover);
  backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,.6);
  animation:slide-up .25s ease-out;
  white-space:nowrap;
}
.bulk-bar.active{display:flex}
.bulk-count{font-weight:700;font-size:.88rem;color:var(--accent)}
.bulk-divider{width:1px;height:20px;background:var(--border)}

/* ── Toast ── */
.toast-container{position:fixed;bottom:24px;right:24px;z-index:9000;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{
  display:flex;align-items:center;gap:10px;
  padding:12px 16px;border-radius:var(--radius-sm);
  background:var(--surface-2);border:1px solid var(--border);
  font-size:.85rem;font-weight:500;color:var(--text);
  box-shadow:0 4px 16px rgba(0,0,0,.5);
  pointer-events:auto;
  animation:slide-in .25s ease-out;
  min-width:240px;max-width:360px;
}
.toast.success{border-color:rgba(130,249,200,.35);background:rgba(14,28,22,.97)}
.toast.error{border-color:rgba(255,123,114,.35);background:rgba(24,14,12,.97)}
.toast-icon{font-size:1rem;flex-shrink:0}
.toast-close{margin-left:auto;background:none;border:none;color:var(--muted);font-size:.9rem;cursor:pointer;padding:0 2px}
@keyframes toast-out{to{opacity:0;transform:translateX(16px)}}
.toast.removing{animation:toast-out .2s ease-in forwards}

/* ── Modal ── */
.modal-overlay{
  position:fixed;inset:0;z-index:8000;
  background:rgba(6,16,12,.85);backdrop-filter:blur(8px);
  display:none;align-items:center;justify-content:center;
  padding:20px;
}
.modal-overlay.active{display:flex}
.modal{
  background:var(--surface-2);border:1px solid var(--border-hover);
  border-radius:var(--radius);padding:28px;max-width:440px;width:100%;
  box-shadow:0 16px 48px rgba(0,0,0,.7);
  animation:slide-up .2s ease-out;
}
.modal h2{font-size:1.1rem;font-weight:700;margin-bottom:10px}
.modal p{color:var(--text-2);font-size:.88rem;line-height:1.6;margin-bottom:20px}
.modal-actions{display:flex;gap:10px;justify-content:flex-end}

/* ── Toolbar row ── */
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
.toolbar .search-input{flex:1;min-width:180px}

/* ── Pagination ── */
.pagination{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:.83rem;color:var(--muted)}
.pagination .btn-sm{font-size:.78rem}
.page-info{font-family:"JetBrains Mono",monospace;font-size:.78rem}

/* ── Loading / empty ── */
.loading{display:flex;align-items:center;justify-content:center;padding:60px 0;gap:12px;color:var(--muted)}
.spinner{width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:999px;animation:spin .8s linear infinite}
.empty{text-align:center;padding:48px 0;color:var(--muted);font-size:.9rem}

/* ── Chart ── */
.chart-card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:20px;margin-bottom:16px;
}
.chart-card h3{font-size:.95rem;font-weight:700;margin-bottom:14px;letter-spacing:-.01em}
.chart-container{height:200px;position:relative}
.chart-svg{width:100%;height:100%;display:block}

/* ── Data rows ── */
.data-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);
  font-size:.85rem;
}
.data-row:last-child{border-bottom:none}
.data-row-label{color:var(--text-2)}
.data-row-value{font-weight:700;font-family:"JetBrains Mono",monospace;font-size:.82rem}
.data-bar{height:4px;border-radius:2px;background:var(--accent-dim);margin-top:4px;position:relative;overflow:hidden}
.data-bar-fill{height:100%;border-radius:2px;background:var(--accent);transition:width .4s ease-out}

/* ── Audit log ── */
.audit-entry{
  display:flex;gap:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04);
  font-size:.85rem;position:relative;
}
.audit-entry:last-child{border-bottom:none}
.audit-timeline{flex-shrink:0;width:3px;border-radius:2px;background:var(--accent-dim);align-self:stretch;min-height:20px}
.audit-timeline.warn{background:var(--warn)}
.audit-timeline.danger{background:var(--danger)}
.audit-body{flex:1;min-width:0}
.audit-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}
.audit-time{color:var(--muted);font-family:"JetBrains Mono",monospace;font-size:.75rem;flex-shrink:0}
.audit-actor{font-weight:700;color:var(--text)}
.audit-action{color:var(--text-2)}
.audit-target{color:var(--accent);font-family:"JetBrains Mono",monospace;font-size:.8rem}
.audit-details{
  margin-top:8px;padding:8px 12px;border-radius:var(--radius-xs);
  background:rgba(0,0,0,.25);font-family:"JetBrains Mono",monospace;font-size:.75rem;
  color:var(--muted);display:none;white-space:pre-wrap;word-break:break-all;
}
.audit-details.open{display:block}
.expand-btn{
  background:none;border:1px solid var(--border);border-radius:var(--radius-xs);
  color:var(--muted);font-size:.7rem;font-family:inherit;font-weight:600;
  padding:2px 8px;cursor:pointer;transition:all .15s;
}
.expand-btn:hover{border-color:var(--border-hover);color:var(--text-2)}

/* ── Org cards ── */
.org-card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:20px;transition:border-color .25s;cursor:pointer;
}
.org-card:hover{border-color:var(--border-hover)}
.org-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px}
.org-name{font-size:1rem;font-weight:700}
.org-slug{color:var(--muted);font-size:.8rem;font-family:"JetBrains Mono",monospace}
.org-meta{display:flex;gap:12px;font-size:.82rem;color:var(--muted);margin-top:10px;flex-wrap:wrap}
.org-expand{margin-top:14px;border-top:1px solid var(--border);padding-top:14px;display:none}
.org-expand.open{display:block}

/* ── Security anomaly cards ── */
.anomaly-card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:16px 20px;margin-bottom:10px;
}
.anomaly-card.warn-card{border-color:rgba(247,200,106,.2);background:rgba(247,200,106,.05)}
.anomaly-card.danger-card{border-color:rgba(255,123,114,.2);background:rgba(255,123,114,.05)}
.anomaly-title{font-weight:700;font-size:.9rem;margin-bottom:4px}
.anomaly-desc{color:var(--text-2);font-size:.82rem}
.anomaly-ips{margin-top:8px;font-family:"JetBrains Mono",monospace;font-size:.75rem;color:var(--muted)}

/* ── System metrics ── */
.metric-card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:16px 20px;display:flex;align-items:center;gap:14px;
}
.metric-value{font-size:1.4rem;font-weight:800;letter-spacing:-.04em;font-family:"JetBrains Mono",monospace}
.metric-label{color:var(--muted);font-size:.78rem;margin-top:2px}

/* ── Footer ── */
.footer{
  margin-top:32px;padding-top:20px;border-top:1px solid var(--border);
  color:var(--muted);font-size:.78rem;display:flex;flex-wrap:wrap;
  justify-content:space-between;gap:12px;
}
.footer a{color:var(--accent);font-weight:600}
.footer a:hover{text-decoration:underline}

@media(max-width:1080px){.bento{grid-template-columns:repeat(2,1fr)}}
@media(max-width:720px){
  .shell{padding:0 14px 56px}
  .topbar{padding:12px 14px}
  .bento{grid-template-columns:1fr 1fr}
  .data-grid{grid-template-columns:1fr}
  .tab{padding:8px 10px;font-size:.78rem}
  .bulk-bar{left:12px;right:12px;transform:none;flex-wrap:wrap}
}
@media(max-width:420px){
  .bento{grid-template-columns:1fr}
  .topbar-link{display:none}
}
</style>`;
}

// ── HTML shell ────────────────────────────────────────────────────────────────

function buildHtmlShell(
  avatarHtml: string,
  safeName: string,
  safeRole: string,
  safeEmail: string,
): string {
  return `
<!-- Impersonation banner -->
<div class="impersonate-banner" id="impersonate-banner">
  <span>Viewing as <strong id="impersonate-name"></strong> (<span id="impersonate-email"></span>)</span>
  <button onclick="stopImpersonation()">Stop</button>
</div>

<!-- Top bar -->
<nav class="topbar" id="topbar">
  <div class="topbar-brand">
    <svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/></svg>
    <span>spike.land <span>admin</span></span>
  </div>
  <div class="topbar-right">
    <div class="avatar">
      ${avatarHtml}
      <span>${safeName}</span>
      <span class="badge badge-${safeRole}">${safeRole}</span>
    </div>
    <a class="topbar-link" href="https://spike.land" target="_blank" rel="noopener">spike.land</a>
  </div>
</nav>

<main class="shell">
  <div id="tab-row-container"></div>
  <div id="app" class="tab-content">
    <div class="loading"><div class="spinner"></div><span>Loading dashboard...</span></div>
  </div>
  <footer class="footer">
    <span>Superadmin dashboard · ${safeEmail}</span>
    <a href="/dashboard/api/stats">JSON API</a>
  </footer>
</main>

<!-- Bulk action bar -->
<div class="bulk-bar" id="bulk-bar">
  <span class="bulk-count" id="bulk-count">0 selected</span>
  <div class="bulk-divider"></div>
  <div id="bulk-actions"></div>
</div>

<!-- Toast container -->
<div class="toast-container" id="toast-container"></div>

<!-- Confirmation modal -->
<div class="modal-overlay" id="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <h2 id="modal-title">Confirm action</h2>
    <p id="modal-body">Are you sure?</p>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" id="modal-confirm" onclick="">Confirm</button>
    </div>
  </div>
</div>`;
}

// ── Client-side script ────────────────────────────────────────────────────────

function buildScript(): string {
  return `<script>
(function(){
'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const TABS = ['overview','users','sessions','organizations','api-keys','audit-log','security','system','export'];
const TAB_LABELS = {
  'overview':'Overview','users':'Users','sessions':'Sessions',
  'organizations':'Organizations','api-keys':'API Keys',
  'audit-log':'Audit Log','security':'Security','system':'System','export':'Export'
};
const TAB_COUNTS = {};

let currentTab = (location.hash.slice(1) || 'overview');
if (!TABS.includes(currentTab)) currentTab = 'overview';

let impersonateUserId = null;
let selectedIds = new Set();
let modalConfirmFn = null;

// Pagination state per tab
const pages = { users: 1, sessions: 1, 'audit-log': 1 };
const totals = { users: 0, sessions: 0, 'audit-log': 0 };
const LIMIT = 25;

// Filters
let userSearch = '', userRole = '';
let auditAction = '';
let searchTimer = null;

// ── Shared inline style fragments ─────────────────────────────────────────
const S_BOLD       = 'font-weight:600';
const S_MUTED_MONO = 'color:var(--muted);font-size:.78rem;font-family:\\'JetBrains Mono\\',monospace';
const S_MUTED_SM   = 'color:var(--muted);font-size:.82rem';

// ── Loading / error fragments ──────────────────────────────────────────────
function loadingHtml(label) {
  return '<div class="loading"><div class="spinner"></div><span>'+esc(label)+'</span></div>';
}
function errorHtml(msg) {
  return '<div class="empty">'+esc(msg)+'</div>';
}

// ── Utilities ─────────────────────────────────────────────────────────────
const $ = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => (ctx || document).querySelectorAll(sel);
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}
function fmt(n, d) { return n == null ? '—' : Number(n).toLocaleString(undefined,{maximumFractionDigits:d||0}); }
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function fmtTime(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}
function relTime(s) {
  if (!s) return '—';
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1) return 'just now';
  if (m < 60) return m+'m ago';
  const h = Math.floor(m/60);
  if (h < 24) return h+'h ago';
  return Math.floor(h/24)+'d ago';
}

// ── API helper ────────────────────────────────────────────────────────────
async function fetchApi(path, opts) {
  const headers = Object.assign({'Content-Type':'application/json'}, opts && opts.headers);
  if (impersonateUserId) headers['X-Impersonate-User'] = impersonateUserId;
  const res = await fetch(path, Object.assign({credentials:'include'}, opts, {headers}));
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || 'HTTP '+res.status);
  }
  return res.json();
}

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(msg, type) {
  const container = $('#toast-container');
  const el = document.createElement('div');
  el.className = 'toast '+(type||'success');
  el.innerHTML = '<span class="toast-icon">'+(type==='error'?'✕':'✓')+'</span>'
    +'<span>'+esc(msg)+'</span>'
    +'<button class="toast-close" onclick="this.closest(\\'.toast\\').remove()">✕</button>';
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 200);
  }, 3000);
}

// ── Modal ─────────────────────────────────────────────────────────────────
function openModal(title, body, onConfirm, danger) {
  $('#modal-title').textContent = title;
  $('#modal-body').textContent = body;
  const btn = $('#modal-confirm');
  btn.className = 'btn '+(danger !== false ? 'btn-danger' : 'btn-primary');
  btn.textContent = danger !== false ? 'Confirm' : 'OK';
  modalConfirmFn = onConfirm;
  btn.onclick = () => { closeModal(); if (modalConfirmFn) modalConfirmFn(); };
  $('#modal-overlay').classList.add('active');
}
function closeModal() { $('#modal-overlay').classList.remove('active'); }

// ── Impersonation ─────────────────────────────────────────────────────────
function startImpersonation(id, name, email) {
  impersonateUserId = id;
  $('#impersonate-banner').classList.add('active');
  $('#impersonate-name').textContent = name;
  $('#impersonate-email').textContent = email;
  $('#topbar').style.top = '42px';
  toast('Now viewing as '+name, 'success');
}
function stopImpersonation() {
  impersonateUserId = null;
  $('#impersonate-banner').classList.remove('active');
  $('#topbar').style.top = '';
  toast('Impersonation ended');
}
window.stopImpersonation = stopImpersonation;

// ── Selection / bulk ──────────────────────────────────────────────────────
function toggleId(id) {
  if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id);
  updateBulkBar();
}
function clearSelection() { selectedIds.clear(); updateBulkBar(); }
function updateBulkBar() {
  const bar = $('#bulk-bar');
  if (selectedIds.size === 0) { bar.classList.remove('active'); return; }
  bar.classList.add('active');
  $('#bulk-count').textContent = selectedIds.size+' selected';
}
function syncCheckboxes(allIds) {
  const all = selectedIds.size > 0 && allIds.every(id => selectedIds.has(id));
  const partial = selectedIds.size > 0 && allIds.some(id => selectedIds.has(id)) && !all;
  const headerCb = $('#header-checkbox');
  if (headerCb) { headerCb.checked = all; headerCb.indeterminate = partial; }
  allIds.forEach(id => {
    const cb = $('[data-id="'+id+'"]');
    if (cb) cb.checked = selectedIds.has(id);
  });
}

// ── Tab rendering ─────────────────────────────────────────────────────────
function buildTabRow() {
  const html = '<div class="tab-row">'+TABS.map(t =>
    '<button class="tab'+(t===currentTab?' active':'')+'" data-tab="'+t+'">'
    +TAB_LABELS[t]
    +(TAB_COUNTS[t] != null ? '<span class="tab-count">'+TAB_COUNTS[t]+'</span>' : '')
    +'</button>'
  ).join('')+'</div>';
  $('#tab-row-container').innerHTML = html;
  $$('.tab').forEach(btn => {
    btn.onclick = () => {
      currentTab = btn.dataset.tab;
      location.hash = currentTab;
      clearSelection();
      loadTab(currentTab);
    };
  });
}

// ── Overview tab ──────────────────────────────────────────────────────────
async function loadOverview() {
  $('#app').innerHTML = loadingHtml('Loading overview...');
  try {
    const stats = await fetchApi('/dashboard/api/stats');
    TAB_COUNTS['users'] = stats.totalUsers;
    TAB_COUNTS['sessions'] = stats.activeSessions;
    buildTabRow();

    let html = '<section class="bento">';
    html += bentoCard('Total Users', fmt(stats.totalUsers), 'registered accounts');
    html += bentoCard('Active Sessions', fmt(stats.activeSessions), 'non-expired');
    html += bentoCard('Signups Today', fmt(stats.signupsToday), 'last 24h');
    html += bentoCard('Verified Users', fmt(stats.verifiedUsers), 'email confirmed');
    html += '</section>';

    if (stats.signupSeries && stats.signupSeries.length > 1) {
      html += renderSignupChart(stats.signupSeries);
    }

    if (stats.providerBreakdown && stats.providerBreakdown.length) {
      html += '<p class="section-title">Auth Providers</p><div class="data-grid"><div class="card">';
      const maxP = Math.max(1, ...stats.providerBreakdown.map(p => p.count));
      html += stats.providerBreakdown.map(p =>
        '<div class="data-row"><span class="data-row-label">'+esc(p.provider)+'</span>'
        +'<span class="data-row-value">'+fmt(p.count)+'</span></div>'
        +'<div class="data-bar"><div class="data-bar-fill" style="width:'+Math.max(2,(p.count/maxP*100)).toFixed(1)+'%"></div></div>'
      ).join('');
      html += '</div></div>';
    }

    if (stats.roleDistribution && stats.roleDistribution.length) {
      html += '<p class="section-title">Role Distribution</p><div class="data-grid"><div class="card">';
      const maxR = Math.max(1, ...stats.roleDistribution.map(r => r.count));
      html += stats.roleDistribution.map(r =>
        '<div class="data-row"><span class="data-row-label"><span class="badge badge-'+esc(r.role)+'">'+esc(r.role)+'</span></span>'
        +'<span class="data-row-value">'+fmt(r.count)+'</span></div>'
        +'<div class="data-bar"><div class="data-bar-fill" style="width:'+Math.max(2,(r.count/maxR*100)).toFixed(1)+'%"></div></div>'
      ).join('');
      html += '</div></div>';
    }

    $('#app').innerHTML = html;
  } catch(e) {
    $('#app').innerHTML = errorHtml('Failed to load stats: '+e.message);
  }
}

function renderSignupChart(series) {
  const w = 800, h = 180, pad = 32;
  const max = Math.max(1, ...series.map(p => p.count));
  const pts = series.map((p,i) => {
    const x = pad + (i/(series.length-1||1))*(w-pad*2);
    const y = h - pad - (p.count/max)*(h-pad*2);
    return x.toFixed(1)+','+y.toFixed(1);
  });
  const area = pad+','+(h-pad)+' '+pts.join(' ')+' '+(w-pad)+','+(h-pad);
  let svg = '<svg class="chart-svg" viewBox="0 0 '+w+' '+h+'">';
  svg += '<defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">'
    +'<stop offset="0%" stop-color="rgba(130,249,200,.3)"/>'
    +'<stop offset="100%" stop-color="rgba(130,249,200,.02)"/>'
    +'</linearGradient></defs>';
  svg += '<polygon points="'+area+'" fill="url(#sg)"/>';
  svg += '<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>';
  svg += '<text x="'+pad+'" y="'+(pad-6)+'" fill="var(--muted)" font-size="11" font-family="JetBrains Mono">'+fmt(max)+'</text>';
  svg += '<text x="'+pad+'" y="'+(h-pad+14)+'" fill="var(--muted)" font-size="11" font-family="JetBrains Mono">0</text>';
  svg += '<text x="'+pad+'" y="'+(h-6)+'" fill="var(--muted)" font-size="10" font-family="JetBrains Mono">'+esc(series[0].date)+'</text>';
  svg += '<text x="'+(w-pad)+'" y="'+(h-6)+'" fill="var(--muted)" font-size="10" font-family="JetBrains Mono" text-anchor="end">'+esc(series[series.length-1].date)+'</text>';
  svg += '</svg>';
  return '<div class="chart-card"><h3>Signups — Last 30 Days</h3><div class="chart-container">'+svg+'</div></div>';
}

function bentoCard(label, value, hint) {
  return '<div class="bento-card"><span class="bento-label">'+label+'</span>'
    +'<strong class="bento-value">'+value+'</strong>'
    +'<span class="bento-hint">'+hint+'</span></div>';
}

// ── Users tab ─────────────────────────────────────────────────────────────
async function loadUsers(page) {
  page = page || pages.users;
  clearSelection();
  const params = new URLSearchParams({search:userSearch,role:userRole,page:String(page),limit:String(LIMIT)});
  $('#app').innerHTML = loadingHtml('Loading users...');
  try {
    const data = await fetchApi('/dashboard/api/users?'+params.toString());
    pages.users = page;
    totals.users = data.total || 0;
    TAB_COUNTS['users'] = data.total;
    buildTabRow();
    const allIds = (data.users||[]).map(u => u.id);

    let html = '<div class="toolbar">'
      +'<input class="search-input" id="user-search" placeholder="Search name or email…" value="'+esc(userSearch)+'">'
      +'<select class="dropdown" id="user-role-filter">'
      +'<option value="">All roles</option>'
      +'<option value="user"'+(userRole==='user'?' selected':'')+'>User</option>'
      +'<option value="admin"'+(userRole==='admin'?' selected':'')+'>Admin</option>'
      +'<option value="super_admin"'+(userRole==='super_admin'?' selected':'')+'>Super Admin</option>'
      +'</select>'
      +'</div>';

    html += '<div class="table-wrap"><table class="table"><thead><tr>'
      +'<th class="check-col"><input type="checkbox" class="checkbox" id="header-checkbox"></th>'
      +'<th>User</th><th>Role</th><th>Verified</th><th>Created</th><th>Actions</th>'
      +'</tr></thead><tbody>';

    (data.users||[]).forEach(u => {
      const checked = selectedIds.has(u.id) ? ' checked' : '';
      html += '<tr>'
        +'<td class="check-col"><input type="checkbox" class="checkbox" data-id="'+esc(u.id)+'"'+checked+'></td>'
        +'<td><div style="'+S_BOLD+'">'+esc(u.name||'—')+'</div>'
        +'<div style="'+S_MUTED_MONO+'">'+esc(u.email)+'</div></td>'
        +'<td><select class="dropdown" style="padding:4px 8px;font-size:.78rem" onchange="patchUserRole(\''+esc(u.id)+'\',this)">'
        +'<option value="user"'+(u.role==='user'?' selected':'')+'>user</option>'
        +'<option value="admin"'+(u.role==='admin'?' selected':'')+'>admin</option>'
        +'<option value="super_admin"'+(u.role==='super_admin'?' selected':'')+'>super_admin</option>'
        +'</select></td>'
        +'<td><button class="btn btn-sm '+(u.emailVerified ? 'btn-primary' : '')+'" onclick="toggleVerified(\''+esc(u.id)+'\','+(!u.emailVerified)+')">'
        +(u.emailVerified ? '✓ yes' : '✗ no')+'</button></td>'
        +'<td class="mono">'+fmtDate(u.createdAt)+'</td>'
        +'<td style="display:flex;gap:6px;flex-wrap:wrap">'
        +(impersonateUserId ? '' : '<button class="btn btn-sm btn-warn" onclick="startImpersonation(\''+esc(u.id)+'\',\''+esc(u.name)+'\',\''+esc(u.email)+'\')">Impersonate</button>')
        +'</td>'
        +'</tr>';
    });

    html += '</tbody></table></div>';
    html += renderPagination('users', page, totals.users);

    // Bulk bar actions for users tab
    $('#bulk-actions').innerHTML = '<button class="btn btn-sm" onclick="bulkChangeRole()">Change Role ▾</button>'
      +'<button class="btn btn-sm btn-danger" onclick="bulkExportUsers()">Export</button>';

    $('#app').innerHTML = html;
    syncCheckboxes(allIds);

    // Wire up search
    const searchEl = $('#user-search');
    searchEl.oninput = () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { userSearch = searchEl.value; loadUsers(1); }, 300);
    };
    $('#user-role-filter').onchange = (e) => { userRole = e.target.value; loadUsers(1); };

    // Wire up row checkboxes
    $$('[data-id]').forEach(cb => {
      cb.onchange = () => { toggleId(cb.dataset.id); syncCheckboxes(allIds); };
    });
    const headerCb = $('#header-checkbox');
    if (headerCb) {
      headerCb.onchange = () => {
        if (headerCb.checked) allIds.forEach(id => selectedIds.add(id));
        else allIds.forEach(id => selectedIds.delete(id));
        updateBulkBar();
        syncCheckboxes(allIds);
      };
    }
  } catch(e) {
    $('#app').innerHTML = errorHtml('Failed to load users: '+e.message);
  }
}

window.patchUserRole = async function(id, sel) {
  if (impersonateUserId) { toast('Mutations disabled while impersonating', 'error'); sel.value = sel.dataset.prev||sel.value; return; }
  const prev = sel.dataset.prev || sel.value;
  sel.dataset.prev = sel.value;
  try {
    await fetchApi('/dashboard/api/users/'+encodeURIComponent(id)+'/role', {method:'PATCH',body:JSON.stringify({role:sel.value})});
    toast('Role updated to '+sel.value);
  } catch(e) {
    sel.value = prev;
    toast('Failed to update role: '+e.message, 'error');
  }
};

window.toggleVerified = async function(id, verified) {
  if (impersonateUserId) { toast('Mutations disabled while impersonating', 'error'); return; }
  try {
    await fetchApi('/dashboard/api/users/'+encodeURIComponent(id)+'/verify', {method:'PATCH',body:JSON.stringify({verified})});
    toast(verified ? 'User verified' : 'Verification removed');
    loadUsers();
  } catch(e) {
    toast('Failed: '+e.message, 'error');
  }
};

window.startImpersonation = startImpersonation;

async function bulkChangeRole() {
  if (impersonateUserId) { toast('Mutations disabled while impersonating', 'error'); return; }
  const ids = Array.from(selectedIds);
  if (!ids.length) return;
  openModal('Change Role', 'Change role for '+ids.length+' users to admin?', async () => {
    try {
      await fetchApi('/dashboard/api/users/bulk-role', {method:'PATCH',body:JSON.stringify({ids,role:'admin'})});
      toast('Role updated for '+ids.length+' users');
      clearSelection();
      loadUsers();
    } catch(e) { toast('Failed: '+e.message, 'error'); }
  });
}

async function bulkExportUsers() {
  const ids = Array.from(selectedIds);
  exportCsv('users', ids.length ? ids : null);
}

// ── Sessions tab ──────────────────────────────────────────────────────────
async function loadSessions(page) {
  page = page || pages.sessions;
  clearSelection();
  $('#app').innerHTML = loadingHtml('Loading sessions...');
  try {
    const data = await fetchApi('/dashboard/api/sessions?page='+page+'&limit='+LIMIT);
    pages.sessions = page;
    totals.sessions = data.total || 0;
    TAB_COUNTS['sessions'] = data.total;
    buildTabRow();
    const allIds = (data.sessions||[]).map(s => s.id);

    let html = '<div class="table-wrap"><table class="table"><thead><tr>'
      +'<th class="check-col"><input type="checkbox" class="checkbox" id="header-checkbox"></th>'
      +'<th>User</th><th>IP</th><th>User Agent</th><th>Created</th><th>Expires</th><th>Action</th>'
      +'</tr></thead><tbody>';

    (data.sessions||[]).forEach(s => {
      const expired = s.expiresAt && new Date(s.expiresAt) < new Date();
      html += '<tr>'
        +'<td class="check-col"><input type="checkbox" class="checkbox" data-id="'+esc(s.id)+'"></td>'
        +'<td><div style="'+S_BOLD+'">'+esc(s.userName||'—')+'</div>'
        +'<div style="'+S_MUTED_MONO+'">'+esc(s.userEmail||'')+'</div></td>'
        +'<td class="mono">'+esc(s.ipAddress||'—')+'</td>'
        +'<td class="truncate" title="'+esc(s.userAgent||'')+'">'+esc(s.userAgent||'—')+'</td>'
        +'<td class="mono">'+fmtDate(s.createdAt)+'</td>'
        +'<td class="mono" style="color:'+(expired?'var(--danger)':'var(--text-2)')+'">'+fmtDate(s.expiresAt)+'</td>'
        +'<td><button class="btn btn-sm btn-danger" onclick="revokeSession(\''+esc(s.id)+'\')"'+(impersonateUserId?' disabled':'')+'>Revoke</button></td>'
        +'</tr>';
    });

    html += '</tbody></table></div>';
    html += renderPagination('sessions', page, totals.sessions);

    $('#bulk-actions').innerHTML = '<button class="btn btn-sm btn-danger" onclick="bulkRevokeSessions()" '+(impersonateUserId?'disabled':'')+'>Bulk Revoke</button>';
    $('#app').innerHTML = html;
    syncCheckboxes(allIds);

    $$('[data-id]').forEach(cb => {
      cb.onchange = () => { toggleId(cb.dataset.id); syncCheckboxes(allIds); };
    });
    const hcb = $('#header-checkbox');
    if (hcb) {
      hcb.onchange = () => {
        if (hcb.checked) allIds.forEach(id => selectedIds.add(id));
        else allIds.forEach(id => selectedIds.delete(id));
        updateBulkBar();
        syncCheckboxes(allIds);
      };
    }
  } catch(e) {
    $('#app').innerHTML = errorHtml('Failed to load sessions: '+e.message);
  }
}

window.revokeSession = function(id) {
  if (impersonateUserId) { toast('Mutations disabled while impersonating', 'error'); return; }
  openModal('Revoke Session', 'Revoke this session? The user will be logged out.', async () => {
    try {
      await fetchApi('/dashboard/api/sessions/'+encodeURIComponent(id), {method:'DELETE'});
      toast('Session revoked');
      loadSessions();
    } catch(e) { toast('Failed: '+e.message, 'error'); }
  });
};

async function bulkRevokeSessions() {
  if (impersonateUserId) { toast('Mutations disabled while impersonating', 'error'); return; }
  const ids = Array.from(selectedIds);
  if (!ids.length) return;
  openModal('Bulk Revoke', 'Revoke '+ids.length+' sessions? All affected users will be logged out.', async () => {
    try {
      await fetchApi('/dashboard/api/sessions/bulk-revoke', {method:'POST',body:JSON.stringify({ids})});
      toast('Revoked '+ids.length+' sessions');
      clearSelection();
      loadSessions();
    } catch(e) { toast('Failed: '+e.message, 'error'); }
  });
}

// ── Organizations tab ─────────────────────────────────────────────────────
async function loadOrganizations() {
  $('#app').innerHTML = loadingHtml('Loading organizations...');
  try {
    const data = await fetchApi('/dashboard/api/organizations');
    const orgs = data.organizations || [];
    TAB_COUNTS['organizations'] = orgs.length;
    buildTabRow();

    if (!orgs.length) { $('#app').innerHTML = '<div class="empty">No organizations found.</div>'; return; }

    let html = '<div class="data-grid">';
    orgs.forEach(org => {
      html += '<div class="org-card" onclick="toggleOrg(\''+esc(org.id)+'\')">'
        +'<div class="org-header"><span class="org-name">'+esc(org.name)+'</span>'
        +'<span class="badge badge-'+(org.plan==='enterprise'?'enterprise':org.plan==='pro'?'pro':'free')+'">'+esc(org.plan||'free')+'</span></div>'
        +'<div class="org-slug">@'+esc(org.slug)+'</div>'
        +'<div class="org-meta">'
        +'<span>'+fmt(org.memberCount)+' members</span>'
        +'<span>'+fmt(org.inviteCount)+' pending invites</span>'
        +'<span>Created '+fmtDate(org.createdAt)+'</span>'
        +'</div>'
        +'<div class="org-expand" id="org-'+esc(org.id)+'">'
        +'<div class="loading"><div class="spinner"></div><span>Loading…</span></div>'
        +'</div>'
        +'</div>';
    });
    html += '</div>';
    $('#app').innerHTML = html;
  } catch(e) {
    $('#app').innerHTML = errorHtml('Failed: '+e.message);
  }
}

window.toggleOrg = async function(id) {
  const el = $('#org-'+id);
  if (!el) return;
  if (el.classList.contains('open')) { el.classList.remove('open'); return; }
  el.classList.add('open');
  try {
    const data = await fetchApi('/dashboard/api/organizations/'+encodeURIComponent(id));
    let html = '';
    if (data.members && data.members.length) {
      html += '<p class="section-title" style="margin-top:0">Members</p>';
      html += data.members.map(m =>
        '<div class="data-row"><span class="data-row-label">'+esc(m.name||m.email)+'</span>'
        +'<span><span class="badge badge-'+(m.role||'user')+'">'+esc(m.role||'member')+'</span></span></div>'
      ).join('');
    }
    if (data.invites && data.invites.length) {
      html += '<p class="section-title">Pending Invites</p>';
      html += data.invites.map(inv =>
        '<div class="data-row"><span class="data-row-label mono">'+esc(inv.email)+'</span>'
        +'<span style="'+S_MUTED_SM+'">'+fmtDate(inv.expiresAt)+'</span></div>'
      ).join('');
    }
    el.innerHTML = html || '<div style="'+S_MUTED_SM+'">No member data.</div>';
  } catch(e) {
    el.innerHTML = '<div style="color:var(--danger);font-size:.82rem">Failed: '+esc(e.message)+'</div>';
  }
};

// ── API Keys tab ──────────────────────────────────────────────────────────
async function loadApiKeys() {
  $('#app').innerHTML = loadingHtml('Loading API keys...');
  try {
    const [keysData, clientsData, codesData] = await Promise.all([
      fetchApi('/dashboard/api/api-keys'),
      fetchApi('/dashboard/api/oauth-clients').catch(() => ({clients:[]})),
      fetchApi('/dashboard/api/device-codes').catch(() => ({codes:[]})),
    ]);

    let html = '<p class="section-title" style="margin-top:0">API Keys</p>';
    const keys = keysData.keys || [];
    TAB_COUNTS['api-keys'] = keys.length;
    buildTabRow();

    if (keys.length) {
      html += '<div class="table-wrap"><table class="table"><thead><tr>'
        +'<th>Name</th><th>Prefix</th><th>User</th><th>Last Used</th><th>Expires</th><th>Action</th>'
        +'</tr></thead><tbody>';
      keys.forEach(k => {
        html += '<tr>'
          +'<td style="'+S_BOLD+'">'+esc(k.name||'—')+'</td>'
          +'<td class="mono">'+esc(k.prefix||k.keyHash?.slice(0,8)||'—')+'…</td>'
          +'<td class="mono" style="font-size:.78rem">'+esc(k.userEmail||k.userId||'—')+'</td>'
          +'<td class="mono">'+relTime(k.lastUsedAt)+'</td>'
          +'<td class="mono" style="color:'+(k.expiresAt && new Date(k.expiresAt)<new Date() ? 'var(--danger)':'var(--text-2)')+'">'+fmtDate(k.expiresAt)+'</td>'
          +'<td><button class="btn btn-sm btn-danger" onclick="revokeApiKey(\''+esc(k.id)+'\')"'+(impersonateUserId?' disabled':'')+'>Revoke</button></td>'
          +'</tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<div class="empty">No API keys found.</div>';
    }

    const clients = clientsData.clients || [];
    if (clients.length) {
      html += '<p class="section-title">OAuth Clients</p>';
      html += '<div class="table-wrap"><table class="table"><thead><tr>'
        +'<th>Client ID</th><th>Name</th><th>Redirect URIs</th><th>Created</th>'
        +'</tr></thead><tbody>';
      clients.forEach(c => {
        html += '<tr>'
          +'<td class="mono">'+esc(c.clientId||c.id||'—')+'</td>'
          +'<td>'+esc(c.name||'—')+'</td>'
          +'<td class="truncate mono" title="'+esc((c.redirectUris||[]).join(', '))+'">'+esc((c.redirectUris||[]).join(', '))+'</td>'
          +'<td class="mono">'+fmtDate(c.createdAt)+'</td>'
          +'</tr>';
      });
      html += '</tbody></table></div>';
    }

    const codes = codesData.codes || [];
    if (codes.length) {
      html += '<p class="section-title">Device Auth Codes</p>';
      html += '<div class="table-wrap"><table class="table"><thead><tr>'
        +'<th>User Code</th><th>User</th><th>Status</th><th>Expires</th>'
        +'</tr></thead><tbody>';
      codes.forEach(c => {
        html += '<tr>'
          +'<td class="mono">'+esc(c.userCode||'—')+'</td>'
          +'<td class="mono">'+esc(c.userEmail||c.userId||'—')+'</td>'
          +'<td><span class="badge badge-'+(c.status==='approved'?'admin':c.status==='expired'?'danger':'user')+'">'+esc(c.status||'pending')+'</span></td>'
          +'<td class="mono">'+fmtDate(c.expiresAt)+'</td>'
          +'</tr>';
      });
      html += '</tbody></table></div>';
    }

    $('#app').innerHTML = html;
  } catch(e) {
    $('#app').innerHTML = errorHtml('Failed: '+e.message);
  }
}

window.revokeApiKey = function(id) {
  if (impersonateUserId) { toast('Mutations disabled while impersonating', 'error'); return; }
  openModal('Revoke API Key', 'Revoke this API key? Any apps using it will stop working immediately.', async () => {
    try {
      await fetchApi('/dashboard/api/api-keys/'+encodeURIComponent(id), {method:'DELETE'});
      toast('API key revoked');
      loadApiKeys();
    } catch(e) { toast('Failed: '+e.message, 'error'); }
  });
};

// ── Audit Log tab ─────────────────────────────────────────────────────────
async function loadAuditLog(page) {
  page = page || pages['audit-log'];
  $('#app').innerHTML = loadingHtml('Loading audit log...');
  try {
    const params = new URLSearchParams({page:String(page),limit:String(LIMIT),action:auditAction});
    const data = await fetchApi('/dashboard/api/audit-log?'+params.toString());
    pages['audit-log'] = page;
    totals['audit-log'] = data.total || 0;

    const SEVERITY = {
      delete:'danger', remove:'danger', revoke:'danger', ban:'danger',
      update:'warn', change:'warn', patch:'warn',
    };

    let html = '<div class="toolbar">'
      +'<select class="dropdown" id="audit-action-filter" style="min-width:180px">'
      +'<option value="">All actions</option>';
    (data.actionTypes||[]).forEach(a => {
      html += '<option value="'+esc(a)+'"'+(auditAction===a?' selected':'')+'>'+esc(a)+'</option>';
    });
    html += '</select></div>';

    html += '<div class="card"><h3>Audit Log</h3>';
    const entries = data.entries || [];
    if (!entries.length) {
      html += '<div class="empty" style="padding:24px 0">No audit entries found.</div>';
    } else {
      entries.forEach((e, i) => {
        const actionKey = (e.action||'').toLowerCase();
        let sev = 'info';
        for (const k of Object.keys(SEVERITY)) {
          if (actionKey.includes(k)) { sev = SEVERITY[k]; break; }
        }
        html += '<div class="audit-entry">'
          +'<div class="audit-timeline '+sev+'"></div>'
          +'<div class="audit-body">'
          +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
          +'<span class="audit-actor">'+esc(e.actorName||e.actorEmail||e.actorId||'system')+'</span>'
          +'<span class="audit-action">'+esc(e.action)+'</span>'
          +(e.target ? '<span class="audit-target">'+esc(e.target)+'</span>' : '')
          +'<span class="badge badge-'+sev+'">'+sev+'</span>'
          +'</div>'
          +'<div class="audit-meta">'
          +'<span class="audit-time">'+fmtTime(e.createdAt)+'</span>'
          +(e.ipAddress ? '<span style="color:var(--muted);font-size:.75rem;font-family:\\'JetBrains Mono\\',monospace">'+esc(e.ipAddress)+'</span>' : '')
          +'</div>'
          +(e.details ? '<button class="expand-btn" onclick="toggleAuditDetails(this)">details ▸</button>'
            +'<div class="audit-details">'+esc(JSON.stringify(e.details, null, 2))+'</div>' : '')
          +'</div>'
          +'</div>';
      });
    }
    html += '</div>';
    html += renderPagination('audit-log', page, totals['audit-log']);

    $('#bulk-actions').innerHTML = '';
    $('#app').innerHTML = html;

    const af = $('#audit-action-filter');
    if (af) af.onchange = (ev) => { auditAction = ev.target.value; loadAuditLog(1); };
  } catch(e) {
    $('#app').innerHTML = errorHtml('Failed: '+e.message);
  }
}

window.toggleAuditDetails = function(btn) {
  const details = btn.nextElementSibling;
  const open = details.classList.toggle('open');
  btn.textContent = open ? 'details ▾' : 'details ▸';
};

// ── Security tab ──────────────────────────────────────────────────────────
async function loadSecurity() {
  $('#app').innerHTML = loadingHtml('Analyzing security...');
  try {
    const data = await fetchApi('/dashboard/api/security');

    let html = '<p class="section-title" style="margin-top:0">Anomalies</p>';

    const multiIp = data.multiIpSessions || [];
    if (multiIp.length) {
      multiIp.forEach(item => {
        html += '<div class="anomaly-card warn-card">'
          +'<div class="anomaly-title">⚠ Multi-IP Session: '+esc(item.userName||item.userId)+'</div>'
          +'<div class="anomaly-desc">Active from '+item.ipCount+' different IP addresses</div>'
          +'<div class="anomaly-ips">'+esc((item.ips||[]).join(' · '))+'</div>'
          +'</div>';
      });
    } else {
      html += '<div class="anomaly-card"><div class="anomaly-desc" style="color:var(--accent)">No multi-IP session anomalies detected.</div></div>';
    }

    const unverified = data.unverifiedWithSessions || [];
    if (unverified.length) {
      unverified.forEach(item => {
        html += '<div class="anomaly-card danger-card">'
          +'<div class="anomaly-title">✕ Unverified account with active sessions</div>'
          +'<div class="anomaly-desc">'+esc(item.email)+' — '+fmt(item.sessionCount)+' sessions active</div>'
          +'</div>';
      });
    } else {
      html += '<div class="anomaly-card"><div class="anomaly-desc" style="color:var(--accent)">No unverified accounts with active sessions.</div></div>';
    }

    if (data.staleSessions != null) {
      html += '<div class="anomaly-card warn-card">'
        +'<div class="anomaly-title">Stale sessions</div>'
        +'<div class="anomaly-desc">'+fmt(data.staleSessions)+' sessions expired but not cleaned up</div>'
        +'<div style="margin-top:10px">'
        +'<button class="btn btn-sm btn-warn" onclick="cleanStaleSessions()"'+(impersonateUserId?' disabled':'')+'>Clean Up</button>'
        +'</div></div>';
    }

    $('#app').innerHTML = html;
  } catch(e) {
    $('#app').innerHTML = errorHtml('Failed: '+e.message);
  }
}

window.cleanStaleSessions = function() {
  openModal('Clean Stale Sessions', 'Delete all expired sessions from the database?', async () => {
    try {
      await fetchApi('/dashboard/api/security/clean-stale', {method:'POST'});
      toast('Stale sessions cleaned up');
      loadSecurity();
    } catch(e) { toast('Failed: '+e.message, 'error'); }
  });
};

// ── System tab ────────────────────────────────────────────────────────────
async function loadSystem() {
  $('#app').innerHTML = loadingHtml('Loading system info...');
  try {
    const data = await fetchApi('/dashboard/api/system');

    let html = '<p class="section-title" style="margin-top:0">Health</p>';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">';
    html += '<span class="status-dot '+(data.d1Healthy?'ok':'error')+'"></span>';
    html += '<span style="font-weight:600">D1 Database</span>';
    html += '<span style="color:var(--muted);font-size:.85rem">'+(data.d1Healthy?'Operational':'Unavailable')+'</span>';
    html += '</div>';

    if (data.tables && data.tables.length) {
      html += '<p class="section-title">Table Row Counts</p>';
      html += '<div class="bento" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">';
      data.tables.forEach(t => {
        html += '<div class="metric-card">'
          +'<div><div class="metric-value">'+fmt(t.count)+'</div><div class="metric-label">'+esc(t.name)+'</div></div>'
          +'</div>';
      });
      html += '</div>';
    }

    if (data.metrics && data.metrics.length) {
      html += '<p class="section-title">Service Metrics</p>';
      html += '<div class="data-grid"><div class="card"><h3>Latency</h3>';
      data.metrics.forEach(m => {
        const sev = m.value > 500 ? 'danger' : m.value > 200 ? 'warn' : 'ok';
        html += '<div class="data-row">'
          +'<span class="data-row-label"><span class="status-dot '+sev+'" style="margin-right:6px"></span>'+esc(m.name)+'</span>'
          +'<span class="data-row-value">'+fmt(m.value)+'ms</span>'
          +'</div>';
      });
      html += '</div></div>';
    }

    $('#app').innerHTML = html;
  } catch(e) {
    $('#app').innerHTML = errorHtml('Failed: '+e.message);
  }
}

// ── Export tab ────────────────────────────────────────────────────────────
function exportCard(title, desc, type) {
  return '<div class="card"><h3>'+title+'</h3>'
    +'<p style="'+S_MUTED_SM+';margin-bottom:16px">'+desc+'</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<button class="btn btn-primary" onclick="exportCsv(\''+type+'\')">Download CSV</button>'
    +'</div></div>';
}

function loadExport() {
  let html = '<p class="section-title" style="margin-top:0">Export Data</p>';
  html += '<div class="data-grid">';
  html += exportCard('Users',     'Export all user accounts including profile, role, and verification status.',               'users');
  html += exportCard('Sessions',  'Export all sessions including IP, user agent, and expiry information.',                   'sessions');
  html += exportCard('Audit Log', 'Export complete audit trail including actor, action, target, and timestamps.',             'audit-log');
  html += '</div>';

  $('#bulk-actions').innerHTML = '';
  $('#app').innerHTML = html;
}

window.exportCsv = async function(type, filterIds) {
  const btn = event && event.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Exporting…'; }
  try {
    let endpoint = '/dashboard/api/'+type+'?limit=10000&page=1';
    if (type === 'users' && userSearch) endpoint += '&search='+encodeURIComponent(userSearch);
    if (type === 'users' && userRole) endpoint += '&role='+encodeURIComponent(userRole);
    const data = await fetchApi(endpoint);

    let rows, headers;
    if (type === 'users') {
      const items = (filterIds ? data.users.filter(u => filterIds.includes(u.id)) : data.users) || [];
      headers = ['id','name','email','role','emailVerified','createdAt','updatedAt'];
      rows = items.map(u => headers.map(h => csvCell(u[h])));
    } else if (type === 'sessions') {
      const items = data.sessions || [];
      headers = ['id','userId','userEmail','ipAddress','userAgent','createdAt','expiresAt'];
      rows = items.map(s => headers.map(h => csvCell(s[h])));
    } else {
      const items = data.entries || [];
      headers = ['id','actorId','actorEmail','action','target','ipAddress','createdAt'];
      rows = items.map(e => headers.map(h => csvCell(e[h])));
    }

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = type+'-export-'+new Date().toISOString().slice(0,10)+'.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('Export downloaded: '+type+'.csv');
  } catch(e) {
    toast('Export failed: '+e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Download CSV'; }
  }
};

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\\n')) return '"'+s.replace(/"/g,'""')+'"';
  return s;
}

// ── Pagination helper ─────────────────────────────────────────────────────
function renderPagination(tabKey, page, total) {
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const start = (page-1)*LIMIT+1;
  const end = Math.min(page*LIMIT, total);
  return '<div class="pagination">'
    +'<button class="btn btn-sm" onclick="goPage(\''+tabKey+'\','+(page-1)+')"'+(page<=1?' disabled':'')+'>← Prev</button>'
    +'<span class="page-info">'+start+'–'+end+' of '+fmt(total)+'</span>'
    +'<button class="btn btn-sm" onclick="goPage(\''+tabKey+'\','+(page+1)+')"'+(page>=totalPages?' disabled':'')+'>Next →</button>'
    +'</div>';
}

window.goPage = function(tabKey, page) {
  if (page < 1) return;
  if (tabKey === 'users') loadUsers(page);
  else if (tabKey === 'sessions') loadSessions(page);
  else if (tabKey === 'audit-log') loadAuditLog(page);
};

// ── Tab dispatcher ────────────────────────────────────────────────────────
function loadTab(tab) {
  clearSelection();
  switch(tab) {
    case 'overview':       loadOverview(); break;
    case 'users':          loadUsers(1); break;
    case 'sessions':       loadSessions(1); break;
    case 'organizations':  loadOrganizations(); break;
    case 'api-keys':       loadApiKeys(); break;
    case 'audit-log':      loadAuditLog(1); break;
    case 'security':       loadSecurity(); break;
    case 'system':         loadSystem(); break;
    case 'export':         loadExport(); break;
    default:               loadOverview();
  }
}

// ── Init ──────────────────────────────────────────────────────────────────
function init() {
  buildTabRow();
  loadTab(currentTab);
  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1);
    if (TABS.includes(hash)) { currentTab = hash; buildTabRow(); loadTab(hash); }
  });
}

init();
})();
<\/script>`;
}

// ── Public entry point ────────────────────────────────────────────────────────

export function renderDashboard(user: DashboardUser): string {
  const safeName = esc(user.name);
  const safeEmail = esc(user.email);
  const safeRole = esc(user.role);
  const safeImage = user.image ? esc(user.image) : "";
  const avatarHtml = safeImage
    ? `<img src="${safeImage}" alt="${safeName}" class="avatar-img">`
    : `<div class="avatar-fallback">${safeName.charAt(0).toUpperCase()}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>spike.land admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Rubik:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
${buildStyles()}
</head>
<body>
${buildHtmlShell(avatarHtml, safeName, safeRole, safeEmail)}
${buildScript()}
</body>
</html>`;
}
