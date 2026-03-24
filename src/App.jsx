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
  width: 100%; padding: 8px 32px 8px 10px; border: 1.5px solid var(--warm-200);
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
  width: 100%; min-height: 120px; background: var(--warm-100);
  border-radius: var(--radius-sm); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; border: 2px dashed var(--warm-200); transition: all 0.2s;
  overflow: hidden; position: relative;
}
.photo-main:hover { border-color: var(--accent); background: var(--accent-bg); }
.photo-main img { width: 100%; height: auto; display: block; }
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
@keyframes refresh-flash {
  0% { color: rgba(141,199,63,1); }
  100% { color: rgba(255,255,255,0.7); }
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

/* Tabs */
.tab-bar {
  display: flex; padding: 0 16px; gap: 0;
  background: var(--paper); border-bottom: 2px solid var(--warm-200);
}
.tab-btn {
  flex: 1; padding: 12px 0; text-align: center;
  font-size: 13px; font-weight: 600; color: var(--warm-300);
  background: none; border: none; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: all 0.15s;
}
.tab-btn.active {
  color: var(--accent); border-bottom-color: var(--accent);
}
.tab-btn:hover:not(.active) { color: var(--ink); }

/* Status pill colors */
.pill-status-approved { background: var(--success-bg); color: var(--success); }
.pill-status-rejected { background: var(--danger-bg); color: var(--danger); }
.pill-status-delayed { background: #FFF7ED; color: #C2410C; }
.pill-status-uncontactable { background: var(--warm-100); color: var(--warm-300); }
.pill-status-inprogress { background: var(--accent-bg); color: var(--accent); }

/* Read-only field */
.field-input[disabled], .field-input:disabled,
.meas-input[disabled], .meas-input:disabled,
select.field-input[disabled], select.field-input:disabled {
  background: var(--warm-100); color: var(--warm-300); cursor: not-allowed;
  opacity: 0.8;
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
  { key: "to_floor", label: "Architrave → Floor" }, // label changes based on cornices
];

const BAY_MEASUREMENT_FIELDS = [
  { key: "bay_left_height", label: "Left Height" },
  { key: "bay_left_width", label: "Left Width" },
  { key: "bay_middle_height", label: "Middle Height" },
  { key: "bay_middle_width", label: "Middle Width" },
  { key: "bay_right_height", label: "Right Height" },
  { key: "bay_right_width", label: "Right Width" },
  { key: "bay_bulkhead_width", label: "Bulkhead Width" },
  { key: "bay_bulkhead_height", label: "Bulkhead Height" },
  { key: "bay_bulkhead_depth", label: "Bulkhead Depth" },
];

// Helper to get the surrounds fields with dynamic label based on cornices
const getSurroundsFields = (hasCornices) => [
  { key: "left_wall_to_arch", label: "Left Wall → Architrave" },
  { key: "right_wall_to_arch", label: "Right Wall → Architrave" },
  { key: "to_floor", label: hasCornices ? "Cornice → Floor" : "Ceiling → Floor" },
];

const SLIDING_MEAS_KEYS = ["sliding_height", "sliding_panel_1_width", "sliding_panel_2_width", "sliding_panel_3_width", "sliding_panel_4_width"];
const ALL_MEAS_KEYS = [...MEASUREMENT_FIELDS, ...BAY_MEASUREMENT_FIELDS].map((f) => f.key).concat(SLIDING_MEAS_KEYS);
const blankMeasurements = () => ALL_MEAS_KEYS.reduce((o, k) => ({ ...o, [k]: "" }), {});

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
    // Estimate pages: 1 cover + 1 per window (may overflow to extra pages for many extra photos)
    let totalPages = 1 + job.windows.length;
    job.windows.forEach((w) => {
      const extras = w.extra_photos?.filter(Boolean) || [];
      if (extras.length > 4) totalPages += Math.ceil((extras.length - 4) / 4);
    });

    // ---- PAGE 1: COVER ----
    y = await addHeader(1, totalPages);

    // Job title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Check Measure Report", mx, y + 8);
    y += 16;

    const address = [job.street, job.suburb, job.postcode].filter(Boolean).join(", ");
    const dateStr = job.measure_date ? new Date(job.measure_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";

    // Lead details box - calculate height dynamically
    let leadBoxHeight = 18; // base padding
    if (job.lead_name) leadBoxHeight += 6;
    if (address) leadBoxHeight += 5;
    if (job.phone) leadBoxHeight += 5;
    if (job.email) leadBoxHeight += 5;
    if (dateStr || job.measure_time) leadBoxHeight += 5;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(mx, y, cw, leadBoxHeight, 3, 3, "F");
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
    if (address) { doc.text(address, mx + 6, y); y += 5; }
    if (job.phone) { doc.text(`Phone: ${job.phone}`, mx + 6, y); y += 5; }
    if (job.email) { doc.text(`Email: ${job.email}`, mx + 6, y); y += 5; }

    if (dateStr || job.measure_time) {
      doc.text(`Measure: ${dateStr}${job.measure_time ? " at " + job.measure_time : ""}`, mx + 6, y);
    }

    // Move below the lead details box
    y = y - 8 + leadBoxHeight + 4;

    // Window summary - separate section
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 46, 15);
    doc.text("Window Summary", mx, y);
    y += 8;

    doc.setFillColor(28, 46, 15);
    doc.rect(mx, y, cw, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("#", mx + 2, y + 5);
    doc.text("Window", mx + 9, y + 5);
    doc.text("In W", mx + 52, y + 5);
    doc.text("In L", mx + 68, y + 5);
    doc.text("Out W", mx + 84, y + 5);
    doc.text("Out L", mx + 100, y + 5);
    doc.text("Trt W", mx + 118, y + 5);
    doc.text("Trt D", mx + 136, y + 5);
    y += 7;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    job.windows.forEach((w, i) => {
      const bg = i % 2 === 0 ? 248 : 241;
      doc.setFillColor(bg, bg, bg);
      doc.rect(mx, y, cw, 6, "F");
      doc.setFontSize(7);
      doc.text(`${i + 1}`, mx + 2, y + 4.5);
      const labelText = (w.label || "—").substring(0, 18) + (w.is_bay ? " (Bay)" : "");
      doc.text(labelText, mx + 9, y + 4.5);
      doc.text(w.measurements?.inside_width || "—", mx + 52, y + 4.5);
      doc.text(w.measurements?.inside_length || "—", mx + 68, y + 4.5);
      doc.text(w.measurements?.outside_width || "—", mx + 84, y + 4.5);
      doc.text(w.measurements?.outside_length || "—", mx + 100, y + 4.5);
      doc.text(w.measurements?.treatment_width || "—", mx + 118, y + 4.5);
      doc.text(w.measurements?.treatment_drop || "—", mx + 136, y + 4.5);
      y += 6;
    });

    // ---- WINDOW PAGES ----
    // Each window: title + main photo + measurements + comments + extra photos (same size as main)
    // Dynamic page breaks based on content height

    const renderPhoto = async (src, startY, pageNum) => {
      try {
        const img = await loadImage(src);
        if (img) {
          const maxW = 70, maxH = 52;
          let iw = img.width, ih = img.height;
          const scale = Math.min(maxW / iw, maxH / ih);
          iw *= scale; ih *= scale;
          doc.addImage(img, "JPEG", mx, startY, iw, ih);
          return { endX: mx + iw + 4, height: ih };
        }
      } catch {}
      return { endX: mx, height: 0 };
    };

    let currentPage = 1;

    for (let wIdx = 0; wIdx < job.windows.length; wIdx++) {
      const w = job.windows[wIdx];

      // Calculate how much space this window needs
      const extras = w.extra_photos?.filter(Boolean) || [];
      const mainPhotoH = 52;
      const measTableH = 62;
      const commentsH = w.comments ? 18 : 0;
      const extraPhotosH = extras.length > 0 ? (Math.ceil(extras.length / 2) * 58) : 0;
      const totalNeeded = 10 + Math.max(mainPhotoH, measTableH) + commentsH + extraPhotosH + 10;

      // Start new page for each window (or check if fits on current page)
      doc.addPage();
      currentPage++;
      y = await addHeader(currentPage, totalPages);

      // Window title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(28, 46, 15);
      const bayTag = w.is_bay ? " (Bay)" : "";
      doc.text(`Window ${wIdx + 1}: ${w.label || ""}${bayTag}`, mx, y + 6);

      // Measurements table fields - conditional on bay window
      const isBay = w.is_bay;
      const measFields = isBay ? [
        ["Left Height", w.measurements?.bay_left_height],
        ["Left Width", w.measurements?.bay_left_width],
        ["Middle Height", w.measurements?.bay_middle_height],
        ["Middle Width", w.measurements?.bay_middle_width],
        ["Right Height", w.measurements?.bay_right_height],
        ["Right Width", w.measurements?.bay_right_width],
        ["Bulkhead Width", w.measurements?.bay_bulkhead_width],
        ["Bulkhead Height", w.measurements?.bay_bulkhead_height],
        ["Bulkhead Depth", w.measurements?.bay_bulkhead_depth],
        ["L Wall to Arch.", w.measurements?.left_wall_to_arch],
        ["R Wall to Arch.", w.measurements?.right_wall_to_arch],
        [w.has_cornices ? "Cornice to Floor" : "Ceiling to Floor", w.measurements?.to_floor],
      ] : w.sliding_door ? (() => {
        const numPanels = parseInt(w.sliding_panels) || 0;
        const fields = [["Height", w.measurements?.sliding_height]];
        for (let p = numPanels; p >= 1; p--) {
          const label = numPanels === 1 ? "Panel Width" : (p === 1 ? "Panel 1 Width" : `Panel 1-${p} Width`);
          fields.push([label, w.measurements?.[`sliding_panel_${p}_width`]]);
        }
        fields.push(
          ["Treatment Width", w.measurements?.treatment_width],
          ["Treatment Drop", w.measurements?.treatment_drop],
          ["L Wall to Arch.", w.measurements?.left_wall_to_arch],
          ["R Wall to Arch.", w.measurements?.right_wall_to_arch],
          [w.has_cornices ? "Cornice to Floor" : "Ceiling to Floor", w.measurements?.to_floor],
        );
        return fields;
      })() : [
        ["Inside Width", w.measurements?.inside_width],
        ["Outside Width", w.measurements?.outside_width],
        ["Inside Length", w.measurements?.inside_length],
        ["Outside Length", w.measurements?.outside_length],
        ["Treatment Width", w.measurements?.treatment_width],
        ["Treatment Drop", w.measurements?.treatment_drop],
        ["L Wall to Arch.", w.measurements?.left_wall_to_arch],
        ["R Wall to Arch.", w.measurements?.right_wall_to_arch],
        [w.has_cornices ? "Cornice to Floor" : "Ceiling to Floor", w.measurements?.to_floor],
      ];

      // Window info badges - prominent display
      let badgeY = y + 10;
      const badges = [];
      if (w.is_bay) badges.push({ label: "TYPE", value: "Bay Window", color: [180, 83, 9], bg: [255, 247, 237] });
      if (w.sliding_door) badges.push({ label: "TYPE", value: `Sliding Door (${w.sliding_panels || "?"}P)`, color: [180, 83, 9], bg: [255, 247, 237] });
      badges.push({ label: "CORNICES", value: w.has_cornices ? "Yes" : "No", color: w.has_cornices ? [141, 199, 63] : [148, 163, 184], bg: w.has_cornices ? [242, 249, 231] : [241, 245, 249] });
      badges.push({ label: "WALL TO WALL", value: w.wall_to_wall ? "Yes" : "No", color: w.wall_to_wall ? [141, 199, 63] : [148, 163, 184], bg: w.wall_to_wall ? [242, 249, 231] : [241, 245, 249] });
      if (w.opening) badges.push({ label: "OPENING", value: w.opening.split(" ").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "), color: [37, 99, 235], bg: [239, 246, 255] });
      if (w.operating_method) badges.push({ label: "OPERATING", value: w.operating_method.split(" ").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "), color: [109, 40, 217], bg: [245, 243, 255] });
      if (w.control_side) badges.push({ label: "CONTROL", value: w.control_side.charAt(0).toUpperCase() + w.control_side.slice(1), color: [37, 99, 235], bg: [239, 246, 255] });

      if (badges.length > 0) {
        const boxW = 38;
        const maxPerRow = Math.floor(cw / (boxW + 4));
        let bx = mx;
        let count = 0;
        badges.forEach((b) => {
          if (count > 0 && count % maxPerRow === 0) {
            bx = mx;
            badgeY += 17;
          }
          // Use wider box for long values
          const thisW = b.value.length > 8 ? 54 : boxW;
          doc.setFillColor(...b.bg);
          doc.roundedRect(bx, badgeY, thisW, 14, 2, 2, "F");
          doc.setFontSize(5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...b.color);
          doc.text(b.label, bx + thisW / 2, badgeY + 5, { align: "center" });
          doc.setFontSize(b.value.length > 12 ? 7 : 9);
          doc.setTextColor(15, 23, 42);
          doc.text(b.value, bx + thisW / 2, badgeY + 11, { align: "center" });
          bx += thisW + 4;
          count++;
        });
        badgeY += 18;
      }

      // Main photo
      const photoSrc = w.main_photo || w.main_photo_url;
      let photoEndX = mx;
      if (photoSrc) {
        const result = await renderPhoto(photoSrc, badgeY);
        photoEndX = result.endX;
      }

      // Measurements table beside photo
      const measX = Math.max(photoEndX, mx + 74);
      let my = badgeY;
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
      const photoHeight = photoSrc ? 52 : 0;
      const measHeight = 6 + measFields.length * 5;
      let contentY = badgeY + Math.max(photoHeight, measHeight) + 4;
      if (w.comments) {
        doc.setFillColor(242, 249, 231);
        doc.roundedRect(mx, contentY, cw, 14, 2, 2, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(141, 199, 63);
        doc.text("COMMENTS", mx + 3, contentY + 4);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(w.comments, cw - 6);
        doc.text(lines.slice(0, 2), mx + 3, contentY + 9);
        contentY += 18;
      }

      // Extra photos - same size as main photo, 2 per row
      if (extras.length > 0) {
        contentY += 4;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(148, 163, 184);
        doc.text("ADDITIONAL PHOTOS", mx, contentY);
        contentY += 5;

        for (let ei = 0; ei < extras.length; ei++) {
          const col = ei % 2;
          const colX = mx + col * (cw / 2 + 2);

          // Check if we need a new page
          if (contentY + 55 > ph - 15) {
            doc.addPage();
            currentPage++;
            contentY = await addHeader(currentPage, totalPages);
            contentY += 4;
          }

          try {
            const eImg = await loadImage(extras[ei]);
            if (eImg) {
              const maxW = 70, maxH = 52;
              let ew = eImg.width, eh = eImg.height;
              const scale = Math.min(maxW / ew, maxH / eh);
              ew *= scale; eh *= scale;
              doc.addImage(eImg, "JPEG", colX, contentY, ew, eh);
            }
          } catch {}

          // Move to next row after every 2 photos
          if (col === 1 || ei === extras.length - 1) {
            contentY += 55;
          }
        }
      }
    }

    // Save
    const namePart = (job.lead_name || "measure").replace(/\s+/g, "_");
    const addressPart = [job.street, job.suburb].filter(Boolean).join("_").replace(/\s+/g, "_");
    const filename = `${namePart}${addressPart ? "_" + addressPart : ""}_CM.pdf`;
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
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [editingUnlocked, setEditingUnlocked] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "history"

  const STATUS_OPTIONS = ["In Progress", "Approved", "Rejected", "Uncontactable", "Delayed"];

  // Fetch ALL leads from Supabase (we filter in the dropdown)
  const fetchLeads = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    try {
      const url = `${SUPABASE_URL}/rest/v1/leads?select=id,name,phone,email,street,suburb,postcode,status&order=name.asc`;
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
      if (Array.isArray(data)) setLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  };

  // Fetch jobs from Supabase and merge with local
  // Shared function to rebuild jobs from Supabase (used by both auto-poll and manual refresh)
  const hardSyncFromSupabase = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    if (isSyncing.current) { console.log("[POLL] Skipped — auto-sync in progress"); return; }
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/check_measures?select=*,leads(id,name,phone,email,street,suburb,postcode,status)&order=created_at.desc`,
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

      console.log("[POLL] Fetched", remoteRows.length, "jobs from Supabase");

      setJobs((prev) => {
        const remoteIds = new Set(remoteRows.map((r) => r.id));

        // Keep local-only unsynced jobs that aren't in Supabase yet
        const localOnly = prev.filter((j) => !j.synced && !remoteIds.has(j.id));

        // Rebuild all remote jobs fresh from cloud
        const remoteJobs = remoteRows.map((row) => {
          const lead = row.leads || {};
          // Handle both old format (array) and new format ({_meta, items})
          const rawWindows = row.windows;
          const windowsMeta = rawWindows?._meta || {};
          const windowData = Array.isArray(row.measurements_json) ? row.measurements_json
            : Array.isArray(rawWindows) ? rawWindows
            : Array.isArray(rawWindows?.items) ? rawWindows.items : [];
          const isJobCompleted = windowsMeta.is_completed || false;

          // Check if we have local base64 photos to preserve
          const localJob = prev.find((j) => j.id === row.id);

          const windows = windowData.map((rw) => {
            const lw = localJob?.windows?.find((l) => l.id === rw.id);
            const cloudMain = rw.main_photo_url || rw.main_photo || null;
            const cloudExtras = rw.extra_photo_urls || rw.extra_photos || [];

            // Only keep local base64 if not yet uploaded
            const localMainIsBase64 = lw?.main_photo && lw.main_photo.startsWith("data:");
            const mainPhoto = localMainIsBase64 ? lw.main_photo : cloudMain;

            const mergedExtras = [...cloudExtras];
            if (lw?.extra_photos) {
              lw.extra_photos.forEach((lp) => {
                if (lp && lp.startsWith("data:")) mergedExtras.push(lp);
              });
            }

            // Also keep any local-only windows not in cloud yet
            console.log("[POLL] Window:", rw.id?.substring(0, 8), "cloud_main:", cloudMain ? "YES" : "null", "cloud_extras:", cloudExtras.length, "display_main:", mainPhoto ? "YES" : "null", "display_extras:", mergedExtras.length);
            return {
              id: rw.id || genId(),
              label: rw.label || "Window",
              is_bay: rw.is_bay ?? lw?.is_bay ?? false,
              main_photo: mainPhoto,
              main_photo_url: cloudMain,
              extra_photos: mergedExtras,
              extra_photo_urls: cloudExtras,
              measurements: rw.measurements || {},
              comments: rw.comments || "",
            };
          });

          // Append local-only windows not yet synced
          if (localJob) {
            localJob.windows.forEach((lw) => {
              if (!windowData.find((rw) => rw.id === lw.id)) {
                windows.push(lw);
              }
            });
          }

          return {
            id: row.id,
            lead_id: row.lead_id || null,
            lead_name: lead.name || "",
            phone: lead.phone || "",
            email: lead.email || "",
            street: lead.street || "",
            suburb: lead.suburb || "",
            postcode: lead.postcode || "",
            status: lead.status || "In Progress",
            is_completed: isJobCompleted,
            measure_date: row.measure_date || "",
            measure_time: row.measure_time || "",
            windows,
            synced: true,
            created_at: row.created_at,
          };
        });

        return [...localOnly, ...remoteJobs];
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
    await Promise.all([hardSyncFromSupabase(), fetchLeads()]);
    setRefreshing(false);
  }, [hardSyncFromSupabase]);

  // Load from localStorage on mount, then fetch from Supabase
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cmb_jobs");
      if (saved) setJobs(JSON.parse(saved));
    } catch {}

    hardSyncFromSupabase();
    fetchLeads();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      hardSyncFromSupabase();
      fetchLeads();
    }, 10000);

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

  // Auto-sync: debounce 3 seconds after any job becomes unsynced
  const autoSyncTimer = useRef(null);
  const prevJobsRef = useRef(jobs);
  const isSyncing = useRef(false);

  useEffect(() => {
    const prevUnsynced = new Set(prevJobsRef.current.filter((j) => !j.synced).map((j) => j.id));
    const allUnsynced = jobs.filter((j) => !j.synced);
    prevJobsRef.current = jobs;

    if (allUnsynced.length === 0) { isSyncing.current = false; return; }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    // Lock immediately to prevent poll from overwriting during the 3-second wait
    isSyncing.current = true;

    clearTimeout(autoSyncTimer.current);
    autoSyncTimer.current = setTimeout(async () => {
      for (const job of allUnsynced) {
        try {
          // Upload any base64 photos to Supabase Storage
          const windowsSummary = [];
          for (const w of job.windows) {
            let mainPhotoUrl = w.main_photo_url || null;
            const extraPhotoUrls = [...(w.extra_photo_urls || [])];

            console.log("[AUTO-SYNC] Window:", w.id, "main_photo type:", w.main_photo?.substring(0, 30), "extra_photos count:", w.extra_photos?.length || 0);

            // Upload main photo if base64
            if (w.main_photo && w.main_photo.startsWith("data:")) {
              console.log("[AUTO-SYNC] Uploading main photo for window", w.id);
              const ts = Date.now();
              const url = await uploadPhoto(w.main_photo, `${job.id}/${w.id}/main_${ts}.jpg`);              if (url) mainPhotoUrl = url;
            }

            // Upload extra photos if base64
            for (let i = 0; i < (w.extra_photos?.length || 0); i++) {
              if (w.extra_photos[i] && w.extra_photos[i].startsWith("data:")) {
                console.log("[AUTO-SYNC] Uploading extra photo", i, "for window", w.id);
                const ets = Date.now();
                const url = await uploadPhoto(w.extra_photos[i], `${job.id}/${w.id}/extra_${i}_${ets}.jpg`);
                if (url) extraPhotoUrls[i] = url;
              } else if (w.extra_photos[i] && !w.extra_photos[i].startsWith("data:")) {
                // Already a URL, keep it
                extraPhotoUrls[i] = w.extra_photos[i];
              }
            }

            console.log("[AUTO-SYNC] Final URLs - main:", mainPhotoUrl?.substring(0, 50), "extras:", extraPhotoUrls.length);

            windowsSummary.push({
              id: w.id,
              label: w.label,
              is_bay: w.is_bay || false,
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
            windows: { _meta: { is_completed: job.is_completed || false }, items: windowsSummary },
            measurements_json: windowsSummary,
            created_at: job.created_at,
          };

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

          if (res.ok) {
            // Update local jobs: replace base64 with cloud URLs in BOTH arrays
            setJobs((prev) => prev.map((j) => {
              if (j.id !== job.id) return j;
              const updatedWindows = j.windows.map((w) => {
                const summary = windowsSummary.find((s) => s.id === w.id);
                if (!summary) return w;
                return {
                  ...w,
                  main_photo: summary.main_photo_url || w.main_photo,
                  main_photo_url: summary.main_photo_url || w.main_photo_url || null,
                  extra_photos: summary.extra_photo_urls.length > 0 ? summary.extra_photo_urls : w.extra_photos,
                  extra_photo_urls: summary.extra_photo_urls,
                };
              });
              return { ...j, windows: updatedWindows, synced: true };
            }));
          }
        } catch (err) {
          console.error("Auto-sync failed for job:", job.id, err);
        }
      }
      isSyncing.current = false;
    }, 3000);

    return () => clearTimeout(autoSyncTimer.current);
  }, [jobs]);

  // Scroll to top on screen change
  useEffect(() => {
    const scrollArea = document.querySelector(".scroll-area");
    if (scrollArea) scrollArea.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [screen, currentWindowIdx]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const currentJob = jobs.find((j) => j.id === currentJobId) || null;
  const currentWindow = currentJob?.windows?.[currentWindowIdx] || null;
  const isHistory = currentJob && currentJob.status !== "In Progress";
  const isCompleted = currentJob?.is_completed || false;
  const isLocked = (isHistory || isCompleted) && !editingUnlocked;

  // Split jobs into active and history
  const activeJobs = jobs.filter((j) => !j.status || j.status === "In Progress");
  const historyJobs = jobs.filter((j) => j.status && j.status !== "In Progress");

  const getStatusPillClass = (status) => {
    switch (status) {
      case "Approved": return "pill-status-approved";
      case "Rejected": return "pill-status-rejected";
      case "Delayed": return "pill-status-delayed";
      case "Uncontactable": return "pill-status-uncontactable";
      default: return "pill-status-inprogress";
    }
  };

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
      status: "In Progress",
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
      status: lead.status || "In Progress",
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
    status: "status",
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
      is_bay: false,
      has_cornices: false,
      wall_to_wall: false,
      sliding_door: false,
      opening: "",
      operating_method: "",
      control_side: "",
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
    console.log("[PHOTO] Uploading to:", path);
    try {
      const res = await fetch(base64DataUrl);
      const blob = await res.blob();
      console.log("[PHOTO] Blob size:", blob.size, "type:", blob.type);
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
        const errText = await uploadRes.text();
        console.error("[PHOTO] Upload failed:", uploadRes.status, errText);
        return null;
      }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/window-photos/${path}`;
      console.log("[PHOTO] Upload success:", publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("[PHOTO] Upload error:", err);
      return null;
    }
  };

  // Delete a photo from Supabase Storage by its public URL
  const deletePhotoFromStorage = async (publicUrl) => {
    if (!publicUrl || !publicUrl.includes("/storage/v1/object/public/window-photos/")) return;
    try {
      // Extract the path after the bucket name
      const path = publicUrl.split("/storage/v1/object/public/window-photos/")[1];
      if (!path) return;
      console.log("[PHOTO] Deleting from storage:", path);
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/window-photos/${path}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) {
        console.error("[PHOTO] Delete failed:", res.status, await res.text());
      } else {
        console.log("[PHOTO] Delete success:", path);
      }
    } catch (err) {
      console.error("[PHOTO] Delete error:", err);
    }
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
          const mts = Date.now();
          const url = await uploadPhoto(w.main_photo, `${job.id}/${w.id}/main_${mts}.jpg`);
          if (url) mainPhotoUrl = url;
        }

        // Upload extra photos
        for (let i = 0; i < w.extra_photos.length; i++) {
          if (w.extra_photos[i] && w.extra_photos[i].startsWith("data:")) {
            const ets = Date.now();
            const url = await uploadPhoto(w.extra_photos[i], `${job.id}/${w.id}/extra_${i}_${ets}.jpg`);
            if (url) extraPhotoUrls[i] = url;
          }
        }

        windowsSummary.push({
          id: w.id,
          label: w.label,
          is_bay: w.is_bay || false,
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
        windows: { _meta: { is_completed: job.is_completed || false }, items: windowsSummary },
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

      // Update local jobs: replace base64 with cloud URLs in both arrays
      setJobs((prev) => prev.map((j) => {
        if (j.id !== jobId) return j;
        const updatedWindows = j.windows.map((w) => {
          const summary = windowsSummary.find((s) => s.id === w.id);
          if (!summary) return w;
          return {
            ...w,
            main_photo: summary.main_photo_url || w.main_photo,
            main_photo_url: summary.main_photo_url || w.main_photo_url || null,
            extra_photos: summary.extra_photo_urls.length > 0 ? summary.extra_photo_urls : w.extra_photos,
            extra_photo_urls: summary.extra_photo_urls,
          };
        });
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
  const goList = () => { setScreen("list"); setCurrentJobId(null); setCurrentWindowIdx(null); setEditingUnlocked(false); };
  const goJob = (id) => { setCurrentJobId(id); setScreen("job"); setCurrentWindowIdx(null); setEditingUnlocked(false); };
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
                  <span
                    key={lastRefresh?.getTime() || 0}
                    style={{ animation: lastRefresh ? "refresh-flash 1.5s ease" : "none" }}
                  >
                    {lastRefresh
                      ? lastRefresh.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
                      : "—"
                    }
                  </span>
                </button>
              </div>
            </div>

            {/* Tab Bar */}
            <div className="tab-bar">
              <button className={`tab-btn ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
                Active ({activeJobs.length})
              </button>
              <button className={`tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
                History ({historyJobs.length})
              </button>
            </div>

            <div className="scroll-area">
              {activeTab === "active" && (
                <>
                  {activeJobs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Icons.Ruler size={48} /></div>
                      <div className="empty-title">No Active Jobs</div>
                      <div className="empty-desc">Tap the + button to create a new check measure job.</div>
                    </div>
                  ) : (
                    <div className="card" style={{ margin: "16px", borderRadius: "var(--radius)" }}>
                      {activeJobs.map((job) => (
                        <div className="job-item" key={job.id} onClick={() => goJob(job.id)}>
                          <div className="job-avatar"><Icons.User size={20} /></div>
                          <div className="job-info">
                            <div className="job-name">{job.lead_name || "Untitled Lead"}</div>
                            <div className="job-address">{[job.street, job.suburb, job.postcode].filter(Boolean).join(", ") || "No address"}</div>
                            <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                              {job.synced ? (
                                <span className="pill pill-synced"><Icons.Check size={10} /> Synced</span>
                              ) : (
                                <span className="pill pill-local">Local only</span>
                              )}
                              {job.is_completed && (
                                <span className="pill" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}><Icons.Check size={10} /> Completed</span>
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
                </>
              )}

              {activeTab === "history" && (
                <>
                  {historyJobs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Icons.List size={48} /></div>
                      <div className="empty-title">No History Yet</div>
                      <div className="empty-desc">Jobs with Approved, Rejected, or other non-active statuses will appear here.</div>
                    </div>
                  ) : (
                    <div className="card" style={{ margin: "16px", borderRadius: "var(--radius)" }}>
                      {historyJobs.map((job) => (
                        <div className="job-item" key={job.id} onClick={() => goJob(job.id)}>
                          <div className="job-avatar" style={{ background: "var(--warm-100)", color: "var(--warm-300)" }}><Icons.User size={20} /></div>
                          <div className="job-info">
                            <div className="job-name">{job.lead_name || "Untitled Lead"}</div>
                            <div className="job-address">{[job.street, job.suburb, job.postcode].filter(Boolean).join(", ") || "No address"}</div>
                            <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                              <span className={`pill ${getStatusPillClass(job.status)}`}>{job.status}</span>
                              {job.is_completed && (
                                <span className="pill" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}><Icons.Check size={10} /> Completed</span>
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
                </>
              )}
            </div>
            {activeTab === "active" && (
              <button className="fab" onClick={createJob}><Icons.Plus size={24} /></button>
            )}
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
                {isHistory ? (
                  <span className={`pill ${getStatusPillClass(currentJob.status)}`}>{currentJob.status}</span>
                ) : (
                  <>
                    {isCompleted && !editingUnlocked && (
                      <span className="pill pill-synced" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                        <Icons.Check size={10} /> Completed
                      </span>
                    )}
                    {editingUnlocked && (
                      <span className="pill pill-local" style={{ background: "#FFF7ED", color: "#C2410C" }}>
                        Editing
                      </span>
                    )}
                    {!isCompleted && !editingUnlocked && (
                      <>
                        {currentJob.synced ? (
                          <span className="pill pill-synced"><Icons.Check size={12} /> Synced</span>
                        ) : (
                          <span className="pill pill-local">Local</span>
                        )}
                      </>
                    )}
                    <button className="btn btn-ghost" onClick={() => syncJob(currentJob.id)} title="Sync to Supabase">
                      <Icons.Cloud size={18} />
                    </button>
                  </>
                )}
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
                          disabled={isLocked}
                          onChange={(e) => {
                            if (e.target.value) selectLead(e.target.value);
                          }}
                        >
                          <option value="">— Choose a lead —</option>
                          {leads.filter((l) => l.status === "In Progress" || String(l.id) === String(currentJob.lead_id)).map((lead) => (
                            <option key={lead.id} value={lead.id}>{lead.name}</option>
                          ))}
                        </select>
                        {!currentJob.lead_id && !isLocked && (
                          <button
                            className="btn btn-primary"
                            style={{ flexShrink: 0, padding: "10px 14px" }}
                            onClick={() => setShowAddLead(true)}
                          >
                            <Icons.Plus size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">Lead Name</label>
                      <input
                        className="field-input"
                        placeholder="Auto-filled from lead"
                        value={currentJob.lead_name}
                        disabled={isLocked}
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
                          disabled={isLocked}
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
                          disabled={isLocked}
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
                        disabled={isLocked}
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
                          disabled={isLocked}
                          onChange={(e) => updateLeadField(currentJob.id, "suburb", e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label">Postcode</label>
                        <input
                          className="field-input"
                          placeholder="3065"
                          value={currentJob.postcode || ""}
                          disabled={isLocked}
                          onChange={(e) => updateLeadField(currentJob.id, "postcode", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">Status</label>
                      <select
                        className="field-input"
                        value={currentJob.status || "In Progress"}
                        disabled={isLocked}
                        onChange={(e) => updateLeadField(currentJob.id, "status", e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="field">
                        <label className="field-label">Measure Date</label>
                        <input
                          className="field-input"
                          type="date"
                          value={currentJob.measure_date}
                          disabled={isLocked}
                          onChange={(e) => updateLeadField(currentJob.id, "measure_date", e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label">Time</label>
                        <input
                          className="field-input"
                          type="time"
                          value={currentJob.measure_time}
                          disabled={isLocked}
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

                {!isLocked && (
                  <button className="btn btn-secondary btn-block" onClick={addWindow}>
                    <Icons.Plus size={16} /> Add Window
                  </button>
                )}

                <div className="divider" />

                {/* Complete / Edit buttons */}
                {!isHistory && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    {isCompleted && !editingUnlocked ? (
                      <>
                        <button
                          className="btn btn-block"
                          style={{ flex: 1, background: "var(--warm-100)", color: "var(--ink)", border: "1.5px solid var(--warm-200)" }}
                          onClick={() => setEditingUnlocked(true)}
                        >
                          <Icons.Edit size={16} /> Edit
                        </button>
                        <button
                          className="btn btn-block"
                          style={{ flex: 2, background: "var(--accent-bg)", color: "var(--accent)", fontWeight: 600 }}
                          disabled
                        >
                          <Icons.Check size={16} /> Completed
                        </button>
                      </>
                    ) : editingUnlocked ? (
                      <button
                        className="btn btn-block btn-lg"
                        style={{ flex: 1, background: "var(--accent-dark)", color: "#fff", fontWeight: 700 }}
                        onClick={() => {
                          updateJob(currentJob.id, { is_completed: true });
                          setEditingUnlocked(false);
                          showToast("Check measure locked ✓");
                        }}
                      >
                        <Icons.Check size={18} /> Save & Lock
                      </button>
                    ) : (
                      <button
                        className="btn btn-block btn-lg"
                        style={{ flex: 1, background: "var(--accent-dark)", color: "#fff", fontWeight: 700 }}
                        onClick={() => {
                          syncJob(currentJob.id);
                          setShowCompleteModal(true);
                        }}
                      >
                        <Icons.Check size={18} /> Complete Check Measure
                      </button>
                    )}
                  </div>
                )}

                <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }} onClick={() => exportJobPDF(currentJob, showToast)}>
                  <Icons.Download size={16} /> Export PDF
                </button>

                {!isLocked && !isHistory && (
                  <button className="btn btn-danger btn-block" style={{ marginTop: 8 }} onClick={() => {
                    if (confirm("Delete this entire job?")) deleteJob(currentJob.id);
                  }}>
                    <Icons.Trash size={16} /> Delete Job
                  </button>
                )}
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
            onDeletePhoto={deletePhotoFromStorage}
            readOnly={isLocked}
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

        {/* Complete Check Measure Modal */}
        {showCompleteModal && currentJob && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }} onClick={() => setShowCompleteModal(false)}>
            <div style={{
              background: "#fff", borderRadius: 16, maxWidth: 480, width: "100%",
              maxHeight: "85vh", overflowY: "auto", padding: 0,
            }} onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--warm-100)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--warm-300)", textTransform: "uppercase", marginBottom: 4 }}>Complete Check Measure</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{currentJob.lead_name || "Untitled"}</div>
                </div>
                <button className="btn btn-ghost" onClick={() => setShowCompleteModal(false)}><Icons.X size={20} /></button>
              </div>

              {/* Summary */}
              <div style={{ padding: "20px 24px" }}>
                <div style={{ background: "var(--accent-bg)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", marginBottom: 8 }}>Check Measure Summary</div>
                  <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
                    <div>{currentJob.windows.length} window{currentJob.windows.length !== 1 ? "s" : ""} measured</div>
                    <div>{currentJob.windows.filter(w => w.main_photo).length} photo{currentJob.windows.filter(w => w.main_photo).length !== 1 ? "s" : ""} captured</div>
                    <div>{[currentJob.street, currentJob.suburb, currentJob.postcode].filter(Boolean).join(", ") || "No address"}</div>
                  </div>
                </div>

                {/* Placeholder for future completion questions */}
                <div style={{ background: "var(--warm-100)", borderRadius: 8, padding: 16, marginBottom: 16, border: "1px dashed var(--warm-200)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--warm-300)", textAlign: "center" }}>
                    Completion questions will be added here
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "12px 24px 24px", display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-lg"
                  style={{ flex: 2, background: "var(--accent-dark)", color: "#fff", fontWeight: 700 }}
                  onClick={() => {
                    updateJob(currentJob.id, { is_completed: true });
                    setShowCompleteModal(false);
                    setEditingUnlocked(false);
                    showToast("Check measure completed ✓");
                  }}
                >
                  <Icons.Check size={18} /> Confirm Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// WINDOW DETAIL VIEW
// ============================================================
function WindowDetail({ job, window: win, windowIdx, totalWindows, onBack, onUpdate, onDelete, onDeletePhoto, readOnly, onNext, onPrev, showToast }) {
  const mainPhotoRef = useRef(null);
  const extraPhotoRef = useRef(null);
  const scrollRef = useRef(null);
  const [drawingPhoto, setDrawingPhoto] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Scroll to top when entering window or switching windows
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [windowIdx]);

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
    onUpdate({ extra_photos: [...win.extra_photos, ...urls] });
  };

  const removeExtraPhoto = (idx) => {
    // Delete from Supabase Storage if it's a URL
    const photoToDelete = win.extra_photos?.[idx];
    if (photoToDelete && !photoToDelete.startsWith("data:")) {
      onDeletePhoto(photoToDelete);
    }
    const updatedPhotos = (win.extra_photos || []).filter((_, i) => i !== idx);
    const updatedUrls = (win.extra_photo_urls || []).filter((_, i) => i !== idx);
    onUpdate({ extra_photos: updatedPhotos, extra_photo_urls: updatedUrls });
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
        <div style={{ flex: 1, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
            {windowIdx + 1} of {totalWindows}
          </span>
          {job.synced ? (
            <span className="pill pill-synced" style={{ fontSize: 10, padding: "2px 8px" }}><Icons.Check size={10} /> Synced</span>
          ) : (
            <span className="pill pill-local" style={{ fontSize: 10, padding: "2px 8px" }}>Saving...</span>
          )}
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

      <div className="scroll-area" ref={scrollRef}>
        <div className="p-16">
          {/* Window Label */}
          <div className="field">
            <label className="field-label">Window Name / Location</label>
            <input
              className="field-input"
              placeholder="e.g. Master Bedroom — North Wall"
              value={win.label}
              disabled={readOnly}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </div>

          {/* Main Photo */}
          <div className="section-title" style={{ padding: "8px 0" }}>Window Photo</div>
          <div className="photo-main" onClick={() => !readOnly && !win.main_photo && mainPhotoRef.current?.click()}>
            {win.main_photo ? (
              <>
                <img src={win.main_photo} alt="Window" />
                {!readOnly && (
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
                      setConfirmDelete("main");
                    }}
                  >
                    <Icons.Trash size={14} /> Remove
                  </button>
                </div>
                )}
              </>
            ) : (
              <>
                {!readOnly && <Icons.Camera size={32} color="var(--warm-300)" />}
                {!readOnly && <span className="photo-main-label">Tap to take or upload photo</span>}
                {readOnly && <span className="photo-main-label" style={{ color: "var(--warm-200)" }}>No photo</span>}
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
                <div className="photo-thumb" key={idx} onClick={() => !readOnly && setDrawingPhoto({ src: url, target: idx })}>
                  <img src={url} alt="" />
                  {!readOnly && (
                    <div className="photo-thumb-remove" onClick={(e) => { e.stopPropagation(); setConfirmDelete(idx); }}>×</div>
                  )}
                </div>
              ))}
              {!readOnly && (
                <div className="photo-add-small" onClick={() => extraPhotoRef.current?.click()}>
                  <Icons.Plus size={20} color="var(--warm-300)" />
                </div>
              )}
            </div>
            {!readOnly && (
              <input
                ref={extraPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                style={{ display: "none" }}
                onChange={handleExtraPhotos}
              />
            )}
          </div>

          {/* Window Information */}
          <div className="section-title" style={{ padding: "0 0 8px", marginTop: 16 }}>Window Information</div>
          <div className="card mb-16">
            <div className="card-body">
              {/* Bay Window */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Bay Window</span>
                <button
                  disabled={readOnly}
                  onClick={() => onUpdate({ is_bay: !win.is_bay, sliding_door: false, sliding_panels: "" })}
                  style={{
                    width: 48, height: 28, borderRadius: 14, border: "none", cursor: readOnly ? "not-allowed" : "pointer",
                    background: win.is_bay ? "var(--accent)" : "var(--warm-200)",
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, background: "#fff",
                    position: "absolute", top: 3,
                    left: win.is_bay ? 23 : 3,
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>

              {/* Sliding Door */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Sliding Door</span>
                <button
                  disabled={readOnly}
                  onClick={() => onUpdate({ sliding_door: !win.sliding_door, is_bay: false, sliding_panels: win.sliding_door ? "" : (win.sliding_panels || "") })}
                  style={{
                    width: 48, height: 28, borderRadius: 14, border: "none", cursor: readOnly ? "not-allowed" : "pointer",
                    background: win.sliding_door ? "var(--accent)" : "var(--warm-200)",
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, background: "#fff",
                    position: "absolute", top: 3,
                    left: win.sliding_door ? 23 : 3,
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>

              {/* Cornices */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Cornices</span>
                <button
                  disabled={readOnly}
                  onClick={() => onUpdate({ has_cornices: !win.has_cornices })}
                  style={{
                    width: 48, height: 28, borderRadius: 14, border: "none", cursor: readOnly ? "not-allowed" : "pointer",
                    background: win.has_cornices ? "var(--accent)" : "var(--warm-200)",
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, background: "#fff",
                    position: "absolute", top: 3,
                    left: win.has_cornices ? 23 : 3,
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>

              {/* Wall to Wall */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Wall to Wall</span>
                <button
                  disabled={readOnly}
                  onClick={() => onUpdate({ wall_to_wall: !win.wall_to_wall })}
                  style={{
                    width: 48, height: 28, borderRadius: 14, border: "none", cursor: readOnly ? "not-allowed" : "pointer",
                    background: win.wall_to_wall ? "var(--accent)" : "var(--warm-200)",
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, background: "#fff",
                    position: "absolute", top: 3,
                    left: win.wall_to_wall ? 23 : 3,
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>

              {/* Opening */}
              <div style={{ marginBottom: 16 }}>
                <span className="field-label">Opening</span>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {["Left Bunch", "Centre", "Right Bunch"].map((opt) => (
                    <button
                      key={opt}
                      disabled={readOnly}
                      onClick={() => onUpdate({ opening: opt.toLowerCase() })}
                      className="btn"
                      style={{
                        flex: 1, padding: "8px 4px", fontSize: 12,
                        background: win.opening === opt.toLowerCase() ? "var(--accent)" : "var(--warm-100)",
                        color: win.opening === opt.toLowerCase() ? "#fff" : "var(--ink)",
                        border: `1.5px solid ${win.opening === opt.toLowerCase() ? "var(--accent)" : "var(--warm-200)"}`,
                        opacity: readOnly ? 0.8 : 1,
                        cursor: readOnly ? "not-allowed" : "pointer",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operating Method */}
              <div style={{ marginBottom: 16 }}>
                <span className="field-label">Operating Method</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {["Flick Stick", "Cord Drawn", "Battery", "Hardwire"].map((method) => {
                    const isSelected = win.operating_method === method.toLowerCase();
                    return (
                      <button
                        key={method}
                        disabled={readOnly}
                        onClick={() => onUpdate({ operating_method: isSelected ? "" : method.toLowerCase() })}
                        className="btn"
                        style={{
                          flex: "1 0 calc(50% - 4px)", padding: "8px 4px", fontSize: 12,
                          background: isSelected ? "var(--accent)" : "var(--warm-100)",
                          color: isSelected ? "#fff" : "var(--ink)",
                          border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--warm-200)"}`,
                          opacity: readOnly ? 0.8 : 1,
                          cursor: readOnly ? "not-allowed" : "pointer",
                        }}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Control Side */}
              <div>
                <span className="field-label">Control Side</span>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {["Left", "Right"].map((side) => (
                    <button
                      key={side}
                      disabled={readOnly}
                      onClick={() => onUpdate({ control_side: side.toLowerCase() })}
                      className="btn"
                      style={{
                        flex: 1,
                        background: win.control_side === side.toLowerCase() ? "var(--accent)" : "var(--warm-100)",
                        color: win.control_side === side.toLowerCase() ? "#fff" : "var(--ink)",
                        border: `1.5px solid ${win.control_side === side.toLowerCase() ? "var(--accent)" : "var(--warm-200)"}`,
                        opacity: readOnly ? 0.8 : 1,
                        cursor: readOnly ? "not-allowed" : "pointer",
                      }}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Measurements */}
          {win.is_bay ? (
            <>
              <div className="meas-section-header">
                <div className="meas-section-dot" style={{ background: "var(--blue)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--blue)" }}>
                  Bay Window Measurements
                </span>
              </div>
              <div className="card mb-16">
                <div className="card-body">
                  <div className="meas-grid">
                    {BAY_MEASUREMENT_FIELDS.map((f) => (
                      <div className="meas-item" key={f.key}>
                        <span className="meas-label">{f.label}</span>
                        <input
                          className="meas-input"
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={win.measurements[f.key] || ""}
                          disabled={readOnly}
                          onChange={(e) => updateMeas(f.key, e.target.value)}
                        />
                        <span className="meas-unit">mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : win.sliding_door ? (
            <>
              <div className="meas-section-header">
                <div className="meas-section-dot" style={{ background: "var(--blue)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--blue)" }}>
                  Sliding Door Measurements
                </span>
              </div>
              <div className="card mb-16">
                <div className="card-body">
                  <div className="field" style={{ marginBottom: 12 }}>
                    <label className="field-label">Number of Panels</label>
                    <select
                      className="field-input"
                      value={win.sliding_panels || ""}
                      disabled={readOnly}
                      onChange={(e) => onUpdate({ sliding_panels: e.target.value })}
                    >
                      <option value="">— Select —</option>
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>{n} Panel{n > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div className="meas-grid">
                    {/* Height */}
                    <div className="meas-item">
                      <span className="meas-label">Height</span>
                      <input
                        className="meas-input"
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={win.measurements.sliding_height || ""}
                        disabled={readOnly}
                        onChange={(e) => updateMeas("sliding_height", e.target.value)}
                      />
                      <span className="meas-unit">mm</span>
                    </div>
                    {/* Panel widths based on number of panels */}
                    {(() => {
                      const numPanels = parseInt(win.sliding_panels) || 0;
                      const panelFields = [];
                      for (let p = numPanels; p >= 1; p--) {
                        const label = numPanels === 1 ? "Panel W" : (p === 1 ? "P1 Width" : `P1-${p} Width`);
                        const key = `sliding_panel_${p}_width`;
                        panelFields.push(
                          <div className="meas-item" key={key}>
                            <span className="meas-label">{p === 1 && numPanels > 1 ? "P1 Width" : label}</span>
                            <input
                              className="meas-input"
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={win.measurements[key] || ""}
                              disabled={readOnly}
                              onChange={(e) => updateMeas(key, e.target.value)}
                            />
                            <span className="meas-unit">mm</span>
                          </div>
                        );
                      }
                      return panelFields;
                    })()}
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
                          disabled={readOnly}
                          onChange={(e) => updateMeas(f.key, e.target.value)}
                        />
                        <span className="meas-unit">mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
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
                          disabled={readOnly}
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
                          disabled={readOnly}
                          onChange={(e) => updateMeas(f.key, e.target.value)}
                        />
                        <span className="meas-unit">mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Surrounds - shown for all types */}
          <div className="meas-section-header">
            <div className="meas-section-dot" style={{ background: "var(--success)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--success)" }}>
              Surrounds
            </span>
          </div>
          <div className="card mb-16">
            <div className="card-body">
              <div className="meas-grid">
                {getSurroundsFields(win.has_cornices).map((f) => (
                  <div className="meas-item" key={f.key}>
                    <span className="meas-label">{f.label}</span>
                    <input
                      className="meas-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={win.measurements[f.key] || ""}
                      disabled={readOnly}
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
                disabled={readOnly}
                onChange={(e) => onUpdate({ comments: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          {!readOnly && (
            <>
              <div className="divider" />
              <button className="btn btn-danger btn-block" onClick={() => {
                if (confirm("Remove this window?")) onDelete();
              }}>
                <Icons.Trash size={16} /> Remove Window
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete Photo Confirmation */}
      {confirmDelete !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 250,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 24, maxWidth: 320, width: "100%", textAlign: "center",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Remove Photo?</div>
            <div style={{ fontSize: 13, color: "var(--warm-300)", marginBottom: 20 }}>This action cannot be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => {
                if (confirmDelete === "main") {
                  // Delete from Supabase Storage if it's a URL
                  if (win.main_photo_url) onDeletePhoto(win.main_photo_url);
                  else if (win.main_photo && !win.main_photo.startsWith("data:")) onDeletePhoto(win.main_photo);
                  onUpdate({ main_photo: null, main_photo_url: null });
                } else if (typeof confirmDelete === "number") {
                  removeExtraPhoto(confirmDelete);
                }
                setConfirmDelete(null);
                showToast("Photo removed");
              }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Editor */}
      {drawingPhoto && (
        <DrawingEditor
          imageSrc={drawingPhoto.src}
          onClose={() => setDrawingPhoto(null)}
          onSave={(annotatedDataUrl) => {
            if (drawingPhoto.target === "main") {
              onUpdate({ main_photo: annotatedDataUrl, main_photo_url: null });
            } else if (typeof drawingPhoto.target === "number") {
              // Use the current extra_photos, ensure array exists and index is valid
              const current = Array.isArray(win.extra_photos) ? [...win.extra_photos] : [];
              if (drawingPhoto.target < current.length) {
                current[drawingPhoto.target] = annotatedDataUrl;
              } else {
                current.push(annotatedDataUrl);
              }
              onUpdate({ extra_photos: current, extra_photo_urls: [] });
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
  const [loadError, setLoadError] = useState(false);
  const imgRef = useRef(null);
  const lastPoint = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        imgRef.current = img;
        const maxW = Math.min(img.width, 1200);
        const scale = maxW / img.width;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHistory([canvas.toDataURL()]);
        setLoadError(false);
      } catch (err) {
        console.error("Canvas setup failed:", err);
        setLoadError(true);
      }
    };
    img.onerror = () => {
      console.error("Failed to load image for drawing:", imageSrc?.substring(0, 50));
      setLoadError(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
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
    if (!canvasRef.current || loadError) return;
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
    if (!isDrawing || !canvasRef.current) return;
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
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    lastPoint.current = null;
    try {
      setHistory((prev) => [...prev, canvasRef.current.toDataURL()]);
    } catch {}
  };

  const undo = () => {
    if (history.length <= 1 || !canvasRef.current) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const img = new Image();
    img.onload = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = newHistory[newHistory.length - 1];
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.85);
      onSave(dataUrl);
    } catch (err) {
      console.error("Failed to save annotation:", err);
      onClose();
    }
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
        {loadError ? (
          <div style={{ color: "#fff", textAlign: "center", padding: 32 }}>
            <p style={{ fontSize: 16, marginBottom: 12 }}>Unable to load image for annotation</p>
            <p style={{ fontSize: 13, color: "#999" }}>The image may need to be re-uploaded</p>
            <button className="draw-btn draw-btn-cancel" style={{ marginTop: 16 }} onClick={onClose}>Go Back</button>
          </div>
        ) : (
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
        )}
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