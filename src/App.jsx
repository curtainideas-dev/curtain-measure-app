import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// SUPABASE CONFIG — Replace with your own credentials
// ============================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Minimal Supabase client
const supabase = {
  from: (table) => ({
    select: async (cols = "*") => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}&order=created_at.desc`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const data = await res.json();
      return { data, error: res.ok ? null : data };
    },
    insert: async (rows) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(rows),
      });
      const data = await res.json();
      return { data, error: res.ok ? null : data };
    },
    update: async (row) => ({
      eq: async (col, val) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(row),
        });
        const data = await res.json();
        return { data, error: res.ok ? null : data };
      },
    }),
    delete: () => ({
      eq: async (col, val) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, {
          method: "DELETE",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        return { error: res.ok ? null : "Delete failed" };
      },
    }),
  }),
  storage: {
    from: (bucket) => ({
      upload: async (path, file) => {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": file.type,
          },
          body: file,
        });
        return { error: res.ok ? null : "Upload failed" };
      },
      getPublicUrl: (path) => ({
        data: { publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}` },
      }),
    }),
  },
};

// ============================================================
// ICONS (inline SVG components)
// ============================================================
const Icon = ({ d, size = 20, color = "currentColor", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const Icons = {
  Plus: (p) => <Icon {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />,
  Camera: (p) => <Icon {...p} d={<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>} />,
  ChevronLeft: (p) => <Icon {...p} d="M15 18l-6-6 6-6" />,
  ChevronRight: (p) => <Icon {...p} d="M9 18l6-6-6-6" />,
  Home: (p) => <Icon {...p} d={<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />,
  Ruler: (p) => <Icon {...p} d={<><path d="M21.7 5.7L5.7 21.7a1 1 0 01-1.4 0L1.3 18.7a1 1 0 010-1.4L17.3 1.3a1 1 0 011.4 0l3 3a1 1 0 010 1.4z"/><line x1="7" y1="13.5" x2="9.5" y2="11"/><line x1="10.5" y1="10" x2="13" y2="7.5"/><line x1="14" y1="6.5" x2="16.5" y2="4"/></>} />,
  Trash: (p) => <Icon {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>} />,
  Save: (p) => <Icon {...p} d={<><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>} />,
  List: (p) => <Icon {...p} d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} />,
  User: (p) => <Icon {...p} d={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  Phone: (p) => <Icon {...p} d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />,
  MapPin: (p) => <Icon {...p} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>} />,
  Calendar: (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
  Image: (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>} />,
  Check: (p) => <Icon {...p} d="M20 6L9 17l-5-5" />,
  X: (p) => <Icon {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />,
  Edit: (p) => <Icon {...p} d={<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />,
  Cloud: (p) => <Icon {...p} d={<><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></>} />,
  Window: (p) => <Icon {...p} d={<><rect x="2" y="3" width="20" height="18" rx="1"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="2" y1="12" x2="22" y2="12"/></>} />,
  Pen: (p) => <Icon {...p} d={<><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></>} />,
  Undo: (p) => <Icon {...p} d={<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>} />,
  Download: (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />,
};

// ============================================================
// STYLES
// ============================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

:root {
  --ink: #0F172A;
  --paper: #F8FAFC;
  --warm-100: #F1F5F9;
  --warm-200: #E2E8F0;
  --warm-300: #94A3B8;
  --accent: #8DC73F;
  --accent-dark: #1C2E0F;
  --accent-hover: #7ab535;
  --accent-bg: #F2F9E7;
  --danger: #EF4444;
  --danger-bg: #FEF2F2;
  --success: #10B981;
  --success-bg: #F0FDF4;
  --blue: #2563eb;
  --blue-bg: #eff6ff;
  --warning-bg: #FFF7ED;
  --warning: #C2410C;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow-sm: 0 1px 3px rgba(15,23,42,0.06);
  --shadow: 0 4px 12px rgba(15,23,42,0.08);
  --shadow-lg: 0 12px 32px rgba(15,23,42,0.12);
  --font-body: 'DM Sans', 'Segoe UI', sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html { font-family: var(--font-body); background: var(--paper); color: var(--ink); font-size: 15px; }
input, textarea, select, button { font-family: inherit; font-size: inherit; }

.app { max-width: 768px; margin: 0 auto; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }

/* Header */
.header { 
  position: sticky; top: 0; z-index: 50;
  background: var(--accent-dark);
  padding: 14px 16px; min-height: 56px;
  display: flex; align-items: center; gap: 12px;
}
.header-back { 
  background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer;
  display: flex; align-items: center; gap: 2px; font-weight: 500; font-size: 14px;
  padding: 6px 4px;
}
.header-back:hover { color: #fff; }
.header-title {
  font-size: 18px; font-weight: 700;
  flex: 1; letter-spacing: -0.01em; color: #fff;
}
.header-actions { display: flex; gap: 8px; align-items: center; }

/* Cards */
.card {
  background: #fff; border-radius: var(--radius); border: 1px solid var(--warm-200);
  overflow: hidden; transition: box-shadow 0.2s;
}
.card:hover { box-shadow: var(--shadow); }
.card-body { padding: 16px; }

/* Form Fields */
.field { margin-bottom: 16px; }
.field-label { 
  display: block; font-size: 11px; font-weight: 600; 
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--warm-300); margin-bottom: 6px;
}
.field-input {
  width: 100%; padding: 10px 12px; border: 1.5px solid var(--warm-200);
  border-radius: var(--radius-sm); background: #fff; font-size: 15px;
  transition: border-color 0.2s, box-shadow 0.2s; color: var(--ink);
}
.field-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(141,199,63,0.15); }
.field-input::placeholder { color: var(--warm-300); }
textarea.field-input { resize: vertical; min-height: 80px; line-height: 1.5; }

/* Measurement Grid */
.meas-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.meas-item { position: relative; }
.meas-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--warm-300); margin-bottom: 3px;
  display: block; line-height: 1.2;
}
.meas-input {
  width: 100%; padding: 8px 10px; border: 1.5px solid var(--warm-200);
  border-radius: 6px; font-size: 16px; font-weight: 500;
  text-align: right; background: #fff; color: var(--ink);
  transition: border-color 0.2s;
}
.meas-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px rgba(141,199,63,0.15); }
.meas-input::placeholder { color: var(--warm-200); font-weight: 400; }
.meas-unit {
  position: absolute; right: 10px; bottom: 9px; font-size: 11px;
  color: var(--warm-300); pointer-events: none; font-weight: 500;
}

/* Buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 16px; border-radius: var(--radius-sm); font-weight: 600;
  font-size: 14px; border: none; cursor: pointer; transition: all 0.15s;
  text-decoration: none; white-space: nowrap;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #7ab535; }
.btn-primary:active { transform: scale(0.97); }
.btn-secondary { background: var(--warm-100); color: var(--ink); }
.btn-secondary:hover { background: var(--warm-200); }
.btn-ghost { background: none; color: var(--accent); padding: 8px; }
.btn-ghost:hover { background: rgba(141,199,63,0.1); }
.header .btn-ghost { color: rgba(255,255,255,0.7); }
.header .btn-ghost:hover { color: #fff; background: rgba(255,255,255,0.1); }
.btn-danger { background: var(--danger-bg); color: var(--danger); }
.btn-danger:hover { background: #fee2e2; }
.btn-block { width: 100%; }
.btn-lg { padding: 14px 24px; font-size: 16px; border-radius: var(--radius); }

/* Photo Area */
.photo-main {
  width: 100%; aspect-ratio: 4/3; background: var(--warm-100);
  border-radius: var(--radius-sm); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; border: 2px dashed var(--warm-200); transition: all 0.2s;
  overflow: hidden; position: relative;
}
.photo-main:hover { border-color: var(--accent); background: var(--accent-bg); }
.photo-main img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.photo-main-label { font-size: 12px; color: var(--warm-300); font-weight: 500; }

.photo-strip { display: flex; gap: 8px; overflow-x: auto; padding: 4px 0; }
.photo-thumb {
  width: 64px; height: 64px; border-radius: 8px; flex-shrink: 0;
  overflow: hidden; position: relative; cursor: pointer;
  border: 2px solid var(--warm-200);
}
.photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
.photo-thumb-remove {
  position: absolute; top: -4px; right: -4px; width: 20px; height: 20px;
  background: var(--danger); color: #fff; border: 2px solid #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 10px; cursor: pointer; z-index: 2;
}
.photo-add-small {
  width: 64px; height: 64px; border-radius: 8px; flex-shrink: 0;
  border: 2px dashed var(--warm-200); display: flex; align-items: center;
  justify-content: center; cursor: pointer; background: var(--warm-100);
  transition: all 0.2s;
}
.photo-add-small:hover { border-color: var(--accent); background: var(--accent-bg); }

/* Job List */
.job-item {
  padding: 16px; display: flex; align-items: center; gap: 14px;
  border-bottom: 1px solid var(--warm-100); cursor: pointer;
  transition: background 0.15s;
}
.job-item:last-child { border-bottom: none; }
.job-item:hover { background: var(--warm-100); }
.job-item:active { background: var(--warm-200); }
.job-avatar {
  width: 44px; height: 44px; border-radius: 50%; background: var(--accent-bg);
  color: var(--accent); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.job-info { flex: 1; min-width: 0; }
.job-name { font-weight: 600; font-size: 15px; margin-bottom: 2px; }
.job-address { font-size: 13px; color: var(--warm-300); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.job-meta { text-align: right; flex-shrink: 0; }
.job-count { font-size: 11px; font-weight: 600; color: var(--accent); background: var(--accent-bg); padding: 2px 8px; border-radius: 99px; }
.job-date { font-size: 11px; color: var(--warm-300); margin-top: 4px; }

/* Window card in list */
.window-item {
  padding: 12px 16px; display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid var(--warm-100); cursor: pointer;
  transition: background 0.15s;
}
.window-item:last-child { border-bottom: none; }
.window-item:hover { background: var(--warm-100); }
.window-thumb {
  width: 52px; height: 52px; border-radius: 8px; background: var(--warm-100);
  flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center;
}
.window-thumb img { width: 100%; height: 100%; object-fit: cover; }
.window-info { flex: 1; min-width: 0; }
.window-label { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.window-dims { font-size: 12px; color: var(--warm-300); }

/* Section Dividers */
.section-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--warm-300); padding: 20px 16px 8px;
}

/* Floating Action Button */
.fab {
  position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
  border-radius: 50%; background: var(--accent); color: #fff; border: none;
  box-shadow: var(--shadow-lg); cursor: pointer; display: flex;
  align-items: center; justify-content: center; z-index: 40;
  transition: transform 0.15s, box-shadow 0.15s;
}
.fab:hover { transform: scale(1.05); box-shadow: 0 16px 40px rgba(141,199,63,0.3); }
.fab:active { transform: scale(0.95); }

/* Toast */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--ink); color: #fff; padding: 12px 20px; border-radius: 99px;
  font-size: 14px; font-weight: 500; z-index: 100; box-shadow: var(--shadow-lg);
  display: flex; align-items: center; gap: 8px;
  animation: toast-in 0.3s ease;
}
.toast-success {
  background: var(--success); color: #fff;
}
.toast-error {
  background: var(--danger); color: #fff;
}
@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Sync Success Overlay */
.sync-overlay {
  position: fixed; inset: 0; z-index: 150;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  animation: overlay-in 0.2s ease;
}
@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.sync-overlay-card {
  background: #fff; border-radius: 20px; padding: 40px 32px;
  text-align: center; max-width: 300px; width: 90%;
  box-shadow: var(--shadow-lg);
  animation: overlay-card-in 0.3s ease;
}
@keyframes overlay-card-in {
  from { opacity: 0; transform: scale(0.9) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.sync-check-circle {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--accent-bg); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  animation: check-pop 0.4s ease 0.15s both;
}
@keyframes check-pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.sync-overlay-title {
  font-family: var(--font-body); font-size: 22px; font-weight: 700;
  margin-bottom: 6px; color: var(--ink);
}
.sync-overlay-desc {
  font-size: 13px; color: var(--warm-300); line-height: 1.5;
}

/* Empty State */
.empty-state {
  padding: 60px 32px; text-align: center; color: var(--warm-300);
}
.empty-icon { margin-bottom: 16px; opacity: 0.4; }
.empty-title { font-weight: 700; font-size: 24px; color: var(--ink); margin-bottom: 8px; }
.empty-desc { font-size: 14px; line-height: 1.5; margin-bottom: 24px; }

/* Status Pill */
.pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600;
}
.pill-synced { background: var(--accent-bg); color: var(--accent); }
.pill-local { background: var(--warning-bg); color: var(--warning); }
.pill-error { background: var(--danger-bg); color: var(--danger); }

/* Divider */
.divider { height: 1px; background: var(--warm-200); margin: 16px 0; }

/* Measurement Section Header */
.meas-section-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px; margin-top: 20px;
}
.meas-section-dot {
  width: 8px; height: 8px; border-radius: 50%;
}

/* Connection Status */
.conn-status {
  font-size: 11px; display: flex; align-items: center; gap: 4px; padding: 4px 10px;
  border-radius: 99px;
}
.conn-online { background: var(--success-bg); color: var(--success); }
.conn-offline { background: var(--danger-bg); color: var(--danger); }

/* Drawing Editor */
.draw-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: #000; display: flex; flex-direction: column;
}
.draw-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; background: #111;
  flex-shrink: 0;
}
.draw-toolbar-title {
  flex: 1; color: #fff; font-size: 14px; font-weight: 600;
}
.draw-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 600; font-family: inherit;
}
.draw-btn-tool {
  background: #333; color: #fff;
}
.draw-btn-tool.active {
  background: var(--accent); color: #fff;
}
.draw-btn-cancel { background: #333; color: #fff; }
.draw-btn-save { background: var(--accent); color: #fff; }
.draw-color-btn {
  width: 28px; height: 28px; border-radius: 50%; border: 2px solid #444;
  cursor: pointer; flex-shrink: 0; transition: border-color 0.15s;
}
.draw-color-btn.active { border-color: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
.draw-size-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%; background: #333;
  border: 2px solid #444; cursor: pointer; color: #fff;
}
.draw-size-btn.active { border-color: #fff; background: #555; }
.draw-canvas-wrap {
  flex: 1; display: flex; align-items: center; justify-content: center;
  overflow: hidden; position: relative;
}
.draw-canvas-wrap canvas {
  touch-action: none; max-width: 100%; max-height: 100%;
}
.draw-bottom-bar {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 16px; background: #111; flex-shrink: 0;
}

/* Utility */
.scroll-area { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: 80px; }
.p-16 { padding: 16px; }
.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
.mb-8 { margin-bottom: 8px; }
.mb-16 { margin-bottom: 16px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-8 { gap: 8px; }
.text-center { text-align: center; }
.text-sm { font-size: 13px; }
.text-muted { color: var(--warm-300); }
`;

// ============================================================
// HELPERS
// ============================================================
const genId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "";

const MEASUREMENT_FIELDS = [
  { key: "inside_width", label: "Inside Width" },
  { key: "outside_width", label: "Outside Width" },
  { key: "inside_length", label: "Inside Length" },
  { key: "outside_length", label: "Outside Length" },
  { key: "treatment_width", label: "Treatment Width" },
  { key: "treatment_drop", label: "Treatment Drop" },
  { key: "left_wall_to_arch", label: "Left Wall → Architrave" },
  { key: "right_wall_to_arch", label: "Right Wall → Architrave" },
  { key: "arch_to_ceiling", label: "Architrave → Ceiling" },
  { key: "arch_to_floor", label: "Architrave → Floor" },
];

const blankMeasurements = () => MEASUREMENT_FIELDS.reduce((o, f) => ({ ...o, [f.key]: "" }), {});

const readFileAsDataURL = (file) => new Promise((resolve) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.readAsDataURL(file);
});

// Compress image to fit in localStorage and render reliably
const compressImage = (dataUrl, maxWidth = 1200, quality = 0.7) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    let w = img.width;
    let h = img.height;
    if (w > maxWidth) {
      h = Math.round((h * maxWidth) / w);
      w = maxWidth;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    resolve(canvas.toDataURL("image/jpeg", quality));
  };
  img.onerror = () => resolve(dataUrl); // fallback to original if conversion fails
  img.src = dataUrl;
});

// ============================================================
// PDF EXPORT
// ============================================================
const LOGO_DATA_URL = "/favicon.png";

const loadJsPDF = () => {
  return new Promise((resolve, reject) => {
    if (window.jspdf) return resolve(window.jspdf.jsPDF);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = reject;
    document.head.appendChild(s);
  });
};

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

const exportJobPDF = async (job, showToast) => {
  try {
    showToast("Generating PDF...");
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw = 210, ph = 297, mx = 15, mxr = 195;
    const cw = mxr - mx; // content width
    let y = 0;

    const addHeader = async (pageNum, totalPages) => {
      // Dark green bar
      doc.setFillColor(28, 46, 15);
      doc.rect(0, 0, pw, 22, "F");

      // Logo
      try {
        const logoImg = await loadImage(LOGO_DATA_URL);
        if (logoImg) doc.addImage(logoImg, "PNG", mx, 3, 16, 16);
      } catch {}

      // Company name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Curtain Ideas", mx + 20, 13);

      // Page number
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${pageNum} of ${totalPages}`, mxr, 13, { align: "right" });

      doc.setTextColor(15, 23, 42);
      return 28;
    };

    // Calculate total pages: 1 cover + ceil(windows/2)
    const totalPages = 1 + Math.ceil(job.windows.length / 2);

    // ---- PAGE 1: COVER ----
    y = await addHeader(1, totalPages);

    // Job title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Check Measure Report", mx, y + 8);
    y += 16;

    // Lead details box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(mx, y, cw, 52, 3, 3, "F");
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184);
    doc.text("LEAD DETAILS", mx + 6, y);
    y += 7;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(job.lead_name || "—", mx + 6, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const address = [job.street, job.suburb, job.postcode].filter(Boolean).join(", ");
    if (address) { doc.text(address, mx + 6, y); y += 5; }
    if (job.phone) { doc.text(`Phone: ${job.phone}`, mx + 6, y); y += 5; }
    if (job.email) { doc.text(`Email: ${job.email}`, mx + 6, y); y += 5; }

    const dateStr = job.measure_date ? new Date(job.measure_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";
    if (dateStr || job.measure_time) {
      doc.text(`Measure: ${dateStr}${job.measure_time ? " at " + job.measure_time : ""}`, mx + 6, y);
    }

    y += 16;

    // Window summary table
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184);
    doc.text("WINDOW SUMMARY", mx, y);
    y += 6;

    doc.setFillColor(28, 46, 15);
    doc.rect(mx, y, cw, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("#", mx + 3, y + 5);
    doc.text("Window", mx + 12, y + 5);
    doc.text("Inside W", mx + 70, y + 5);
    doc.text("Inside L", mx + 95, y + 5);
    doc.text("Treatment W", mx + 120, y + 5);
    doc.text("Treatment D", mx + 150, y + 5);
    y += 7;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    job.windows.forEach((w, i) => {
      const bg = i % 2 === 0 ? 248 : 241;
      doc.setFillColor(bg, bg, bg);
      doc.rect(mx, y, cw, 6, "F");
      doc.text(`${i + 1}`, mx + 3, y + 4.5);
      doc.text(w.label || "—", mx + 12, y + 4.5);
      doc.text(w.measurements?.inside_width || "—", mx + 70, y + 4.5);
      doc.text(w.measurements?.inside_length || "—", mx + 95, y + 4.5);
      doc.text(w.measurements?.treatment_width || "—", mx + 120, y + 4.5);
      doc.text(w.measurements?.treatment_drop || "—", mx + 150, y + 4.5);
      y += 6;
    });

    // ---- WINDOW PAGES: 2 per page ----
    for (let i = 0; i < job.windows.length; i += 2) {
      doc.addPage();
      const pageNum = 2 + Math.floor(i / 2);
      y = await addHeader(pageNum, totalPages);

      for (let slot = 0; slot < 2; slot++) {
        const wIdx = i + slot;
        if (wIdx >= job.windows.length) break;
        const w = job.windows[wIdx];
        const slotY = y + slot * 130; // Each window gets ~130mm

        // Window title
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(28, 46, 15);
        doc.text(`Window ${wIdx + 1}: ${w.label || ""}`, mx, slotY + 6);

        // Photo
        let photoEndX = mx;
        const photoSrc = w.main_photo || w.main_photo_url;
        if (photoSrc) {
          try {
            const img = await loadImage(photoSrc);
            if (img) {
              const maxW = 70, maxH = 52;
              let iw = img.width, ih = img.height;
              const scale = Math.min(maxW / iw, maxH / ih);
              iw *= scale; ih *= scale;
              doc.addImage(img, "JPEG", mx, slotY + 9, iw, ih);
              photoEndX = mx + iw + 4;
            }
          } catch {}
        }

        // Measurements table beside photo
        const measX = Math.max(photoEndX, mx + 74);
        const measFields = [
          ["Inside Width", w.measurements?.inside_width],
          ["Outside Width", w.measurements?.outside_width],
          ["Inside Length", w.measurements?.inside_length],
          ["Outside Length", w.measurements?.outside_length],
          ["Treatment Width", w.measurements?.treatment_width],
          ["Treatment Drop", w.measurements?.treatment_drop],
          ["L Wall → Arch.", w.measurements?.left_wall_to_arch],
          ["R Wall → Arch.", w.measurements?.right_wall_to_arch],
          ["Arch. → Ceiling", w.measurements?.arch_to_ceiling],
          ["Arch. → Floor", w.measurements?.arch_to_floor],
        ];

        let my = slotY + 9;
        // Table header
        doc.setFillColor(28, 46, 15);
        doc.rect(measX, my, mxr - measX, 6, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("Measurement", measX + 2, my + 4.5);
        doc.text("mm", mxr - 2, my + 4.5, { align: "right" });
        my += 6;

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "normal");
        measFields.forEach(([label, val], mi) => {
          const bg = mi % 2 === 0 ? 248 : 241;
          doc.setFillColor(bg, bg, bg);
          doc.rect(measX, my, mxr - measX, 5, "F");
          doc.setFontSize(7);
          doc.text(label, measX + 2, my + 3.8);
          doc.setFont("helvetica", "bold");
          doc.text(val || "—", mxr - 2, my + 3.8, { align: "right" });
          doc.setFont("helvetica", "normal");
          my += 5;
        });

        // Comments
        if (w.comments) {
          const commY = slotY + 65;
          doc.setFillColor(242, 249, 231);
          doc.roundedRect(mx, commY, cw, 14, 2, 2, "F");
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(141, 199, 63);
          doc.text("COMMENTS", mx + 3, commY + 4);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(8);
          const lines = doc.splitTextToSize(w.comments, cw - 6);
          doc.text(lines.slice(0, 2), mx + 3, commY + 9);
        }

        // Extra photos strip
        const extras = w.extra_photos?.filter(Boolean) || [];
        if (extras.length > 0) {
          let ex = mx;
          const eY = slotY + (w.comments ? 82 : 65);
          for (let ei = 0; ei < Math.min(extras.length, 5); ei++) {
            try {
              const eImg = await loadImage(extras[ei]);
              if (eImg) {
                doc.addImage(eImg, "JPEG", ex, eY, 30, 22);
                ex += 33;
              }
            } catch {}
          }
        }

        // Divider between windows
        if (slot === 0 && i + 1 < job.windows.length) {
          const divY = slotY + 126;
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(mx, divY, mxr, divY);
        }
      }
    }

    // Save
    const filename = `${(job.lead_name || "measure").replace(/\s+/g, "_")}_check_measure.pdf`;
    doc.save(filename);
    showToast("PDF downloaded ✓");
  } catch (err) {
    console.error("PDF export error:", err);
    showToast("PDF export failed");
  }
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("list"); // list | job | window
  const [jobs, setJobs] = useState([]);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [currentWindowIdx, setCurrentWindowIdx] = useState(null);
  const [toast, setToast] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [leads, setLeads] = useState([]);
  const [showAddLead, setShowAddLead] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch "In Progress" leads from Supabase
  const fetchLeads = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    try {
      const url = `${SUPABASE_URL}/rest/v1/leads?select=id,name,phone,email,street,suburb,postcode,status&status=eq.In%20Progress&order=name.asc`;
      console.log("Fetching leads from:", url);
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) {
        console.error("Leads fetch failed:", res.status, await res.text());
        return;
      }
      const data = await res.json();
      console.log("Leads loaded:", data.length, data);
      if (Array.isArray(data)) setLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  };

  // Fetch jobs from Supabase and merge with local
  const fetchFromSupabase = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    try {
      const res = await fetch(
          `${SUPABASE_URL}/rest/v1/check_measures?select=*,leads(id,name,phone,email,street,suburb,postcode)&order=created_at.desc`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!res.ok) return;
        const remoteRows = await res.json();
        if (!Array.isArray(remoteRows)) return;

        // If Supabase has zero rows, remove all local synced jobs
        if (remoteRows.length === 0) {
          setJobs((prev) => prev.filter((j) => !j.synced));
          setSupabaseConnected(true);
          setLastRefresh(new Date());
          return;
        }

        setJobs((prev) => {
          const remoteIds = new Set(remoteRows.map((r) => r.id));
          
          // Remove local synced jobs that no longer exist in Supabase (deleted on another device)
          const filtered = prev.filter((j) => !j.synced || remoteIds.has(j.id));
          
          const localIds = new Set(filtered.map((j) => j.id));
          const merged = [...filtered];

          for (const row of remoteRows) {
            if (!localIds.has(row.id)) {
              const lead = row.leads || {};
              const windowData = Array.isArray(row.measurements_json) ? row.measurements_json
                : Array.isArray(row.windows) ? row.windows : [];
              
              const windows = windowData.map((w) => {
                const mainPhoto = w.main_photo_url || w.main_photo || null;
                const extraPhotos = w.extra_photo_urls || w.extra_photos || [];
                return {
                  id: w.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
                  label: w.label || "Window",
                  main_photo: mainPhoto,
                  main_photo_url: mainPhoto,
                  extra_photos: extraPhotos,
                  extra_photo_urls: extraPhotos,
                  measurements: w.measurements || {},
                  comments: w.comments || "",
                };
              });

              merged.push({
                id: row.id,
                lead_id: row.lead_id || null,
                lead_name: lead.name || "",
                phone: lead.phone || "",
                email: lead.email || "",
                street: lead.street || "",
                suburb: lead.suburb || "",
                postcode: lead.postcode || "",
                measure_date: row.measure_date || "",
                measure_time: row.measure_time || "",
                windows,
                synced: true,
                created_at: row.created_at,
              });
            } else {
              // Update local job with cloud data (photos, synced status)
              const idx = merged.findIndex((j) => j.id === row.id);
              if (idx !== -1) {
                const localJob = merged[idx];
                const windowData = Array.isArray(row.measurements_json) ? row.measurements_json
                  : Array.isArray(row.windows) ? row.windows : [];
                
                // Update windows with cloud photo URLs where local photos are missing
                const updatedWindows = localJob.windows.map((lw) => {
                  const rw = windowData.find((r) => r.id === lw.id);
                  if (!rw) return lw;
                  return {
                    ...lw,
                    main_photo: lw.main_photo || rw.main_photo_url || rw.main_photo || lw.main_photo,
                    main_photo_url: rw.main_photo_url || lw.main_photo_url || null,
                    extra_photos: lw.extra_photos.length > 0 ? lw.extra_photos : (rw.extra_photo_urls || rw.extra_photos || []),
                    extra_photo_urls: rw.extra_photo_urls || lw.extra_photo_urls || [],
                  };
                });
                
                merged[idx] = { ...localJob, windows: updatedWindows, synced: true };
              }
            }
          }
          return merged;
        });

        setSupabaseConnected(true);
        setLastRefresh(new Date());
      } catch (err) {
        console.error("Supabase fetch error:", err);
      }
  }, []);

  // Manual refresh
  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFromSupabase(), fetchLeads()]);
    setRefreshing(false);
  }, [fetchFromSupabase]);

  // Load from localStorage on mount, then fetch from Supabase
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cmb_jobs");
      if (saved) setJobs(JSON.parse(saved));
    } catch {}

    fetchFromSupabase();
    fetchLeads();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchFromSupabase();
      fetchLeads();
    }, 30000);

    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("cmb_jobs", JSON.stringify(jobs));
    } catch (err) {
      console.warn("localStorage save failed (likely quota exceeded):", err.message);
    }
  }, [jobs]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const currentJob = jobs.find((j) => j.id === currentJobId) || null;
  const currentWindow = currentJob?.windows?.[currentWindowIdx] || null;

  // ---- Job CRUD ----
  const createJob = () => {
    const newJob = {
      id: genId(),
      lead_id: null,
      lead_name: "",
      phone: "",
      email: "",
      street: "",
      suburb: "",
      postcode: "",
      measure_date: "",
      measure_time: "",
      windows: [],
      synced: false,
      created_at: new Date().toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);
    setCurrentJobId(newJob.id);
    setScreen("job");
  };

  const selectLead = (leadId) => {
    const lead = leads.find((l) => String(l.id) === String(leadId));
    if (!lead) {
      console.warn("Lead not found. ID:", leadId, "Available:", leads.map(l => ({ id: l.id, name: l.name })));
      return;
    }
    if (!currentJob) return;
    updateJob(currentJob.id, {
      lead_id: lead.id,
      lead_name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      street: lead.street || "",
      suburb: lead.suburb || "",
      postcode: lead.postcode || "",
    });
  };

  const updateJob = (id, updates) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates, synced: false } : j)));
  };

  // Map local job fields to leads table column names
  const LEAD_FIELD_MAP = {
    lead_name: "name",
    phone: "phone",
    email: "email",
    street: "street",
    suburb: "suburb",
    postcode: "postcode",
    measure_date: "cm_date",
  };

  // Debounce timer ref for lead updates
  const leadUpdateTimer = useRef(null);

  const updateLeadField = (jobId, field, value) => {
    // Update local job immediately
    updateJob(jobId, { [field]: value });

    // Debounce the Supabase update (wait 800ms after last keystroke)
    const job = jobs.find((j) => j.id === jobId);
    const leadId = job?.lead_id;
    if (!leadId || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    const supabaseCol = LEAD_FIELD_MAP[field];
    if (!supabaseCol) return;

    clearTimeout(leadUpdateTimer.current);
    leadUpdateTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`,
          {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ [supabaseCol]: value }),
          }
        );
        if (!res.ok) console.error("Lead update failed:", res.status);
      } catch (err) {
        console.error("Lead update error:", err);
      }
    }, 800);
  };

  const deleteJob = async (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (currentJobId === id) { setCurrentJobId(null); setScreen("list"); }

    // Also delete from Supabase if connected
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/check_measures?id=eq.${id}`, {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
      } catch (err) {
        console.error("Failed to delete from Supabase:", err);
      }
    }

    showToast("Job deleted");
  };

  // ---- Window CRUD ----
  const addWindow = () => {
    const j = jobs.find((j) => j.id === currentJobId);
    if (!j) return;
    const newWin = {
      id: genId(),
      label: `Window ${j.windows.length + 1}`,
      main_photo: null,
      extra_photos: [],
      measurements: blankMeasurements(),
      comments: "",
    };
    updateJob(currentJobId, { windows: [...j.windows, newWin] });
    setCurrentWindowIdx(j.windows.length);
    setScreen("window");
  };

  const updateWindow = (windowIdx, updates) => {
    const j = jobs.find((j) => j.id === currentJobId);
    if (!j) return;
    const windows = j.windows.map((w, i) => (i === windowIdx ? { ...w, ...updates } : w));
    updateJob(currentJobId, { windows });
  };

  const deleteWindow = (windowIdx) => {
    const j = jobs.find((j) => j.id === currentJobId);
    if (!j) return;
    const windows = j.windows.filter((_, i) => i !== windowIdx);
    updateJob(currentJobId, { windows });
    setScreen("job");
    showToast("Window removed");
  };

  // ---- Sync to Supabase ----
  // Upload a base64 data URL to Supabase Storage, returns public URL
  const uploadPhoto = async (base64DataUrl, path) => {
    // Convert base64 to blob
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/window-photos/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": blob.type || "image/jpeg",
        "x-upsert": "true",
      },
      body: blob,
    });
    if (!uploadRes.ok) {
      console.error("Photo upload failed:", uploadRes.status, await uploadRes.text());
      return null;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/window-photos/${path}`;
  };

  const syncJob = async (jobId) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setShowSetup(true);
      return;
    }
    try {
      // Upload photos for each window
      const windowsSummary = [];
      for (const w of job.windows) {
        let mainPhotoUrl = w.main_photo_url || null;
        const extraPhotoUrls = [...(w.extra_photo_urls || [])];

        // Upload main photo if it's a base64 string (not already a URL)
        if (w.main_photo && w.main_photo.startsWith("data:")) {
          showToast("Uploading photos...");
          const url = await uploadPhoto(w.main_photo, `${job.id}/${w.id}/main.jpg`);
          if (url) mainPhotoUrl = url;
        }

        // Upload extra photos
        for (let i = 0; i < w.extra_photos.length; i++) {
          if (w.extra_photos[i] && w.extra_photos[i].startsWith("data:")) {
            const url = await uploadPhoto(w.extra_photos[i], `${job.id}/${w.id}/extra_${i}.jpg`);
            if (url) extraPhotoUrls[i] = url;
          }
        }

        windowsSummary.push({
          id: w.id,
          label: w.label,
          measurements: w.measurements,
          comments: w.comments,
          main_photo_url: mainPhotoUrl,
          extra_photo_urls: extraPhotoUrls,
        });
      }

      const payload = {
        id: job.id,
        lead_id: job.lead_id || null,
        measure_date: job.measure_date || null,
        measure_time: job.measure_time || null,
        windows: windowsSummary,
        measurements_json: windowsSummary,
        created_at: job.created_at,
      };

      // Use upsert so re-syncing the same job doesn't fail
      const res = await fetch(`${SUPABASE_URL}/rest/v1/check_measures`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation,resolution=merge-duplicates",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Supabase error:", res.status, errBody);
        throw new Error(`Sync failed (${res.status}): ${errBody}`);
      }

      // Update local jobs with the cloud URLs so we don't re-upload next time
      setJobs((prev) => prev.map((j) => {
        if (j.id !== jobId) return j;
        const updatedWindows = j.windows.map((w, i) => ({
          ...w,
          main_photo_url: windowsSummary[i]?.main_photo_url || null,
          extra_photo_urls: windowsSummary[i]?.extra_photo_urls || [],
        }));
        return { ...j, windows: updatedWindows, synced: true };
      }));
      setSupabaseConnected(true);
      setSyncSuccess(job.lead_name || "Job");
      setTimeout(() => setSyncSuccess(null), 2500);
    } catch (err) {
      console.error("Sync error:", err);
      showToast("Sync failed — check console for details");
    }
  };

  // ---- NAVIGATION ----
  const goList = () => { setScreen("list"); setCurrentJobId(null); setCurrentWindowIdx(null); };
  const goJob = (id) => { setCurrentJobId(id); setScreen("job"); setCurrentWindowIdx(null); };
  const goWindow = (idx) => { setCurrentWindowIdx(idx); setScreen("window"); };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* ----------- SCREEN: JOB LIST ----------- */}
        {screen === "list" && (
          <>
            <div className="header">
              <div className="header-title">Check Measures</div>
              <div className="header-actions">
                <button
                  className="btn btn-ghost"
                  style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500 }}
                  onClick={manualRefresh}
                  disabled={refreshing}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                  </svg>
                  {lastRefresh
                    ? lastRefresh.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
                    : "—"
                  }
                </button>
              </div>
            </div>
            <div className="scroll-area">
              {jobs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Icons.Ruler size={48} /></div>
                  <div className="empty-title">No Measure Jobs Yet</div>
                  <div className="empty-desc">Tap the + button to create your first check measure job.</div>
                </div>
              ) : (
                <div className="card" style={{ margin: "16px", borderRadius: "var(--radius)" }}>
                  {jobs.map((job) => (
                    <div className="job-item" key={job.id} onClick={() => goJob(job.id)}>
                      <div className="job-avatar"><Icons.User size={20} /></div>
                      <div className="job-info">
                        <div className="job-name">{job.lead_name || "Untitled Lead"}</div>
                        <div className="job-address">{[job.street, job.suburb, job.postcode].filter(Boolean).join(", ") || job.address || "No address"}</div>
                        <div style={{ marginTop: 4 }}>
                          {job.synced ? (
                            <span className="pill pill-synced"><Icons.Check size={10} /> Synced</span>
                          ) : (
                            <span className="pill pill-local">Local only</span>
                          )}
                        </div>
                      </div>
                      <div className="job-meta">
                        <div className="job-count">{job.windows.length} window{job.windows.length !== 1 ? "s" : ""}</div>
                        <div className="job-date">{formatDate(job.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="fab" onClick={createJob}><Icons.Plus size={24} /></button>
          </>
        )}

        {/* ----------- SCREEN: JOB DETAIL ----------- */}
        {screen === "job" && currentJob && (
          <>
            <div className="header">
              <button className="header-back" onClick={goList}>
                <Icons.ChevronLeft size={18} /> Jobs
              </button>
              <div style={{ flex: 1 }} />
              <div className="header-actions">
                {currentJob.synced ? (
                  <span className="pill pill-synced"><Icons.Check size={12} /> Synced</span>
                ) : (
                  <span className="pill pill-local">Local</span>
                )}
                <button className="btn btn-ghost" onClick={() => syncJob(currentJob.id)} title="Sync to Supabase">
                  <Icons.Cloud size={18} />
                </button>
              </div>
            </div>
            <div className="scroll-area">
              <div className="p-16">
                {/* Lead Details */}
                <div className="section-title">Lead Details</div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-body">
                    <div className="field">
                      <label className="field-label">Select Lead</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <select
                          className="field-input"
                          style={{ flex: 1 }}
                          value={currentJob.lead_id || ""}
                          onChange={(e) => {
                            if (e.target.value) selectLead(e.target.value);
                          }}
                        >
                          <option value="">— Choose a lead —</option>
                          {leads.map((lead) => (
                            <option key={lead.id} value={lead.id}>{lead.name}</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-primary"
                          style={{ flexShrink: 0, padding: "10px 14px" }}
                          onClick={() => setShowAddLead(true)}
                        >
                          <Icons.Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">Lead Name</label>
                      <input
                        className="field-input"
                        placeholder="Auto-filled from lead"
                        value={currentJob.lead_name}
                        onChange={(e) => updateLeadField(currentJob.id, "lead_name", e.target.value)}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="field">
                        <label className="field-label">Phone</label>
                        <input
                          className="field-input"
                          type="tel"
                          placeholder="Auto-filled"
                          value={currentJob.phone}
                          onChange={(e) => updateLeadField(currentJob.id, "phone", e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label">Email</label>
                        <input
                          className="field-input"
                          type="email"
                          placeholder="Auto-filled"
                          value={currentJob.email || ""}
                          onChange={(e) => updateLeadField(currentJob.id, "email", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">Street</label>
                      <input
                        className="field-input"
                        placeholder="e.g. 42 Brunswick St"
                        value={currentJob.street || ""}
                        onChange={(e) => updateLeadField(currentJob.id, "street", e.target.value)}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                      <div className="field">
                        <label className="field-label">Suburb</label>
                        <input
                          className="field-input"
                          placeholder="e.g. Fitzroy"
                          value={currentJob.suburb || ""}
                          onChange={(e) => updateLeadField(currentJob.id, "suburb", e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label">Postcode</label>
                        <input
                          className="field-input"
                          placeholder="3065"
                          value={currentJob.postcode || ""}
                          onChange={(e) => updateLeadField(currentJob.id, "postcode", e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="field">
                        <label className="field-label">Measure Date</label>
                        <input
                          className="field-input"
                          type="date"
                          value={currentJob.measure_date}
                          onChange={(e) => updateLeadField(currentJob.id, "measure_date", e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label">Time</label>
                        <input
                          className="field-input"
                          type="time"
                          value={currentJob.measure_time}
                          onChange={(e) => updateJob(currentJob.id, { measure_time: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Windows */}
                <div className="flex-between">
                  <div className="section-title" style={{ padding: "0 0 8px" }}>
                    Windows ({currentJob.windows.length})
                  </div>
                </div>

                {currentJob.windows.length === 0 ? (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--warm-300)" }}>
                      <Icons.Window size={32} color="var(--warm-200)" />
                      <p style={{ marginTop: 8, fontSize: 13 }}>No windows added yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ marginBottom: 16 }}>
                    {currentJob.windows.map((win, idx) => (
                      <div className="window-item" key={win.id} onClick={() => goWindow(idx)}>
                        <div className="window-thumb">
                          {win.main_photo ? (
                            <img src={win.main_photo} alt="" />
                          ) : (
                            <Icons.Window size={20} color="var(--warm-200)" />
                          )}
                        </div>
                        <div className="window-info">
                          <div className="window-label">{win.label}</div>
                          <div className="window-dims">
                            {win.measurements.inside_width && win.measurements.inside_length
                              ? `${win.measurements.inside_width} × ${win.measurements.inside_length}mm`
                              : "No measurements yet"}
                          </div>
                        </div>
                        <Icons.ChevronRight size={18} color="var(--warm-200)" />
                      </div>
                    ))}
                  </div>
                )}

                <button className="btn btn-secondary btn-block" onClick={addWindow}>
                  <Icons.Plus size={16} /> Add Window
                </button>

                <div className="divider" />

                <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }} onClick={() => exportJobPDF(currentJob, showToast)}>
                  <Icons.Download size={16} /> Export PDF
                </button>

                <button className="btn btn-danger btn-block" style={{ marginTop: 8 }} onClick={() => {
                  if (confirm("Delete this entire job?")) deleteJob(currentJob.id);
                }}>
                  <Icons.Trash size={16} /> Delete Job
                </button>
              </div>
            </div>
          </>
        )}

        {/* ----------- SCREEN: WINDOW DETAIL ----------- */}
        {screen === "window" && currentJob && currentWindow && (
          <WindowDetail
            job={currentJob}
            window={currentWindow}
            windowIdx={currentWindowIdx}
            totalWindows={currentJob.windows.length}
            onBack={() => setScreen("job")}
            onUpdate={(updates) => updateWindow(currentWindowIdx, updates)}
            onDelete={() => deleteWindow(currentWindowIdx)}
            onNext={() => {
              if (currentWindowIdx < currentJob.windows.length - 1) {
                setCurrentWindowIdx(currentWindowIdx + 1);
              }
            }}
            onPrev={() => {
              if (currentWindowIdx > 0) {
                setCurrentWindowIdx(currentWindowIdx - 1);
              }
            }}
            showToast={showToast}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.includes("failed") ? "toast-error" : ""}`}>
            {toast.includes("failed") ? <Icons.X size={16} /> : <Icons.Check size={16} />} {toast}
          </div>
        )}

        {/* Sync Success Overlay */}
        {syncSuccess && (
          <div className="sync-overlay" onClick={() => setSyncSuccess(null)}>
            <div className="sync-overlay-card" onClick={(e) => e.stopPropagation()}>
              <div className="sync-check-circle">
                <Icons.Check size={32} />
              </div>
              <div className="sync-overlay-title">Synced to Cloud</div>
              <div className="sync-overlay-desc">
                {syncSuccess}'s measurements have been saved to Supabase successfully.
              </div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={() => setSyncSuccess(null)}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* Setup Modal */}
        {showSetup && (
          <SetupModal onClose={() => setShowSetup(false)} />
        )}

        {showAddLead && (
          <AddLeadModal
            onClose={() => setShowAddLead(false)}
            onSaved={(newLead) => {
              setLeads((prev) => [...prev, newLead].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
              if (currentJob) {
                updateJob(currentJob.id, {
                  lead_id: newLead.id,
                  lead_name: newLead.name || "",
                  phone: newLead.phone || "",
                  email: newLead.email || "",
                  street: newLead.street || "",
                  suburb: newLead.suburb || "",
                  postcode: newLead.postcode || "",
                });
              }
              showToast("Lead added ✓");
            }}
          />
        )}
      </div>
    </>
  );
}

// ============================================================
// WINDOW DETAIL VIEW
// ============================================================
function WindowDetail({ job, window: win, windowIdx, totalWindows, onBack, onUpdate, onDelete, onNext, onPrev, showToast }) {
  const mainPhotoRef = useRef(null);
  const extraPhotoRef = useRef(null);
  const [drawingPhoto, setDrawingPhoto] = useState(null); // { src, target: 'main' | index }

  const handleMainPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await readFileAsDataURL(file);
    const dataUrl = await compressImage(raw);
    // Open drawing editor immediately after capture
    setDrawingPhoto({ src: dataUrl, target: "main" });
  };

  const handleExtraPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const rawUrls = await Promise.all(files.map(readFileAsDataURL));
    const urls = await Promise.all(rawUrls.map((u) => compressImage(u)));
    // Open drawing editor for the first new photo
    const newIndex = win.extra_photos.length;
    onUpdate({ extra_photos: [...win.extra_photos, ...urls] });
    setDrawingPhoto({ src: urls[0], target: newIndex });
  };

  const removeExtraPhoto = (idx) => {
    onUpdate({ extra_photos: win.extra_photos.filter((_, i) => i !== idx) });
  };

  const updateMeas = (key, val) => {
    onUpdate({ measurements: { ...win.measurements, [key]: val } });
  };

  return (
    <>
      <div className="header">
        <button className="header-back" onClick={onBack}>
          <Icons.ChevronLeft size={18} /> Back
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--warm-300)" }}>
            {windowIdx + 1} of {totalWindows}
          </span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" disabled={windowIdx === 0} onClick={onPrev}>
            <Icons.ChevronLeft size={18} />
          </button>
          <button className="btn btn-ghost" disabled={windowIdx === totalWindows - 1} onClick={onNext}>
            <Icons.ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="scroll-area">
        <div className="p-16">
          {/* Window Label */}
          <div className="field">
            <label className="field-label">Window Name / Location</label>
            <input
              className="field-input"
              placeholder="e.g. Master Bedroom — North Wall"
              value={win.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </div>

          {/* Main Photo */}
          <div className="section-title" style={{ padding: "8px 0" }}>Window Photo</div>
          <div className="photo-main" onClick={() => !win.main_photo && mainPhotoRef.current?.click()}>
            {win.main_photo ? (
              <>
                <img src={win.main_photo} alt="Window" />
                <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6, zIndex: 2 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}
                    onClick={(e) => { e.stopPropagation(); setDrawingPhoto({ src: win.main_photo, target: "main" }); }}
                  >
                    <Icons.Pen size={14} /> Annotate
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}
                    onClick={(e) => { e.stopPropagation(); mainPhotoRef.current?.click(); }}
                  >
                    <Icons.Camera size={14} /> Replace
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ background: "rgba(220,38,38,0.8)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Remove this photo?")) onUpdate({ main_photo: null, main_photo_url: null });
                    }}
                  >
                    <Icons.Trash size={14} /> Remove
                  </button>
                </div>
              </>
            ) : (
              <>
                <Icons.Camera size={32} color="var(--warm-300)" />
                <span className="photo-main-label">Tap to take or upload photo</span>
              </>
            )}
          </div>
          <input
            ref={mainPhotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleMainPhoto}
          />

          {/* Extra Photos */}
          <div className="mt-16">
            <div className="section-title" style={{ padding: "0 0 8px" }}>Additional Photos</div>
            <div className="photo-strip">
              {win.extra_photos.map((url, idx) => (
                <div className="photo-thumb" key={idx} onClick={() => setDrawingPhoto({ src: url, target: idx })}>
                  <img src={url} alt="" />
                  <div className="photo-thumb-remove" onClick={(e) => { e.stopPropagation(); if (confirm("Remove this photo?")) removeExtraPhoto(idx); }}>×</div>
                </div>
              ))}
              <div className="photo-add-small" onClick={() => extraPhotoRef.current?.click()}>
                <Icons.Plus size={20} color="var(--warm-300)" />
              </div>
            </div>
            <input
              ref={extraPhotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: "none" }}
              onChange={handleExtraPhotos}
            />
          </div>

          {/* Measurements */}
          <div className="meas-section-header">
            <div className="meas-section-dot" style={{ background: "var(--blue)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--blue)" }}>
              Window Measurements
            </span>
          </div>
          <div className="card mb-16">
            <div className="card-body">
              <div className="meas-grid">
                {MEASUREMENT_FIELDS.slice(0, 4).map((f) => (
                  <div className="meas-item" key={f.key}>
                    <span className="meas-label">{f.label}</span>
                    <input
                      className="meas-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={win.measurements[f.key]}
                      onChange={(e) => updateMeas(f.key, e.target.value)}
                    />
                    <span className="meas-unit">mm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="meas-section-header">
            <div className="meas-section-dot" style={{ background: "var(--accent)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)" }}>
              Treatment Dimensions
            </span>
          </div>
          <div className="card mb-16">
            <div className="card-body">
              <div className="meas-grid">
                {MEASUREMENT_FIELDS.slice(4, 6).map((f) => (
                  <div className="meas-item" key={f.key}>
                    <span className="meas-label">{f.label}</span>
                    <input
                      className="meas-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={win.measurements[f.key]}
                      onChange={(e) => updateMeas(f.key, e.target.value)}
                    />
                    <span className="meas-unit">mm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="meas-section-header">
            <div className="meas-section-dot" style={{ background: "var(--success)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--success)" }}>
              Architrave & Surrounds
            </span>
          </div>
          <div className="card mb-16">
            <div className="card-body">
              <div className="meas-grid">
                {MEASUREMENT_FIELDS.slice(6).map((f) => (
                  <div className="meas-item" key={f.key}>
                    <span className="meas-label">{f.label}</span>
                    <input
                      className="meas-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={win.measurements[f.key]}
                      onChange={(e) => updateMeas(f.key, e.target.value)}
                    />
                    <span className="meas-unit">mm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="section-title" style={{ padding: "0 0 8px" }}>Comments & Notes</div>
          <div className="card mb-16">
            <div className="card-body">
              <textarea
                className="field-input"
                placeholder="Describe the window, note any issues, obstructions, special requirements..."
                value={win.comments}
                onChange={(e) => onUpdate({ comments: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <div className="divider" />

          <button className="btn btn-danger btn-block" onClick={() => {
            if (confirm("Remove this window?")) onDelete();
          }}>
            <Icons.Trash size={16} /> Remove Window
          </button>
        </div>
      </div>

      {/* Drawing Editor */}
      {drawingPhoto && (
        <DrawingEditor
          imageSrc={drawingPhoto.src}
          onClose={() => setDrawingPhoto(null)}
          onSave={(annotatedDataUrl) => {
            if (drawingPhoto.target === "main") {
              onUpdate({ main_photo: annotatedDataUrl });
            } else if (typeof drawingPhoto.target === "number") {
              const updated = [...win.extra_photos];
              updated[drawingPhoto.target] = annotatedDataUrl;
              onUpdate({ extra_photos: updated });
            }
            setDrawingPhoto(null);
            showToast("Annotation saved");
          }}
        />
      )}
    </>
  );
}

// ============================================================
// SETUP MODAL
// ============================================================
function SetupModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, maxWidth: 480, width: "100%",
        padding: 24, maxHeight: "80vh", overflow: "auto",
      }}>
        <div className="flex-between mb-16">
          <h2 style={{ fontWeight: 700, fontSize: 24 }}>Supabase Setup</h2>
          <button className="btn btn-ghost" onClick={onClose}><Icons.X size={20} /></button>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--warm-300)", marginBottom: 16 }}>
          To sync your measurements to the cloud, you need a Supabase project. Follow these steps:
        </p>

        <div style={{ background: "var(--warm-100)", borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
          <strong>1.</strong> Go to <span style={{ color: "var(--accent)" }}>supabase.com</span> and create a free project<br />
          <strong>2.</strong> In the SQL Editor, run this query:<br />
          <pre style={{
            background: "var(--ink)", color: "#f0f0f0", padding: 12, borderRadius: 6,
            fontSize: 11, overflow: "auto", margin: "8px 0", lineHeight: 1.5,
          }}>{`CREATE TABLE check_measures (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  lead_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  street TEXT DEFAULT '',
  suburb TEXT DEFAULT '',
  postcode TEXT DEFAULT '',
  address TEXT DEFAULT '',
  measure_date DATE,
  measure_time TEXT,
  windows JSONB DEFAULT '[]',
  measurements_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE check_measures
  ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert + select + update
CREATE POLICY "Allow all"
  ON check_measures FOR ALL
  USING (true)
  WITH CHECK (true);`}</pre>
          <strong>3.</strong> Go to Project Settings → API and copy your <strong>Project URL</strong> and <strong>anon key</strong><br />
          <strong>4.</strong> Add them to your <code>.env</code> file:<br />
          <pre style={{
            background: "var(--ink)", color: "#f0f0f0", padding: 12, borderRadius: 6,
            fontSize: 11, overflow: "auto", margin: "8px 0", lineHeight: 1.5,
          }}>{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}</pre>
          <strong>5.</strong> Restart your dev server for the changes to take effect
        </div>

        <p style={{ fontSize: 12, color: "var(--warm-300)", marginBottom: 16 }}>
          Until configured, all data is stored locally on your device. Nothing is lost.
        </p>

        <button className="btn btn-primary btn-block" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

// ============================================================
// ADD LEAD MODAL
// ============================================================
const ADD_LEAD_SOURCES = ["Referral","Previous Customer","Facebook","Website Form","Phone Call","Walk In","Shows & Exhibition","Trade Customer","Call & Online","Trade & Repeat"];
const ADD_LEAD_STATUSES = ["In Progress","Approved","Rejected","Uncontactable","Delayed"];
const ADD_LEAD_WARMTH = ["","Unlikely","Likely","Verbally Approved"];

const emptyLead = () => ({
  name: "", email: "", phone: "",
  street: "", suburb: "", postcode: "",
  source: ADD_LEAD_SOURCES[0],
  status: ADD_LEAD_STATUSES[0],
  warmth: "",
  first_contact: new Date().toISOString().split("T")[0],
  next_contact: "", quote_value: "", quote_number: "",
  book_number: "", cm_date: "", quote_sent_date: "",
  brief_note: "", detailed_note: "", notes: [],
});

function AddLeadModal({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyLead());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Lead name is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const cleaned = { ...form };
      ["first_contact","next_contact","cm_date","quote_sent_date","approved_date","rejected_date"].forEach((k) => {
        if (cleaned[k] === "" || cleaned[k] === undefined) cleaned[k] = null;
      });
      if (cleaned.quote_value === "" || cleaned.quote_value === undefined) cleaned.quote_value = null;
      if (Array.isArray(cleaned.notes)) cleaned.notes = JSON.stringify(cleaned.notes);

      const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) throw new Error("Insert failed");
      const result = await res.json();
      const newLead = Array.isArray(result) ? result[0] : result;
      if (onSaved) onSaved(newLead);
      onClose();
    } catch (e) {
      setError("Failed to save. Check your Supabase connection.");
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, maxWidth: 560, width: "100%",
        maxHeight: "90vh", overflowY: "auto", padding: 0,
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--warm-100)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--warm-300)", textTransform: "uppercase", marginBottom: 4 }}>New Lead</div>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Smith Residence"
              style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", border: "none", outline: "none", width: "100%", fontFamily: "var(--font-body)", background: "transparent" }}
            />
          </div>
          <button className="btn btn-ghost" onClick={onClose}><Icons.X size={20} /></button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 24px" }}>
          <div className="section-title" style={{ padding: "0 0 12px" }}>Contact Details</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label className="field-label">Phone</label>
              <input className="field-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Street</label>
            <input className="field-input" value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="e.g. 42 Example Street" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div className="field">
              <label className="field-label">Suburb</label>
              <input className="field-input" value={form.suburb} onChange={(e) => set("suburb", e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Postcode</label>
              <input className="field-input" value={form.postcode} onChange={(e) => set("postcode", e.target.value)} />
            </div>
          </div>

          <div className="divider" />
          <div className="section-title" style={{ padding: "0 0 12px" }}>Lead Details</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label className="field-label">Source</label>
              <select className="field-input" value={form.source} onChange={(e) => set("source", e.target.value)}>
                {ADD_LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Warmth</label>
              <select className="field-input" value={form.warmth} onChange={(e) => set("warmth", e.target.value)}>
                {ADD_LEAD_WARMTH.map((s) => <option key={s} value={s}>{s || "—"}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label className="field-label">First Contact</label>
              <input className="field-input" type="date" value={form.first_contact} onChange={(e) => set("first_contact", e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Quote Value ($)</label>
              <input className="field-input" type="number" value={form.quote_value} onChange={(e) => set("quote_value", e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Brief Note</label>
            <input className="field-input" value={form.brief_note} onChange={(e) => set("brief_note", e.target.value)} placeholder="One-line summary" />
          </div>

          {error && (
            <div style={{ background: "var(--danger-bg)", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DRAWING EDITOR
// ============================================================
const DRAW_COLORS = ["#EF4444", "#8DC73F", "#3B82F6", "#F59E0B", "#FFFFFF", "#000000"];
const DRAW_SIZES = [3, 6, 12];

function DrawingEditor({ imageSrc, onSave, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [lineWidth, setLineWidth] = useState(DRAW_SIZES[1]);
  const [history, setHistory] = useState([]);
  const imgRef = useRef(null);
  const lastPoint = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const maxW = Math.min(img.width, 1200);
      const scale = maxW / img.width;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHistory([canvas.toDataURL()]);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    lastPoint.current = pos;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPoint.current = pos;
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;
    setHistory((prev) => [...prev, canvasRef.current.toDataURL()]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = newHistory[newHistory.length - 1];
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.85);
    onSave(dataUrl);
  };

  return (
    <div className="draw-overlay">
      <div className="draw-toolbar">
        <button className="draw-btn draw-btn-cancel" onClick={onClose}>Cancel</button>
        <div className="draw-toolbar-title" style={{ textAlign: "center" }}>Annotate Photo</div>
        <button className="draw-btn draw-btn-save" onClick={handleSave}>
          <Icons.Check size={16} /> Save
        </button>
      </div>
      <div className="draw-canvas-wrap">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          style={{ cursor: "crosshair" }}
        />
      </div>
      <div className="draw-bottom-bar">
        {DRAW_COLORS.map((c) => (
          <button
            key={c}
            className={`draw-color-btn ${color === c ? "active" : ""}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
        <div style={{ width: 1, height: 24, background: "#444", margin: "0 4px" }} />
        {DRAW_SIZES.map((s) => (
          <button
            key={s}
            className={`draw-size-btn ${lineWidth === s ? "active" : ""}`}
            onClick={() => setLineWidth(s)}
          >
            <div style={{ width: s + 2, height: s + 2, borderRadius: "50%", background: "#fff" }} />
          </button>
        ))}
        <div style={{ width: 1, height: 24, background: "#444", margin: "0 4px" }} />
        <button
          className="draw-btn draw-btn-tool"
          onClick={undo}
          disabled={history.length <= 1}
          style={{ opacity: history.length <= 1 ? 0.4 : 1 }}
        >
          <Icons.Undo size={16} /> Undo
        </button>
      </div>
    </div>
  );
}