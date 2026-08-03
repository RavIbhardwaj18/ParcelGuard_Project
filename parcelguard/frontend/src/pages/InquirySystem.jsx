// frontend/src/pages/InquirySystem.jsx
import { useState } from 'react'

// ─── Tokens — dark legal/editorial: deep charcoal, muted violet accents ──────
const S = {
  bg: '#0b0b10', s1: '#0f0f16', s2: '#14141c', s3: '#1a1a24',
  bd: '#1e1e2e', bd2: '#262638',
  vio: '#7c5cff', vioDim: '#3a2c7a', vioBg: 'rgba(124,92,255,.07)',
  teal: '#26c6da', tealBg: 'rgba(38,198,218,.07)',
  red: '#ff5370', redBg: 'rgba(255,83,112,.07)',
  amber: '#ffb86c', amberBg: 'rgba(255,184,108,.07)',
  green: '#50fa7b', greenBg: 'rgba(80,250,123,.07)',
  slate: '#8be9fd', slateBg: 'rgba(139,233,253,.06)',
  tx: '#e2e2ef', tx2: '#9090b0', tx3: '#50505a',
  font: "'JetBrains Mono', monospace",
  title: "'Oswald', sans-serif",
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_INQUIRIES = [
  {
    id: 'iq1', case_number: 'PG-2024-000012', status: 'under_review', severity: 'critical',
    tracking: 'PGQ5P6T9', fraud_type: 'multi_signal', fraud_score: 91.0,
    customer_name: 'James Okafor', customer_email: 'james.o@email.com',
    seller: 'FakeWatch Palace', courier: 'Omar Hassan',
    origin_city: 'Lagos', destination_city: 'Bengaluru, IL',
    created_at: '2024-01-17T11:05:00', resolved_at: null, assigned_to: 'Sarah Chen',
    auto_created: true, compensation_issued: false,
    timeline: [
      { ts: '2024-01-17 11:05', actor: 'SYSTEM',    msg: 'Case auto-opened. AI fraud score: 91.0 — CRITICAL threshold exceeded.' },
      { ts: '2024-01-17 11:06', actor: 'SYSTEM',    msg: 'Multi-signal fraud detected: RFID mismatch + image anomaly (similarity 0.34).' },
      { ts: '2024-01-17 11:40', actor: 'Sarah Chen', msg: 'Case assigned. Reviewing courier checkpoint logs and packing photos.' },
      { ts: '2024-01-17 14:22', actor: 'Sarah Chen', msg: 'Contacted seller FakeWatch Palace — no response yet.' },
      { ts: '2024-01-18 09:15', actor: 'Sarah Chen', msg: 'Confirmed item substitution at Newark hub. Escalating to law enforcement.' },
    ],
  },
  {
    id: 'iq2', case_number: 'PG-2024-000009', status: 'open', severity: 'high',
    tracking: 'PGM2J7R5', fraud_type: 'courier_fraud', fraud_score: 84.2,
    customer_name: 'Nina Petrova', customer_email: 'n.petrova@mail.com',
    seller: 'PremiumGoods', courier: 'Dmitri Volkov',
    origin_city: 'Kolkata, FL', destination_city: 'Bengaluru, IL',
    created_at: '2024-01-17T14:32:00', resolved_at: null, assigned_to: null,
    auto_created: true, compensation_issued: false,
    timeline: [
      { ts: '2024-01-17 14:32', actor: 'SYSTEM',  msg: 'Case auto-opened. Fraud score: 84.2 — HIGH threshold exceeded.' },
      { ts: '2024-01-17 14:33', actor: 'SYSTEM',  msg: 'Courier fraud attributed. Weight delta: 0.48kg. Image similarity: 0.41.' },
    ],
  },
  {
    id: 'iq3', case_number: 'PG-2024-000006', status: 'resolved', severity: 'high',
    tracking: 'PGB2K8X1', fraud_type: 'rfid_mismatch', fraud_score: 78.5,
    customer_name: 'Carlos Vega', customer_email: 'cvega@outlook.com',
    seller: 'TechZone Store', courier: 'Rico Espinoza',
    origin_city: 'Mumbai, NY', destination_city: 'Delhi, CA',
    created_at: '2024-01-16T16:20:00', resolved_at: '2024-01-18T10:30:00', assigned_to: 'Mike Torres',
    auto_created: true, compensation_issued: true,
    timeline: [
      { ts: '2024-01-16 16:20', actor: 'SYSTEM',    msg: 'Case auto-opened. RFID mismatch at Delhi hub.' },
      { ts: '2024-01-16 17:05', actor: 'Mike Torres', msg: 'Assigned. Reviewing courier route logs.' },
      { ts: '2024-01-17 09:30', actor: 'Mike Torres', msg: 'Confirmed package swap at distribution hub. Rico Espinoza suspended.' },
      { ts: '2024-01-18 10:28', actor: 'Mike Torres', msg: 'Compensation of ₹340 issued to customer. Case resolved.' },
      { ts: '2024-01-18 10:30', actor: 'SYSTEM',    msg: 'Case status updated to RESOLVED. Courier trust score updated: −15 points.' },
    ],
  },
  {
    id: 'iq4', case_number: 'PG-2024-000014', status: 'open', severity: 'medium',
    tracking: 'PGY4N3W7', fraud_type: 'weight_fraud', fraud_score: 62.1,
    customer_name: 'Aisha Mohammed', customer_email: 'aisha.m@webmail.io',
    seller: 'BargainBox Ltd', courier: 'Lena Park',
    origin_city: 'Kolkata, FL', destination_city: 'Ahmedabad, TX',
    created_at: '2024-01-16T09:44:00', resolved_at: null, assigned_to: null,
    auto_created: false, compensation_issued: false,
    timeline: [
      { ts: '2024-01-16 09:44', actor: 'SYSTEM',   msg: 'Case manually opened by admin. Weight fraud suspected.' },
      { ts: '2024-01-16 10:02', actor: 'SYSTEM',   msg: 'Weight delta: 1.2kg — 57% of declared weight missing.' },
    ],
  },
  {
    id: 'iq5', case_number: 'PG-2024-000003', status: 'dismissed', severity: 'low',
    tracking: 'PGH6P1Q2', fraud_type: 'seller_fraud', fraud_score: 55.8,
    customer_name: 'Tom Bradley', customer_email: 'tombradley@gmail.com',
    seller: 'EverydayEssentials', courier: 'Sandra Okonkwo',
    origin_city: 'Pune, WA', destination_city: 'Portland, OR',
    created_at: '2024-01-15T18:12:00', resolved_at: '2024-01-16T14:00:00', assigned_to: 'Sarah Chen',
    auto_created: true, compensation_issued: false,
    timeline: [
      { ts: '2024-01-15 18:12', actor: 'SYSTEM',    msg: 'Case auto-opened. Score: 55.8 — MEDIUM threshold exceeded.' },
      { ts: '2024-01-15 19:30', actor: 'Sarah Chen', msg: 'Review started. Image difference attributed to lighting variance, not substitution.' },
      { ts: '2024-01-16 14:00', actor: 'Sarah Chen', msg: 'Dismissed — false positive. Image similarity low due to packaging reorientation.' },
    ],
  },
]

const SEVERITY_META = {
  critical: { color: '#ff5370', bg: 'rgba(255,83,112,.1)',   border: 'rgba(255,83,112,.3)',  label: 'CRITICAL' },
  high:     { color: '#ffb86c', bg: 'rgba(255,184,108,.1)',  border: 'rgba(255,184,108,.3)', label: 'HIGH' },
  medium:   { color: '#7c5cff', bg: 'rgba(124,92,255,.1)',   border: 'rgba(124,92,255,.3)',  label: 'MEDIUM' },
  low:      { color: '#50fa7b', bg: 'rgba(80,250,123,.08)',  border: 'rgba(80,250,123,.25)', label: 'LOW' },
}
const STATUS_META = {
  open:         { color: S.amber, bg: S.amberBg,  label: 'OPEN' },
  under_review: { color: S.slate, bg: S.slateBg,  label: 'REVIEWING' },
  escalated:    { color: S.red,   bg: S.redBg,    label: 'ESCALATED' },
  resolved:     { color: S.green, bg: S.greenBg,  label: 'RESOLVED' },
  dismissed:    { color: S.tx3,   bg: 'rgba(80,80,90,.1)', label: 'DISMISSED' },
}
const FRAUD_LABELS = {
  courier_fraud: 'Courier Fraud', seller_fraud: 'Seller Fraud',
  multi_signal: 'Multi-Signal',   rfid_mismatch: 'RFID Mismatch',
  weight_fraud: 'Weight Fraud',   dimension_fraud: 'Dim. Fraud',
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const h = Math.floor(diff / 36e5), day = Math.floor(diff / 864e5)
  return day > 0 ? `₹{day}d ago` : h > 0 ? `₹{h}h ago` : 'just now'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Pill badge ────────────────────────────────────────────────────────────────
function Pill({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-block', padding: '.14rem .5rem', borderRadius: 3,
      fontSize: '.53rem', letterSpacing: '.06em', fontFamily: S.font,
      background: bg, color: color,
    }}>{label}</span>
  )
}

// ─── Inquiry list row ──────────────────────────────────────────────────────────
function InquiryRow({ inq, selected, onClick }) {
  const sm = STATUS_META[inq.status] || STATUS_META.open
  const sv = SEVERITY_META[inq.severity] || SEVERITY_META.medium
  const isSelected = selected?.id === inq.id

  return (
    <div
      onClick={onClick}
      style={{
        padding: '.8rem 1rem', cursor: 'pointer',
        borderBottom: `1px solid ₹{S.bd}`,
        borderLeft: `3px solid ₹{isSelected ? sv.color : 'transparent'}`,
        background: isSelected ? `₹{sv.color}08` : 'transparent',
        transition: 'all .12s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.02)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.35rem' }}>
        <div style={{ fontFamily: S.font, fontSize: '.68rem', color: S.vio, fontWeight: 700, letterSpacing: '.04em' }}>
          {inq.case_number}
        </div>
        <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
          <Pill label={sv.label} color={sv.color} bg={sv.bg} />
          <Pill label={sm.label} color={sm.color} bg={sm.bg} />
        </div>
      </div>
      <div style={{ fontSize: '.7rem', color: S.tx, marginBottom: '.25rem' }}>
        {inq.tracking} · {FRAUD_LABELS[inq.fraud_type] || inq.fraud_type}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '.6rem', color: S.tx3 }}>
          {inq.customer_name} · {inq.destination_city}
        </div>
        <div style={{ fontSize: '.58rem', color: S.tx3 }}>{timeAgo(inq.created_at)}</div>
      </div>
      {inq.assigned_to && (
        <div style={{ fontSize: '.57rem', color: S.teal, marginTop: '.2rem' }}>
          👤 {inq.assigned_to}
        </div>
      )}
    </div>
  )
}

// ─── Timeline entry ────────────────────────────────────────────────────────────
function TimelineEntry({ entry, isLast }) {
  const isSystem = entry.actor === 'SYSTEM'
  return (
    <div style={{ display: 'flex', gap: '.75rem', paddingBottom: isLast ? 0 : '1rem', position: 'relative' }}>
      {/* vertical line */}
      {!isLast && (
        <div style={{
          position: 'absolute', left: 11, top: 24, bottom: 0,
          width: 1, background: S.bd2,
        }} />
      )}
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: isSystem ? S.bd2 : S.vioBg,
        border: `1px solid ₹{isSystem ? S.bd2 : S.vioDim}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '.62rem', zIndex: 1,
      }}>
        {isSystem ? '⚙' : '👤'}
      </div>
      <div style={{ flex: 1, paddingTop: '.15rem' }}>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'baseline', marginBottom: '.2rem' }}>
          <span style={{ fontSize: '.62rem', fontWeight: 700, color: isSystem ? S.tx3 : S.vio, fontFamily: S.font }}>
            {entry.actor}
          </span>
          <span style={{ fontSize: '.56rem', color: S.tx3 }}>{entry.ts}</span>
        </div>
        <div style={{ fontSize: '.7rem', color: S.tx2, lineHeight: 1.55 }}>{entry.msg}</div>
      </div>
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ inq, onUpdate }) {
  const [note, setNote] = useState('')
  const [statusEdit, setStatusEdit] = useState(inq.status)
  const [assignee, setAssignee] = useState(inq.assigned_to || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const sm = STATUS_META[inq.status] || STATUS_META.open
  const sv = SEVERITY_META[inq.severity] || SEVERITY_META.medium

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false); setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.2rem', borderBottom: `1px solid ₹{S.bd}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
          <div>
            <div style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.25rem', fontFamily: S.font }}>
              Investigation Case
            </div>
            <div style={{ fontFamily: S.title, fontSize: '1.2rem', color: S.tx, letterSpacing: '.04em' }}>
              {inq.case_number}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.35rem' }}>
            <Pill label={sv.label} color={sv.color} bg={sv.bg} />
            <Pill label={sm.label} color={sm.color} bg={sm.bg} />
          </div>
        </div>

        {inq.compensation_issued && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '.35rem',
            fontSize: '.58rem', color: S.green, background: S.greenBg,
            border: '1px solid rgba(80,250,123,.2)', borderRadius: 4,
            padding: '.2rem .6rem',
          }}>
            💰 Compensation issued
          </div>
        )}
        {inq.auto_created && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '.35rem',
            fontSize: '.58rem', color: S.slate, background: S.slateBg,
            border: `1px solid rgba(139,233,253,.2)`, borderRadius: 4,
            padding: '.2rem .6rem', marginLeft: '.4rem',
          }}>
            🤖 AI auto-opened
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.2rem' }}>

        {/* Parcel + parties info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '1.1rem' }}>
          {[
            ['Tracking', inq.tracking],
            ['Fraud Type', FRAUD_LABELS[inq.fraud_type] || inq.fraud_type],
            ['Fraud Score', inq.fraud_score.toFixed(1)],
            ['Customer', inq.customer_name],
            ['Seller', inq.seller],
            ['Courier', inq.courier],
            ['Origin', inq.origin_city],
            ['Destination', inq.destination_city],
          ].map(([l, v]) => (
            <div key={l} style={{ background: S.s2, borderRadius: 6, padding: '.5rem .7rem' }}>
              <div style={{ fontSize: '.52rem', color: S.tx3, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.15rem', fontFamily: S.font }}>{l}</div>
              <div style={{ fontSize: '.7rem', color: S.tx, fontFamily: S.font }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Update controls */}
        <div style={{
          background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 8,
          padding: '.85rem', marginBottom: '1.1rem',
        }}>
          <div style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.65rem', fontFamily: S.font }}>
            Update Case
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '.6rem' }}>
            <div>
              <label style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: '.28rem', fontFamily: S.font }}>Status</label>
              <select
                value={statusEdit}
                onChange={e => setStatusEdit(e.target.value)}
                style={{
                  width: '100%', background: S.s3, border: `1px solid ₹{S.bd2}`,
                  borderRadius: 5, padding: '.42rem .65rem', color: S.tx,
                  fontSize: '.68rem', fontFamily: S.font, outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: '.28rem', fontFamily: S.font }}>Assign To</label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                style={{
                  width: '100%', background: S.s3, border: `1px solid ₹{S.bd2}`,
                  borderRadius: 5, padding: '.42rem .65rem', color: S.tx,
                  fontSize: '.68rem', fontFamily: S.font, outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Unassigned</option>
                <option value="Sarah Chen">Sarah Chen</option>
                <option value="Mike Torres">Mike Torres</option>
                <option value="Priya Nair">Priya Nair</option>
                <option value="Alex Kim">Alex Kim</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '.55rem' }}>
            <label style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: '.28rem', fontFamily: S.font }}>Add Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add an investigation note…"
              rows={3}
              style={{
                width: '100%', background: S.s3, border: `1px solid ₹{S.bd2}`,
                borderRadius: 5, padding: '.45rem .65rem', color: S.tx,
                fontSize: '.68rem', fontFamily: S.font, outline: 'none',
                resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saved ? S.greenBg : S.vioBg,
              border: `1px solid ₹{saved ? 'rgba(80,250,123,.3)' : S.vioDim}`,
              color: saved ? S.green : S.vio,
              padding: '.42rem .9rem', borderRadius: 5, fontSize: '.62rem',
              fontFamily: S.font, cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all .2s', letterSpacing: '.05em',
              display: 'flex', alignItems: 'center', gap: '.4rem',
            }}
          >
            {saving
              ? <><span style={{ width: 10, height: 10, border: '1.5px solid rgba(124,92,255,.4)', borderTopColor: S.vio, borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />Saving…</>
              : saved ? '✓ Saved' : 'Save Update'}
          </button>
        </div>

        {/* Timeline */}
        <div>
          <div style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.75rem', fontFamily: S.font }}>
            Case Timeline
          </div>
          {[...inq.timeline].reverse().map((entry, i, arr) => (
            <TimelineEntry key={i} entry={entry} isLast={i === arr.length - 1} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function InquirySystem() {
  const [selected, setSelected] = useState(MOCK_INQUIRIES[0])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = MOCK_INQUIRIES.filter(inq => {
    if (filterStatus !== 'all' && inq.status !== filterStatus) return false
    if (filterSeverity !== 'all' && inq.severity !== filterSeverity) return false
    if (search && !inq.case_number.toLowerCase().includes(search.toLowerCase()) &&
        !inq.tracking.toLowerCase().includes(search.toLowerCase()) &&
        !inq.customer_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    open: MOCK_INQUIRIES.filter(i => i.status === 'open').length,
    under_review: MOCK_INQUIRIES.filter(i => i.status === 'under_review').length,
    resolved: MOCK_INQUIRIES.filter(i => i.status === 'resolved').length,
    dismissed: MOCK_INQUIRIES.filter(i => i.status === 'dismissed').length,
  }

  return (
    <div style={{ height: '100vh', background: S.bg, color: S.tx, fontFamily: S.font, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Oswald:wght@500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:₹{S.bd2};border-radius:2px;}
        select option{background:₹{S.s1};} textarea::placeholder{color:₹{S.tx3};}
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        padding: '1rem 2rem', borderBottom: `1px solid ₹{S.bd}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: S.s1, flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontFamily: S.title, fontSize: '1.6rem', color: S.tx, margin: 0, letterSpacing: '.06em' }}>
            🔍 INQUIRY SYSTEM
          </h1>
          <p style={{ fontSize: '.56rem', color: S.tx3, margin: '.1rem 0 0', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Case Management · Investigation Tracking · Resolution
          </p>
        </div>

        {/* Status counters */}
        <div style={{ display: 'flex', gap: '.8rem' }}>
          {[
            ['OPEN', counts.open, S.amber],
            ['REVIEWING', counts.under_review, S.slate],
            ['RESOLVED', counts.resolved, S.green],
            ['DISMISSED', counts.dismissed, S.tx3],
          ].map(([label, count, color]) => (
            <div key={label} style={{
              textAlign: 'center', padding: '.4rem .8rem',
              background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 7,
              minWidth: 68,
            }}>
              <div style={{ fontFamily: S.title, fontSize: '1.2rem', color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: '.5rem', color: S.tx3, letterSpacing: '.08em', marginTop: '.1rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Three-column body ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 0 }}>

        {/* ── Left: list ── */}
        <div style={{ borderRight: `1px solid ₹{S.bd}`, display: 'flex', flexDirection: 'column', background: S.s1 }}>
          {/* Filter bar */}
          <div style={{ padding: '.7rem .8rem', borderBottom: `1px solid ₹{S.bd}`, display: 'flex', flexDirection: 'column', gap: '.5rem', flexShrink: 0 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search case / tracking / name…"
              style={{
                background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 5,
                padding: '.4rem .65rem', color: S.tx, fontSize: '.65rem',
                fontFamily: S.font, outline: 'none', width: '100%',
              }}
            />
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ flex: 1, background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 5, padding: '.35rem .5rem', color: S.tx2, fontSize: '.6rem', fontFamily: S.font, outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="under_review">Reviewing</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                style={{ flex: 1, background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 5, padding: '.35rem .5rem', color: S.tx2, fontSize: '.6rem', fontFamily: S.font, outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Case list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ textAlign: 'center', padding: '2rem', color: S.tx3, fontSize: '.65rem' }}>No cases match filter</div>
              : filtered.map(inq => (
                  <InquiryRow
                    key={inq.id}
                    inq={inq}
                    selected={selected}
                    onClick={() => setSelected(inq)}
                  />
                ))}
          </div>
        </div>

        {/* ── Right: detail ── */}
        <div style={{ overflowY: 'auto' }}>
          {selected
            ? <DetailPanel key={selected.id} inq={selected} onUpdate={() => {}} />
            : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: S.tx3 }}>
                <div style={{ fontSize: '3rem', opacity: .3 }}>🔍</div>
                <div style={{ fontFamily: S.title, fontSize: '1rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  Select a case to investigate
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}