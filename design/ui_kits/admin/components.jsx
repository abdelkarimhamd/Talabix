// Talabix Admin Kit — shared primitives
// Uses Talabix brand: navy #112134 ink, orange #ff8c42 CTA, teal #26a69a, yellow #FFCC00 brand mark
// Font: Space Grotesk (loaded in index.html)

const TK = {
  navy: '#112134',
  navy2: '#1C3450',
  ink: '#1C1C1E',
  orange: '#ff8c42',
  orangeWarm: '#ffb347',
  teal: '#26a69a',
  yellow: '#FFCC00',
  green: '#22A45D',
  red: '#E53935',
  amber: '#F59E0B',
  bg: '#F6F8FB',
  panel: '#fff',
  border: 'rgba(17,33,52,0.08)',
  borderStrong: 'rgba(17,33,52,0.14)',
  text: '#112134',
  muted: '#5c6a78',
  subtle: '#8d9aa8',
  recessed: 'rgba(17,33,52,0.04)',
};

// ── Icons (stroke-based, consistent weight) ───────────────────────────
const I = {
  dash: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  orders: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  catalog: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  promo: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7" y2="7" />
    </svg>
  ),
  reports: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  branch: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  team: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  finance: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  settings: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  search: (p) => (
    <svg
      width={p.s || 16}
      height={p.s || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  bell: (p) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  chevR: (p) => (
    <svg
      width={p.s || 14}
      height={p.s || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  chevD: (p) => (
    <svg
      width={p.s || 14}
      height={p.s || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  plus: (p) => (
    <svg
      width={p.s || 14}
      height={p.s || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  trend: (p) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  more: (p) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={p.c || 'currentColor'}
    >
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  ),
  check: (p) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  x: (p) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  rider: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6l-3 11-2-4H7M15 6h4l-2-3" />
    </svg>
  ),
  logout: (p) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.c || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

// ── Logo ──────────────────────────────────────────────────────────────
function Logo({ size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: TK.yellow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: Math.round(size * 0.55),
        color: TK.navy,
        letterSpacing: -1,
        flexShrink: 0,
      }}
    >
      T
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────────
function Eyebrow({ children, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: color || '#516275',
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 20,
          height: 1,
          background: 'currentColor',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}

function Pill({ label, tone = 'neutral', dot = false }) {
  const tones = {
    neutral: { bg: 'rgba(17,33,52,0.08)', c: '#213547' },
    success: { bg: 'rgba(34,164,93,0.12)', c: '#1a7a44' },
    warn: { bg: 'rgba(255,179,71,0.18)', c: '#9c5b13' },
    alert: { bg: 'rgba(255,140,66,0.14)', c: '#a24f13' },
    danger: { bg: 'rgba(229,57,53,0.12)', c: '#b71c1c' },
    info: { bg: 'rgba(38,166,154,0.15)', c: '#0c665c' },
    brand: { bg: 'rgba(255,204,0,0.25)', c: '#8a6200' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: t.bg,
        color: t.c,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: t.c,
            display: 'inline-block',
          }}
        />
      )}
      {label}
    </span>
  );
}

function Btn({
  label,
  tone = 'primary',
  size = 'md',
  onClick,
  icon,
  style,
  disabled,
}) {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13 },
    md: { h: 40, px: 16, fs: 14 },
    lg: { h: 48, px: 22, fs: 15 },
  };
  const s = sizes[size];
  const tones = {
    primary: {
      bg: `linear-gradient(135deg,${TK.orangeWarm},${TK.orange})`,
      c: TK.navy,
      shadow: '0 8px 18px rgba(255,140,66,.25)',
      b: 'none',
    },
    secondary: {
      bg: 'rgba(17,33,52,0.06)',
      c: TK.navy,
      shadow: 'none',
      b: 'none',
    },
    ghost: {
      bg: 'transparent',
      c: TK.navy,
      shadow: 'none',
      b: `1px solid ${TK.border}`,
    },
    danger: { bg: 'rgba(229,57,53,0.1)', c: TK.red, shadow: 'none', b: 'none' },
    dark: { bg: TK.navy, c: '#fff', shadow: 'none', b: 'none' },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: s.h,
        padding: `0 ${s.px}px`,
        borderRadius: 12,
        background: t.bg,
        color: t.c,
        boxShadow: t.shadow,
        border: t.b,
        fontWeight: 700,
        fontSize: s.fs,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Panel({ children, style, pad = 20 }) {
  return (
    <div
      style={{
        background: TK.panel,
        border: `1px solid ${TK.border}`,
        borderRadius: 16,
        padding: pad,
        boxShadow: '0 1px 2px rgba(17,33,52,.03)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, icon, style, type = 'text' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#fff',
        border: `1px solid ${TK.border}`,
        borderRadius: 10,
        height: 40,
        padding: '0 12px',
        ...style,
      }}
    >
      {icon}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: 14,
          color: TK.text,
          background: 'transparent',
        }}
      />
    </div>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────
function MetricCard({ label, value, delta, deltaUp = true, sub }) {
  return (
    <Panel pad={18}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: TK.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: TK.text,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {delta && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 700,
                color: deltaUp ? TK.green : TK.red,
              }}
            >
              {deltaUp ? <I.trend c={TK.green} /> : <I.trend c={TK.red} />}
              {delta}
            </span>
          )}
          {sub && <span style={{ fontSize: 12, color: TK.muted }}>{sub}</span>}
        </div>
      </div>
    </Panel>
  );
}

// ── Sparkline chart (inline SVG) ─────────────────────────────────────
function Sparkline({ data, color, height = 40, width = 120, filled = true }) {
  const max = Math.max(...data),
    min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data
    .map(
      (d, i) => `${i * step},${height - ((d - min) / range) * (height - 4) - 2}`
    )
    .join(' ');
  const areaPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {filled && <polygon points={areaPts} fill={color} opacity=".14" />}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Bar chart ────────────────────────────────────────────────────────
function BarChart({ data, height = 180, color = TK.orange, labels }) {
  const max = Math.max(...data);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        height,
        padding: '0 4px',
      }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            height: '100%',
          }}
        >
          <div
            style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${(d / max) * 100}%`,
                background: `linear-gradient(180deg,${color} 0%,${TK.orangeWarm} 100%)`,
                borderRadius: '6px 6px 2px 2px',
                minHeight: 6,
              }}
            />
          </div>
          {labels && (
            <span style={{ fontSize: 11, color: TK.muted, fontWeight: 600 }}>
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────
function Table({ cols, rows, style }) {
  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
      >
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th
                key={i}
                style={{
                  textAlign: c.align || 'left',
                  padding: '12px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: TK.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  borderBottom: `1px solid ${TK.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${TK.border}` }}>
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '14px',
                    textAlign: cols[ci].align || 'left',
                    color: ci === 0 ? TK.text : TK.muted,
                    fontWeight: ci === 0 ? 600 : 400,
                    fontVariantNumeric: cols[ci].numeric
                      ? 'tabular-nums'
                      : 'normal',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ active, onNav, role, userBadge }) {
  const storeNav = [
    { k: 'dashboard', label: 'Dashboard', icon: I.dash },
    { k: 'orders', label: 'Live Orders', icon: I.orders, badge: '8' },
    { k: 'catalog', label: 'Menu & Catalog', icon: I.catalog },
    { k: 'promotions', label: 'Promotions', icon: I.promo },
    { k: 'branches', label: 'Branches', icon: I.branch },
    { k: 'team', label: 'Team', icon: I.team },
    { k: 'reports', label: 'Reports', icon: I.reports },
    { k: 'finance', label: 'Payouts', icon: I.finance },
    { k: 'settings', label: 'Store Settings', icon: I.settings },
  ];
  const adminNav = [
    { k: 'overview', label: 'Platform Overview', icon: I.dash },
    { k: 'dispatch', label: 'Live Dispatch', icon: I.rider, badge: '14' },
    { k: 'merchants', label: 'Merchants', icon: I.branch },
    { k: 'riders', label: 'Riders', icon: I.rider },
    { k: 'customers', label: 'Customers', icon: I.team },
    { k: 'promotions', label: 'Campaigns', icon: I.promo },
    { k: 'finance', label: 'Finance & Ledger', icon: I.finance },
    { k: 'reports', label: 'Analytics', icon: I.reports },
  ];
  const superNav = [
    { k: 'superOverview', label: 'Company HQ', icon: I.dash },
    { k: 'tenants', label: 'Tenants', icon: I.branch },
    { k: 'roles', label: 'Roles & Access', icon: I.team },
    { k: 'featureFlags', label: 'Feature Flags', icon: I.settings },
    { k: 'audit', label: 'Audit Log', icon: I.reports },
    { k: 'system', label: 'System Health', icon: I.finance },
  ];
  const nav =
    role === 'store' ? storeNav : role === 'admin' ? adminNav : superNav;
  const title =
    role === 'store'
      ? 'Store Manager'
      : role === 'admin'
        ? 'Ops Admin'
        : 'Super Admin';
  const subtitle =
    role === 'store'
      ? 'Talabix Demo Kitchen · Olaya'
      : role === 'admin'
        ? 'Riyadh region · All merchants'
        : 'Platform-wide governance';

  return (
    <aside
      style={{
        width: 256,
        background: '#fff',
        borderRight: `1px solid ${TK.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Brand + context */}
      <div
        style={{
          padding: '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `1px solid ${TK.border}`,
        }}
      >
        <Logo size={40} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: TK.text,
              lineHeight: 1.1,
            }}
          >
            Talabix
          </div>
          <div
            style={{
              fontSize: 11,
              color: TK.muted,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        </div>
      </div>

      {/* Context switcher for store */}
      {role === 'store' && (
        <div
          style={{
            margin: '14px 14px 6px',
            padding: '10px 12px',
            borderRadius: 12,
            background: TK.recessed,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: '#b8102f',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            DK
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: TK.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Demo Kitchen
            </div>
            <div style={{ fontSize: 10.5, color: TK.muted }}>
              Olaya Branch · Open
            </div>
          </div>
          <I.chevD c={TK.muted} s={14} />
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        <div
          style={{
            padding: '10px 10px 6px',
            fontSize: 10.5,
            fontWeight: 700,
            color: TK.subtle,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Workspace
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map((item) => {
            const on = active === item.k;
            const Icon = item.icon;
            return (
              <button
                key={item.k}
                onClick={() => onNav(item.k)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: on
                    ? `linear-gradient(90deg,rgba(255,140,66,0.11),rgba(255,204,0,0.06))`
                    : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%',
                  textAlign: 'left',
                  color: on ? TK.navy : TK.muted,
                  fontWeight: on ? 700 : 500,
                  fontSize: 13.5,
                  borderLeft: on
                    ? `3px solid ${TK.orange}`
                    : '3px solid transparent',
                  paddingLeft: on ? 9 : 12,
                  transition: 'background 140ms ease',
                }}
              >
                <Icon c={on ? TK.orange : TK.muted} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      background: on ? TK.orange : TK.recessed,
                      color: on ? '#fff' : TK.muted,
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User block */}
      <div
        style={{ borderTop: `1px solid ${TK.border}`, padding: '12px 12px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: `linear-gradient(135deg,${TK.navy},${TK.orange})`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {userBadge || 'SA'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: TK.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Sahar Alotaibi
            </div>
            <div style={{ fontSize: 11, color: TK.muted }}>
              {role === 'super'
                ? 'super_admin'
                : role === 'admin'
                  ? 'ops_admin'
                  : 'store_manager'}
            </div>
          </div>
          <button
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: TK.muted,
              padding: 6,
              borderRadius: 6,
            }}
          >
            <I.logout c={TK.muted} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────
function Topbar({ title, crumbs, role, onRoleChange, right }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '18px 28px',
        background: 'rgba(255,255,255,.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${TK.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {crumbs && (
          <div
            style={{
              fontSize: 12,
              color: TK.muted,
              marginBottom: 3,
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <span>{c}</span>
                {i < crumbs.length - 1 && <I.chevR s={11} c={TK.subtle} />}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: TK.text,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </h1>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Global search */}
        <Input
          icon={<I.search c={TK.subtle} />}
          placeholder="Search orders, merchants, SKUs…"
          style={{ width: 280, background: TK.recessed, border: 'none' }}
        />
        {/* Role switcher */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            background: TK.recessed,
            borderRadius: 10,
          }}
        >
          {[
            { k: 'store', l: 'Store' },
            { k: 'admin', l: 'Admin' },
            { k: 'super', l: 'Super' },
          ].map((r) => (
            <button
              key={r.k}
              onClick={() => onRoleChange(r.k)}
              style={{
                border: 'none',
                padding: '6px 11px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: role === r.k ? '#fff' : 'transparent',
                color: role === r.k ? TK.text : TK.muted,
                boxShadow:
                  role === r.k ? '0 2px 6px rgba(17,33,52,.08)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              {r.l}
            </button>
          ))}
        </div>
        <button
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 10,
            background: TK.recessed,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <I.bell c={TK.text} />
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 9,
              width: 7,
              height: 7,
              borderRadius: 999,
              background: TK.red,
              border: '2px solid #fff',
            }}
          />
        </button>
        {right}
      </div>
    </header>
  );
}

// expose to global scope so screens.jsx can use them
Object.assign(window, {
  TK,
  I,
  Logo,
  Eyebrow,
  Pill,
  Btn,
  Panel,
  Input,
  MetricCard,
  Sparkline,
  BarChart,
  Table,
  Sidebar,
  Topbar,
});
