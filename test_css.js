const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');

const newCss = `
/* ────────────────────────── SIDEBAR COLLAPSED ────────────────────────── */
body.sidebar-collapsed {
  --sw: 68px;
}
body.sidebar-collapsed .logo-text,
body.sidebar-collapsed .nav-item span:not(.nav-icon),
body.sidebar-collapsed .sidebar-section-label,
body.sidebar-collapsed .sidebar-ftr {
  display: none !important;
}
body.sidebar-collapsed .sidebar-hdr {
  padding: 16px 8px 10px;
  flex-direction: column;
  gap: 12px;
}
body.sidebar-collapsed .logo {
  padding: 6px;
  justify-content: center;
}
body.sidebar-collapsed .nav-item {
  padding: 10px 0;
  justify-content: center;
}
body.sidebar-collapsed .nav-item .nav-icon {
  margin: 0;
}
body.sidebar-collapsed .sidebar-toggle {
  margin: 0 auto;
}
.sidebar-toggle {
  background: transparent;
  border: none;
  color: var(--text-2);
  cursor: pointer;
  border-radius: var(--r);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.sidebar-toggle:hover {
  background: var(--bg-hover);
  color: var(--text);
}
`;

if (!css.includes('body.sidebar-collapsed')) {
  fs.appendFileSync('css/style.css', newCss, 'utf8');
}
