// Talabix Admin Kit — screens for Store / Admin / Super-Admin
// Depends on globals from components.jsx: TK, I, Logo, Eyebrow, Pill, Btn, Panel, Input, MetricCard, Sparkline, BarChart, Table

// ── Dummy Data ────────────────────────────────────────────────────────
const LIVE_ORDERS = [
  {
    id: '#T82914',
    status: 'new',
    customer: 'Sahar A.',
    items: 3,
    total: '﷼ 84.50',
    eta: '2m ago',
    branch: 'Olaya',
  },
  {
    id: '#T82913',
    status: 'new',
    customer: 'Khalid R.',
    items: 1,
    total: '﷼ 28.00',
    eta: '5m ago',
    branch: 'Olaya',
  },
  {
    id: '#T82912',
    status: 'preparing',
    customer: 'Nour M.',
    items: 4,
    total: '﷼ 142.90',
    eta: '8m',
    branch: 'Malaz',
  },
  {
    id: '#T82911',
    status: 'preparing',
    customer: 'Reem Q.',
    items: 2,
    total: '﷼ 56.00',
    eta: '12m',
    branch: 'Olaya',
  },
  {
    id: '#T82910',
    status: 'ready',
    customer: 'Omar F.',
    items: 1,
    total: '﷼ 32.00',
    eta: 'Waiting rider',
    branch: 'North',
  },
  {
    id: '#T82909',
    status: 'dispatched',
    customer: 'Lina H.',
    items: 3,
    total: '﷼ 118.50',
    eta: 'Rider: Faris · 6m ETA',
    branch: 'Olaya',
  },
];

// ── Section: Section Header ───────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub, right }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: TK.text,
            marginTop: eyebrow ? 6 : 0,
            letterSpacing: -0.2,
          }}
        >
          {title}
        </h2>
        {sub && (
          <p style={{ fontSize: 13, color: TK.muted, marginTop: 4 }}>{sub}</p>
        )}
      </div>
      {right}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// STORE MANAGER SCREENS
// ══════════════════════════════════════════════════════════════════════

function StoreDashboard() {
  const trendWeek = [42, 58, 51, 67, 72, 89, 95];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Alert strip */}
      <Panel
        pad={16}
        style={{
          background:
            'linear-gradient(90deg,rgba(255,140,66,0.09),rgba(255,204,0,0.05))',
          borderColor: 'rgba(255,140,66,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `rgba(255,140,66,0.18)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <I.orders c={TK.orange} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TK.text }}>
              8 new orders awaiting acceptance
            </div>
            <div style={{ fontSize: 12.5, color: TK.muted, marginTop: 2 }}>
              Average SLA this hour: 1m 24s · Target: under 2m
            </div>
          </div>
          <Btn label="Go to orders" tone="primary" size="sm" />
        </div>
      </Panel>

      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
        }}
      >
        <MetricCard
          label="Today's Orders"
          value="142"
          delta="+18%"
          sub="vs. yesterday"
        />
        <MetricCard
          label="Gross Sales"
          value="﷼ 8,942"
          delta="+12%"
          sub="vs. yesterday"
        />
        <MetricCard label="Avg Order Value" value="﷼ 63" delta="+4%" />
        <MetricCard
          label="Acceptance Rate"
          value="96%"
          delta="+2%"
          sub="last 7 days"
        />
      </div>

      {/* Charts row */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}
      >
        <Panel>
          <SectionHeader
            eyebrow="Sales this week"
            title="Daily revenue"
            sub="Mon – Sun, SAR thousands"
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill label="Revenue" tone="alert" dot />
                <Pill label="Orders" tone="info" dot />
              </div>
            }
          />
          <BarChart
            data={trendWeek}
            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            height={200}
          />
        </Panel>
        <Panel>
          <SectionHeader eyebrow="Live operations" title="Order pipeline" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'New', count: 8, color: TK.orange },
              { label: 'Preparing', count: 12, color: TK.amber },
              { label: 'Ready for pickup', count: 4, color: TK.teal },
              { label: 'With rider', count: 7, color: TK.green },
              { label: 'Delivered today', count: 111, color: TK.muted },
            ].map((r) => (
              <div
                key={r.label}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: r.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    color: TK.text,
                    fontWeight: 500,
                  }}
                >
                  {r.label}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: TK.text,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Top items + team */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Panel>
          <SectionHeader
            eyebrow="Best sellers"
            title="Top menu items today"
            right={<Btn label="View all" tone="ghost" size="sm" />}
          />
          <Table
            cols={[
              { label: 'Item' },
              { label: 'Sold', align: 'right', numeric: true },
              { label: 'Revenue', align: 'right', numeric: true },
            ]}
            rows={[
              ['Classic Burger', '28', '﷼ 784'],
              ['Double Smash', '19', '﷼ 722'],
              ['Crispy Chicken', '14', '﷼ 448'],
              ['Veggie Wrap', '9', '﷼ 216'],
            ]}
          />
        </Panel>
        <Panel>
          <SectionHeader
            eyebrow="Today's shift"
            title="Team on duty"
            right={<Btn label="Manage" tone="ghost" size="sm" />}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { n: 'Ahmed K.', r: 'Kitchen Lead', s: 'active', hrs: '6h 20m' },
              { n: 'Yasmin B.', r: 'Cashier', s: 'active', hrs: '4h 10m' },
              { n: 'Mazen T.', r: 'Kitchen', s: 'break', hrs: '5h 00m' },
              { n: 'Salma D.', r: 'Cashier', s: 'active', hrs: '3h 45m' },
            ].map((p) => (
              <div
                key={p.n}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: `1px solid ${TK.border}`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: TK.recessed,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    color: TK.text,
                  }}
                >
                  {p.n
                    .split(' ')
                    .map((x) => x[0])
                    .join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13.5, fontWeight: 700, color: TK.text }}
                  >
                    {p.n}
                  </div>
                  <div style={{ fontSize: 12, color: TK.muted }}>{p.r}</div>
                </div>
                <Pill
                  label={p.s === 'active' ? 'On shift' : 'On break'}
                  tone={p.s === 'active' ? 'success' : 'warn'}
                  dot
                />
                <span
                  style={{
                    fontSize: 12,
                    color: TK.muted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p.hrs}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StoreLiveOrders() {
  const lanes = [
    { k: 'new', label: 'New', tone: 'alert', count: 2 },
    { k: 'preparing', label: 'Preparing', tone: 'warn', count: 2 },
    { k: 'ready', label: 'Ready for pickup', tone: 'info', count: 1 },
    { k: 'dispatched', label: 'With rider', tone: 'success', count: 1 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <Pill label="Live · Auto-refresh 10s" tone="success" dot />
        <Pill label="All branches" />
        <Pill label="Today" />
        <div style={{ flex: 1 }} />
        <Btn label="+ Manual order" tone="secondary" size="sm" />
        <Btn label="Print queue" tone="primary" size="sm" />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
        }}
      >
        {lanes.map((lane) => {
          const orders = LIVE_ORDERS.filter((o) => o.status === lane.k);
          return (
            <div
              key={lane.k}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 4px',
                }}
              >
                <Pill label={lane.label} tone={lane.tone} dot />
                <span
                  style={{ fontSize: 12, color: TK.muted, fontWeight: 600 }}
                >
                  {orders.length}
                </span>
              </div>
              {orders.map((o) => (
                <Panel key={o.id} pad={14} style={{ cursor: 'grab' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: TK.text,
                        letterSpacing: 0.3,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {o.id}
                    </span>
                    <span style={{ fontSize: 11, color: TK.subtle }}>
                      {o.eta}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: TK.text,
                      marginBottom: 2,
                    }}
                  >
                    {o.customer}
                  </div>
                  <div
                    style={{ fontSize: 12, color: TK.muted, marginBottom: 10 }}
                  >
                    {o.items} items · {o.branch}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: TK.text,
                      marginBottom: 10,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {o.total}
                  </div>
                  {o.status === 'new' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn
                        label="Accept"
                        tone="primary"
                        size="sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                        icon={<I.check c={TK.navy} />}
                      />
                      <Btn
                        label=""
                        tone="danger"
                        size="sm"
                        icon={<I.x c={TK.red} />}
                      />
                    </div>
                  )}
                  {o.status === 'preparing' && (
                    <Btn
                      label="Mark ready"
                      tone="secondary"
                      size="sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    />
                  )}
                  {o.status === 'ready' && (
                    <Btn
                      label="Call rider"
                      tone="primary"
                      size="sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    />
                  )}
                  {o.status === 'dispatched' && (
                    <Btn
                      label="Track rider"
                      tone="ghost"
                      size="sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    />
                  )}
                </Panel>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StoreCatalog() {
  const items = [
    {
      n: 'Classic Burger',
      cat: 'Burgers',
      p: '﷼ 28',
      stock: 'In stock',
      sold: 284,
      img: '#b8102f',
    },
    {
      n: 'Double Smash',
      cat: 'Burgers',
      p: '﷼ 38',
      stock: 'In stock',
      sold: 192,
      img: '#b8102f',
    },
    {
      n: 'Crispy Chicken',
      cat: 'Sandwiches',
      p: '﷼ 32',
      stock: 'Low',
      sold: 142,
      img: '#7b1b10',
    },
    {
      n: 'Veggie Wrap',
      cat: 'Sandwiches',
      p: '﷼ 24',
      stock: 'Out',
      sold: 86,
      img: '#0f7f56',
    },
    {
      n: 'Fresh Lemonade',
      cat: 'Drinks',
      p: '﷼ 14',
      stock: 'In stock',
      sold: 412,
      img: '#1d5f87',
    },
    {
      n: 'Chocolate Shake',
      cat: 'Drinks',
      p: '﷼ 18',
      stock: 'In stock',
      sold: 228,
      img: '#7132a8',
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Input
          placeholder="Search items…"
          icon={<I.search c={TK.subtle} />}
          style={{ width: 320 }}
        />
        <Pill label="All categories" />
        <Pill label="All branches" />
        <div style={{ flex: 1 }} />
        <Btn label="Import CSV" tone="ghost" size="sm" />
        <Btn
          label="+ Add item"
          tone="primary"
          size="sm"
          icon={<I.plus c={TK.navy} />}
        />
      </div>

      <Panel pad={0}>
        {/* Category tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '14px 16px',
            borderBottom: `1px solid ${TK.border}`,
            overflowX: 'auto',
          }}
        >
          {[
            'All Items',
            'Burgers',
            'Sandwiches',
            'Drinks',
            'Sides',
            'Desserts',
          ].map((c, i) => (
            <button
              key={c}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: 999,
                background: i === 0 ? TK.navy : 'transparent',
                color: i === 0 ? '#fff' : TK.muted,
                fontSize: 13,
                fontWeight: i === 0 ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <Table
          cols={[
            { label: 'Item' },
            { label: 'Category' },
            { label: 'Price', align: 'right', numeric: true },
            { label: 'Stock' },
            { label: 'Sold 30d', align: 'right', numeric: true },
            { label: '' },
          ]}
          rows={items.map((i) => [
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: i.img,
                  flexShrink: 0,
                }}
              />
              <span>{i.n}</span>
            </div>,
            i.cat,
            i.p,
            <Pill
              label={i.stock}
              tone={
                i.stock === 'In stock'
                  ? 'success'
                  : i.stock === 'Low'
                    ? 'warn'
                    : 'danger'
              }
              dot
            />,
            i.sold,
            <div
              style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
            >
              <Btn label="Edit" tone="ghost" size="sm" />
              <button
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 6,
                  color: TK.muted,
                  borderRadius: 6,
                }}
              >
                <I.more />
              </button>
            </div>,
          ])}
        />
      </Panel>
    </div>
  );
}

function StoreBranches() {
  const branches = [
    {
      n: 'Olaya Branch',
      addr: 'Olaya Street, Riyadh',
      st: 'Open',
      orders: 92,
      staff: 8,
      tone: 'success',
    },
    {
      n: 'Malaz Branch',
      addr: 'King Fahad Rd, Malaz',
      st: 'Open',
      orders: 61,
      staff: 5,
      tone: 'success',
    },
    {
      n: 'North Branch',
      addr: 'Uruba Rd, North Riyadh',
      st: 'Closed · Holiday',
      orders: 0,
      staff: 0,
      tone: 'muted',
    },
    {
      n: 'Jeddah Corniche',
      addr: 'Corniche Rd, Jeddah',
      st: 'Pending approval',
      orders: 0,
      staff: 3,
      tone: 'warn',
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Input
          placeholder="Search branches…"
          icon={<I.search c={TK.subtle} />}
          style={{ flex: 1, maxWidth: 360 }}
        />
        <div style={{ flex: 1 }} />
        <Btn
          label="+ Add branch"
          tone="primary"
          size="sm"
          icon={<I.plus c={TK.navy} />}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2,1fr)',
          gap: 14,
        }}
      >
        {branches.map((b) => (
          <Panel key={b.n}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `linear-gradient(135deg,${TK.navy},${TK.orange})`,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <I.branch c="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 800, color: TK.text }}
                  >
                    {b.n}
                  </span>
                  <Pill label={b.st} tone={b.tone} dot />
                </div>
                <div style={{ fontSize: 12.5, color: TK.muted }}>{b.addr}</div>
                <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: TK.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                      }}
                    >
                      Orders today
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: TK.text,
                        marginTop: 2,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {b.orders}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: TK.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                      }}
                    >
                      On shift
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: TK.text,
                        marginTop: 2,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {b.staff}
                    </div>
                  </div>
                </div>
              </div>
              <button
                style={{
                  border: 'none',
                  background: TK.recessed,
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8,
                  color: TK.muted,
                }}
              >
                <I.more />
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// OPS ADMIN SCREENS
// ══════════════════════════════════════════════════════════════════════

function AdminOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
        }}
      >
        <MetricCard
          label="GMV Today"
          value="﷼ 284,942"
          delta="+14%"
          sub="vs. yesterday"
        />
        <MetricCard label="Active Orders" value="184" delta="+8%" />
        <MetricCard
          label="Active Riders"
          value="62 / 94"
          sub="66% fleet utilization"
        />
        <MetricCard
          label="Platform Net"
          value="﷼ 42,741"
          delta="+16%"
          sub="15% commission"
        />
      </div>

      {/* Map + SLA breakdown */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}
      >
        <Panel pad={0} style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '18px 20px',
              borderBottom: `1px solid ${TK.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Eyebrow>Riyadh region · live</Eyebrow>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: TK.text,
                  marginTop: 4,
                }}
              >
                Fleet map
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Pill label="62 riders" tone="success" dot />
              <Pill label="184 orders" tone="alert" dot />
            </div>
          </div>
          {/* map canvas */}
          <div
            style={{
              position: 'relative',
              height: 320,
              background: `linear-gradient(160deg,rgba(255,248,240,.7),rgba(233,243,251,.8))`,
              backgroundImage: `repeating-linear-gradient(90deg,rgba(17,33,52,.04) 0,rgba(17,33,52,.04) 1px,transparent 1px,transparent 64px),repeating-linear-gradient(0deg,rgba(17,33,52,.04) 0,rgba(17,33,52,.04) 1px,transparent 1px,transparent 64px)`,
            }}
          >
            {/* routes */}
            <svg
              width="100%"
              height="100%"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              preserveAspectRatio="none"
              viewBox="0 0 800 320"
            >
              <path
                d="M180 120 Q 260 90 340 160 T 520 180"
                fill="none"
                stroke={TK.orange}
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.6"
              />
              <path
                d="M420 70 Q 520 110 620 200"
                fill="none"
                stroke={TK.teal}
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.6"
              />
              <path
                d="M100 230 Q 220 250 320 210"
                fill="none"
                stroke={TK.orange}
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.6"
              />
            </svg>
            {[
              {
                x: '22%',
                y: '38%',
                t: 'm',
                l: 'Demo Kitchen · 12 active',
                c: TK.orange,
              },
              {
                x: '52%',
                y: '22%',
                t: 'm',
                l: 'Green Market · 4 active',
                c: TK.orange,
              },
              {
                x: '76%',
                y: '60%',
                t: 'm',
                l: 'Coffee Corner · 2 active',
                c: TK.orange,
              },
              { x: '38%', y: '58%', t: 'r', l: 'Faris · #T82909', c: TK.navy },
              { x: '64%', y: '44%', t: 'r', l: 'Walid · #T82886', c: TK.navy },
              { x: '28%', y: '72%', t: 'r', l: 'Nasser · #T82903', c: TK.navy },
              { x: '14%', y: '78%', t: 'd', l: 'Drop · Malaz', c: TK.teal },
              { x: '80%', y: '80%', t: 'd', l: 'Drop · Olaya', c: TK.teal },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: m.x,
                  top: m.y,
                  transform: 'translate(-50%,-50%)',
                }}
              >
                <div
                  style={{
                    width: m.t === 'm' ? 18 : 14,
                    height: m.t === 'm' ? 18 : 14,
                    borderRadius: m.t === 'd' ? 4 : 999,
                    background: m.c,
                    border: '2.5px solid #fff',
                    boxShadow: '0 4px 10px rgba(17,33,52,.18)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: m.t === 'm' ? 22 : 18,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,.95)',
                    color: TK.text,
                    fontSize: 10.5,
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(17,33,52,.08)',
                  }}
                >
                  {m.l}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader eyebrow="Service level" title="SLA breakdown" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Acceptance < 2m', val: 94, tone: TK.green },
              { label: 'Prep time < 20m', val: 87, tone: TK.green },
              { label: 'Pickup < 8m', val: 76, tone: TK.amber },
              { label: 'Delivery < 40m', val: 82, tone: TK.green },
              { label: 'CSAT > 4.5', val: 91, tone: TK.green },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: TK.text }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: s.tone,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {s.val}%
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: TK.recessed,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${s.val}%`,
                      height: '100%',
                      background: `linear-gradient(90deg,${s.tone},${s.tone}cc)`,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Alerts + top merchants */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}
      >
        <Panel>
          <SectionHeader
            eyebrow="Needs attention"
            title="Active incidents"
            right={<Btn label="View all" tone="ghost" size="sm" />}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                sev: 'danger',
                t: 'Rider offline > 30m',
                m: '2 riders in Malaz zone',
                age: '12m ago',
              },
              {
                sev: 'warn',
                t: 'Preparation SLA breach',
                m: 'Bloom & Rose · 4 orders > 25m',
                age: '8m ago',
              },
              {
                sev: 'warn',
                t: 'Payment gateway degraded',
                m: 'Mada success rate: 94%',
                age: '25m ago',
              },
              {
                sev: 'info',
                t: 'Campaign ending soon',
                m: 'Free delivery weekend · 3h left',
                age: '1h ago',
              },
            ].map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background:
                    a.sev === 'danger'
                      ? 'rgba(229,57,53,0.05)'
                      : a.sev === 'warn'
                        ? 'rgba(245,158,11,0.07)'
                        : TK.recessed,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    marginTop: 7,
                    background:
                      a.sev === 'danger'
                        ? TK.red
                        : a.sev === 'warn'
                          ? TK.amber
                          : TK.teal,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: TK.text }}
                  >
                    {a.t}
                  </div>
                  <div style={{ fontSize: 12, color: TK.muted, marginTop: 2 }}>
                    {a.m}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: TK.subtle, flexShrink: 0 }}>
                  {a.age}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionHeader
            eyebrow="Revenue leaders"
            title="Top merchants — 7d"
            right={<Btn label="Export" tone="ghost" size="sm" />}
          />
          <Table
            cols={[
              { label: 'Merchant' },
              { label: 'Orders', align: 'right', numeric: true },
              { label: 'GMV', align: 'right', numeric: true },
              { label: 'SLA' },
              { label: 'Trend' },
            ]}
            rows={[
              [
                'Talabix Demo Kitchen',
                '412',
                '﷼ 28,840',
                <Pill label="98%" tone="success" />,
                <Sparkline
                  data={[10, 14, 13, 18, 22, 21, 28]}
                  color={TK.green}
                />,
              ],
              [
                'Green Market',
                '298',
                '﷼ 21,420',
                <Pill label="94%" tone="success" />,
                <Sparkline
                  data={[8, 10, 9, 12, 13, 15, 18]}
                  color={TK.green}
                />,
              ],
              [
                'Coffee Corner',
                '246',
                '﷼ 12,760',
                <Pill label="91%" tone="warn" />,
                <Sparkline data={[6, 9, 7, 10, 12, 11, 14]} color={TK.amber} />,
              ],
              [
                'Bloom & Rose',
                '102',
                '﷼ 9,530',
                <Pill label="82%" tone="warn" />,
                <Sparkline data={[4, 6, 5, 7, 6, 8, 7]} color={TK.amber} />,
              ],
              [
                'Ennabi Grill',
                '178',
                '﷼ 14,280',
                <Pill label="96%" tone="success" />,
                <Sparkline
                  data={[7, 8, 10, 12, 11, 14, 16]}
                  color={TK.green}
                />,
              ],
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

function AdminDispatch() {
  const assignments = [
    {
      id: '#T82909',
      rider: 'Faris Almutairi',
      status: 'en_route',
      sla: 'success',
      eta: '6 min',
      from: 'Olaya Branch',
      to: 'King Fahad Rd',
    },
    {
      id: '#T82886',
      rider: 'Walid Saad',
      status: 'picked_up',
      sla: 'warn',
      eta: '14 min',
      from: 'Malaz Branch',
      to: 'Tahlia St',
    },
    {
      id: '#T82903',
      rider: 'Nasser Alhajri',
      status: 'assigned',
      sla: 'success',
      eta: '22 min',
      from: 'North Branch',
      to: 'Uruba Rd',
    },
    {
      id: '#T82876',
      rider: 'Tariq Obeid',
      status: 'en_route',
      sla: 'danger',
      eta: 'ETA breach',
      from: 'Coffee Corner',
      to: 'Diplomatic Qtr',
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <Pill label="Live · 14 active" tone="alert" dot />
        <Pill label="All zones" />
        <Pill label="All SLA tiers" />
        <div style={{ flex: 1 }} />
        <Btn label="Rebalance fleet" tone="secondary" size="sm" />
        <Btn label="Open incident" tone="dark" size="sm" />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
        }}
      >
        {assignments.map((a) => (
          <Panel key={a.id} pad={14}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: TK.text,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {a.id}
              </span>
              <Pill label={`ETA ${a.eta}`} tone={a.sla} dot />
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: TK.text,
                marginBottom: 2,
              }}
            >
              {a.rider}
            </div>
            <div style={{ fontSize: 12, color: TK.muted, marginBottom: 12 }}>
              {a.status.replace('_', ' ')}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '10px 12px',
                borderRadius: 10,
                background: TK.recessed,
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: TK.muted, width: 38 }}>From</span>
                <span style={{ color: TK.text, fontWeight: 600 }}>
                  {a.from}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: TK.muted, width: 38 }}>To</span>
                <span style={{ color: TK.text, fontWeight: 600 }}>{a.to}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <Btn
                label="Message"
                tone="secondary"
                size="sm"
                style={{ flex: 1, justifyContent: 'center' }}
              />
              <Btn
                label="Reassign"
                tone="ghost"
                size="sm"
                style={{ flex: 1, justifyContent: 'center' }}
              />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function AdminMerchants() {
  const merchants = [
    {
      n: 'Talabix Demo Kitchen',
      br: 6,
      st: 'Active',
      gmv: '﷼ 184,420',
      com: '15%',
      tone: 'success',
      logo: '#b8102f',
    },
    {
      n: 'Green Market',
      br: 3,
      st: 'Active',
      gmv: '﷼ 112,200',
      com: '12%',
      tone: 'success',
      logo: '#0f7f56',
    },
    {
      n: 'Coffee Corner',
      br: 4,
      st: 'Active',
      gmv: '﷼ 68,100',
      com: '15%',
      tone: 'success',
      logo: '#1d5f87',
    },
    {
      n: 'Bloom & Rose',
      br: 1,
      st: 'Warnings',
      gmv: '﷼ 29,530',
      com: '18%',
      tone: 'warn',
      logo: '#7132a8',
    },
    {
      n: 'Ennabi Grill',
      br: 2,
      st: 'Active',
      gmv: '﷼ 95,280',
      com: '15%',
      tone: 'success',
      logo: '#7b1b10',
    },
    {
      n: 'Pharma Plus',
      br: 8,
      st: 'Suspended',
      gmv: '﷼ 4,120',
      com: '10%',
      tone: 'danger',
      logo: '#205078',
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Input
          placeholder="Search merchants…"
          icon={<I.search c={TK.subtle} />}
          style={{ width: 300 }}
        />
        <Pill label="Status: all" />
        <Pill label="Category: all" />
        <Pill label="Region: Riyadh" />
        <div style={{ flex: 1 }} />
        <Btn label="Export" tone="ghost" size="sm" />
        <Btn
          label="+ Onboard merchant"
          tone="primary"
          size="sm"
          icon={<I.plus c={TK.navy} />}
        />
      </div>
      <Panel pad={0}>
        <Table
          cols={[
            { label: 'Merchant' },
            { label: 'Branches', align: 'right', numeric: true },
            { label: 'Status' },
            { label: 'GMV 30d', align: 'right', numeric: true },
            { label: 'Commission', align: 'right' },
            { label: '' },
          ]}
          rows={merchants.map((m) => [
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: m.logo,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {m.n[0]}
              </div>
              <div>
                <div
                  style={{ fontSize: 13.5, fontWeight: 700, color: TK.text }}
                >
                  {m.n}
                </div>
                <div style={{ fontSize: 11.5, color: TK.muted }}>
                  ID: MERC-{((Math.random() * 9999) | 0) + 1000}
                </div>
              </div>
            </div>,
            m.br,
            <Pill label={m.st} tone={m.tone} dot />,
            m.gmv,
            m.com,
            <div
              style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
            >
              <Btn label="Open" tone="ghost" size="sm" />
              <button
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 6,
                  color: TK.muted,
                  borderRadius: 6,
                }}
              >
                <I.more />
              </button>
            </div>,
          ])}
        />
      </Panel>
    </div>
  );
}

function AdminFinance() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
        }}
      >
        <MetricCard
          label="Gross Sales — MTD"
          value="﷼ 4,842,911"
          delta="+22%"
        />
        <MetricCard
          label="Merchant Payouts"
          value="﷼ 4,116,474"
          sub="85% of gross"
        />
        <MetricCard
          label="Rider Earnings"
          value="﷼ 384,220"
          sub="8% of gross"
        />
        <MetricCard
          label="Platform Net"
          value="﷼ 726,437"
          delta="+18%"
          sub="15% commission"
        />
      </div>
      <Panel>
        <SectionHeader
          eyebrow="Weekly"
          title="Revenue breakdown"
          right={
            <div style={{ display: 'flex', gap: 6 }}>
              <Pill label="Gross" tone="alert" dot />
              <Pill label="Net" tone="info" dot />
            </div>
          }
        />
        <BarChart
          data={[180, 220, 195, 245, 280, 310, 285]}
          labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']}
          height={200}
        />
      </Panel>
      <Panel pad={0}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${TK.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div>
            <Eyebrow>Pending settlements</Eyebrow>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: TK.text,
                marginTop: 4,
              }}
            >
              Merchant payout ledger
            </h2>
          </div>
          <div style={{ flex: 1 }} />
          <Btn label="Export CSV" tone="ghost" size="sm" />
          <Btn label="Process batch" tone="primary" size="sm" />
        </div>
        <Table
          cols={[
            { label: 'Merchant' },
            { label: 'Period' },
            { label: 'Orders', align: 'right', numeric: true },
            { label: 'Gross', align: 'right', numeric: true },
            { label: 'Commission', align: 'right', numeric: true },
            { label: 'Net payout', align: 'right', numeric: true },
            { label: 'Status' },
          ]}
          rows={[
            [
              'Talabix Demo Kitchen',
              'W14',
              '412',
              '﷼ 28,840',
              '﷼ 4,326',
              '﷼ 24,514',
              <Pill label="Pending" tone="warn" dot />,
            ],
            [
              'Green Market',
              'W14',
              '298',
              '﷼ 21,420',
              '﷼ 2,570',
              '﷼ 18,850',
              <Pill label="Pending" tone="warn" dot />,
            ],
            [
              'Coffee Corner',
              'W13',
              '246',
              '﷼ 12,760',
              '﷼ 1,914',
              '﷼ 10,846',
              <Pill label="Paid" tone="success" dot />,
            ],
            [
              'Ennabi Grill',
              'W13',
              '178',
              '﷼ 14,280',
              '﷼ 2,142',
              '﷼ 12,138',
              <Pill label="Paid" tone="success" dot />,
            ],
            [
              'Bloom & Rose',
              'W13',
              '102',
              '﷼ 9,530',
              '﷼ 1,715',
              '﷼ 7,815',
              <Pill label="Hold · Review" tone="danger" dot />,
            ],
          ]}
        />
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SUPER ADMIN SCREENS
// ══════════════════════════════════════════════════════════════════════

function SuperOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero strip */}
      <Panel
        style={{
          background: `linear-gradient(135deg,${TK.navy} 0%,#1e3a5f 70%,${TK.orange} 200%)`,
          border: 'none',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr repeat(3,1fr)',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600,
              }}
            >
              <span
                style={{ width: 20, height: 1, background: 'currentColor' }}
              />
              Super admin
            </span>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                marginTop: 8,
                letterSpacing: -0.5,
              }}
            >
              Talabix Platform HQ
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 6,
                maxWidth: 420,
              }}
            >
              Cross-tenant governance — every region, role, and environment.
              Changes here cascade platform-wide.
            </p>
          </div>
          {[
            { l: 'Tenants', v: '14', s: '12 active · 2 staging' },
            { l: 'Regions', v: '6', s: 'Riyadh, Jeddah, Dammam +3' },
            { l: 'Uptime 30d', v: '99.94%', s: 'SLA target: 99.9%' },
          ].map((k) => (
            <div key={k.l}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                }}
              >
                {k.l}
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  marginTop: 4,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {k.v}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: 2,
                }}
              >
                {k.s}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* System health + feature flags */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}
      >
        <Panel>
          <SectionHeader eyebrow="Real-time" title="System health" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2,1fr)',
              gap: 12,
            }}
          >
            {[
              { s: 'API · customer', v: 'Healthy', p: 99.98, t: 'success' },
              { s: 'API · merchant', v: 'Healthy', p: 99.96, t: 'success' },
              { s: 'API · rider', v: 'Degraded', p: 97.12, t: 'warn' },
              { s: 'Payments · Mada', v: 'Degraded', p: 94.2, t: 'warn' },
              { s: 'Notifications', v: 'Healthy', p: 99.99, t: 'success' },
              { s: 'Search index', v: 'Healthy', p: 100, t: 'success' },
            ].map((r) => (
              <div
                key={r.s}
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  border: `1px solid ${TK.border}`,
                  background: r.t === 'warn' ? 'rgba(245,158,11,0.05)' : '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: TK.text }}
                  >
                    {r.s}
                  </span>
                  <Pill label={r.v} tone={r.t} dot />
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: TK.text,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.p}%
                </div>
                <div style={{ fontSize: 11, color: TK.muted }}>
                  30-day availability
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            eyebrow="Platform"
            title="Feature flags"
            right={<Btn label="+ New flag" tone="ghost" size="sm" />}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              {
                n: 'ramadan_experience',
                d: 'Ramadan UI + menus',
                on: true,
                roll: '100%',
                env: 'prod',
              },
              {
                n: 'live_tracking_v2',
                d: 'Rider tracking rewrite',
                on: true,
                roll: '35%',
                env: 'prod',
              },
              {
                n: 'group_orders',
                d: 'Multi-user carts',
                on: false,
                roll: '0%',
                env: 'staging',
              },
              {
                n: 'ai_reorder_tips',
                d: 'Claude-powered suggestions',
                on: true,
                roll: '10%',
                env: 'prod',
              },
              {
                n: 'pickup_discounts',
                d: 'Auto 30% pickup',
                on: true,
                roll: '100%',
                env: 'prod',
              },
            ].map((f) => (
              <FlagRow key={f.n} flag={f} />
            ))}
          </div>
        </Panel>
      </div>

      {/* Audit stream */}
      <Panel>
        <SectionHeader
          eyebrow="Last 24 hours"
          title="Audit stream"
          right={<Btn label="Open full log" tone="ghost" size="sm" />}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            {
              t: '2m ago',
              a: 'Sahar A.',
              e: 'Approved merchant',
              d: 'MERC-4821 · Ennabi Grill Jeddah',
              sev: 'success',
            },
            {
              t: '18m ago',
              a: 'platform.system',
              e: 'Feature flag toggled',
              d: 'ai_reorder_tips 5% → 10%',
              sev: 'info',
            },
            {
              t: '47m ago',
              a: 'Omar K.',
              e: 'Refund issued',
              d: 'Order #T82481 · ﷼ 142 · reason: quality',
              sev: 'warn',
            },
            {
              t: '1h ago',
              a: 'Sahar A.',
              e: 'Role granted',
              d: 'Walid Saad → ops_admin (Jeddah)',
              sev: 'info',
            },
            {
              t: '3h ago',
              a: 'platform.system',
              e: 'Commission updated',
              d: 'Green Market: 12% → 13% (W15)',
              sev: 'warn',
            },
            {
              t: '5h ago',
              a: 'Omar K.',
              e: 'Tenant suspended',
              d: 'MERC-2104 · Pharma Plus · reason: KYC',
              sev: 'danger',
            },
          ].map((l, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 0',
                borderBottom: `1px solid ${TK.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: TK.subtle,
                  width: 60,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {l.t}
              </span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: TK.recessed,
                  color: TK.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {l.a
                  .split(' ')
                  .map((x) => x[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: TK.text,
                  width: 130,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {l.a}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: TK.text,
                  width: 180,
                  flexShrink: 0,
                }}
              >
                {l.e}
              </span>
              <span style={{ fontSize: 12.5, color: TK.muted, flex: 1 }}>
                {l.d}
              </span>
              <Pill
                label={
                  l.sev === 'danger'
                    ? 'Critical'
                    : l.sev === 'warn'
                      ? 'Review'
                      : l.sev === 'info'
                        ? 'Info'
                        : 'OK'
                }
                tone={l.sev}
                dot
              />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function FlagRow({ flag }) {
  const [on, setOn] = React.useState(flag.on);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${TK.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: TK.text,
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            {flag.n}
          </code>
          <Pill label={flag.env} tone={flag.env === 'prod' ? 'info' : 'warn'} />
        </div>
        <div style={{ fontSize: 12, color: TK.muted, marginTop: 3 }}>
          {flag.d}
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: TK.muted,
          fontVariantNumeric: 'tabular-nums',
          width: 50,
          textAlign: 'right',
        }}
      >
        {flag.roll}
      </div>
      <div
        onClick={() => setOn((v) => !v)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          background: on ? TK.green : TK.border,
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 200ms',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: on ? 20 : 2,
            transition: 'left 180ms',
            boxShadow: '0 2px 5px rgba(0,0,0,.2)',
          }}
        />
      </div>
    </div>
  );
}

function SuperRoles() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Panel>
        <SectionHeader
          eyebrow="RBAC"
          title="Role matrix"
          sub="Column = actor role · Row = capability · Matches the shared ability maps in @talabix/shared"
          right={
            <Btn
              label="+ New role"
              tone="primary"
              size="sm"
              icon={<I.plus c={TK.navy} />}
            />
          }
        />
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: TK.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: `1px solid ${TK.border}`,
                  }}
                >
                  Capability
                </th>
                {[
                  'customer',
                  'store_manager',
                  'store_cashier',
                  'ops_admin',
                  'super_admin',
                ].map((r) => (
                  <th
                    key={r}
                    style={{
                      textAlign: 'center',
                      padding: '12px 14px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: TK.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderBottom: `1px solid ${TK.border}`,
                    }}
                  >
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { c: 'orders.place', m: [1, 0, 0, 0, 0] },
                { c: 'orders.view_own', m: [1, 1, 1, 1, 1] },
                { c: 'orders.accept', m: [0, 1, 1, 1, 1] },
                { c: 'orders.refund', m: [0, 0, 0, 1, 1] },
                { c: 'catalog.read', m: [1, 1, 1, 1, 1] },
                { c: 'catalog.write', m: [0, 1, 0, 1, 1] },
                { c: 'payouts.view', m: [0, 1, 0, 1, 1] },
                { c: 'payouts.process', m: [0, 0, 0, 1, 1] },
                { c: 'tenant.suspend', m: [0, 0, 0, 0, 1] },
                { c: 'flags.toggle', m: [0, 0, 0, 0, 1] },
                { c: 'audit.read', m: [0, 0, 0, 1, 1] },
                { c: 'system.access', m: [0, 0, 0, 0, 1] },
              ].map((row) => (
                <tr
                  key={row.c}
                  style={{ borderBottom: `1px solid ${TK.border}` }}
                >
                  <td
                    style={{
                      padding: '12px 14px',
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: TK.text,
                    }}
                  >
                    {row.c}
                  </td>
                  {row.m.map((v, i) => (
                    <td
                      key={i}
                      style={{ textAlign: 'center', padding: '12px 14px' }}
                    >
                      {v ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: 'rgba(34,164,93,0.15)',
                            color: TK.green,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <I.check c={TK.green} />
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 24,
                            height: 2,
                            background: TK.border,
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Panel>
          <SectionHeader eyebrow="Identity" title="Active administrators" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                n: 'Sahar Alotaibi',
                r: 'super_admin',
                s: 'online',
                tenants: 'All',
              },
              {
                n: 'Omar Khalifa',
                r: 'ops_admin',
                s: 'online',
                tenants: 'Riyadh',
              },
              { n: 'Reem Q.', r: 'ops_admin', s: 'away', tenants: 'Jeddah' },
              {
                n: 'Walid Saad',
                r: 'store_manager',
                s: 'online',
                tenants: 'Demo Kitchen',
              },
              {
                n: 'Lina Hassan',
                r: 'store_cashier',
                s: 'offline',
                tenants: 'Demo Kitchen · Olaya',
              },
            ].map((u) => (
              <div
                key={u.n}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: TK.recessed,
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
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
                      fontSize: 12,
                    }}
                  >
                    {u.n
                      .split(' ')
                      .map((x) => x[0])
                      .join('')}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      border: '2px solid #fff',
                      background:
                        u.s === 'online'
                          ? TK.green
                          : u.s === 'away'
                            ? TK.amber
                            : TK.subtle,
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13.5, fontWeight: 700, color: TK.text }}
                  >
                    {u.n}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: TK.muted,
                      fontFamily: 'IBM Plex Mono, monospace',
                    }}
                  >
                    {u.r}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: TK.muted }}>
                  {u.tenants}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionHeader eyebrow="Tenants" title="Environments & regions" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                n: 'Talabix · Riyadh',
                e: 'prod',
                ver: 'v4.12.1',
                t: 'success',
              },
              {
                n: 'Talabix · Jeddah',
                e: 'prod',
                ver: 'v4.12.1',
                t: 'success',
              },
              {
                n: 'Talabix · Dammam',
                e: 'prod',
                ver: 'v4.12.0',
                t: 'success',
              },
              { n: 'Talabix · Mecca', e: 'prod', ver: 'v4.11.4', t: 'warn' },
              {
                n: 'Talabix Staging',
                e: 'staging',
                ver: 'v4.13.0-rc2',
                t: 'info',
              },
              {
                n: 'Talabix Sandbox',
                e: 'dev',
                ver: 'v4.13.0-dev',
                t: 'muted',
              },
            ].map((t) => (
              <div
                key={t.n}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: TK.recessed,
                }}
              >
                <I.branch c={TK.muted} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13.5, fontWeight: 700, color: TK.text }}
                  >
                    {t.n}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: TK.muted,
                      fontFamily: 'IBM Plex Mono, monospace',
                    }}
                  >
                    {t.ver}
                  </div>
                </div>
                <Pill label={t.e} tone={t.t} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ── Placeholder fallback ──────────────────────────────────────────────
function Placeholder({ label }) {
  return (
    <Panel style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🧩</div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: TK.text,
          marginBottom: 6,
        }}
      >
        {label}
      </h2>
      <p style={{ fontSize: 13, color: TK.muted }}>
        Screen scaffold ready — wire up your data to populate this view.
      </p>
    </Panel>
  );
}

Object.assign(window, {
  StoreDashboard,
  StoreLiveOrders,
  StoreCatalog,
  StoreBranches,
  AdminOverview,
  AdminDispatch,
  AdminMerchants,
  AdminFinance,
  SuperOverview,
  SuperRoles,
  Placeholder,
  SectionHeader,
});
