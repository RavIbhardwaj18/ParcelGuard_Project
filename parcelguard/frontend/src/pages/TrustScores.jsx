// frontend/src/pages/TrustScores.jsx
import { useState } from 'react'

// ─── Tokens — deep teal data dashboard, precise and authoritative ─────────────
const S = {
  bg: '#080c0f', s1: '#0c1014', s2: '#111720', s3: '#172030',
  bd: '#162030', bd2: '#1e2e40',
  teal: '#00c9b1', tealDim: '#004f46', tealBg: 'rgba(0,201,177,.07)',
  cyan: '#38bdf8', cyanBg: 'rgba(56,189,248,.07)',
  red: '#fb7185', redBg: 'rgba(251,113,133,.08)',
  amber: '#fbbf24', amberBg: 'rgba(251,191,36,.07)',
  green: '#34d399', greenBg: 'rgba(52,211,153,.07)',
  tx: '#d8e8f0', tx2: '#7a9ab0', tx3: '#3a5060',
  font: "'Recursive', monospace",
  title: "'Bebas Neue', sans-serif",
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_SELLERS = [
  { id:'s1', name:'TechZone Store',       trust_score:91.5, fraud_count:0, total_parcels:120, is_flagged:false, is_suspended:false, delta:+1.5, trend:[88,89,89.5,90,90.5,91,91.5] },
  { id:'s4', name:'PremiumGoods',         trust_score:88.0, fraud_count:1, total_parcels:95,  is_flagged:false, is_suspended:false, delta:-0.5, trend:[89,89,88.5,88,88.5,88,88.0] },
  { id:'s6', name:'EverydayEssentials',   trust_score:85.5, fraud_count:1, total_parcels:210, is_flagged:false, is_suspended:false, delta:+0.0, trend:[85,85,85.5,85.5,85,85.5,85.5] },
  { id:'s2', name:'QuickShip Co',         trust_score:65.0, fraud_count:2, total_parcels:80,  is_flagged:true,  is_suspended:false, delta:-8.0, trend:[78,76,74,72,70,67,65.0] },
  { id:'s7', name:'MidnightGoods',        trust_score:38.0, fraud_count:3, total_parcels:44,  is_flagged:true,  is_suspended:false, delta:-15.0,trend:[55,52,50,46,44,40,38.0] },
  { id:'s3', name:'BargainBox Ltd',       trust_score:42.5, fraud_count:4, total_parcels:67,  is_flagged:true,  is_suspended:false, delta:-12.0,trend:[58,56,52,50,46,44,42.5] },
  { id:'s9', name:'OffBrand Direct',      trust_score:29.5, fraud_count:5, total_parcels:38,  is_flagged:true,  is_suspended:true,  delta:-20.0,trend:[55,50,45,40,35,31,29.5] },
  { id:'s5', name:'FakeWatch Palace',     trust_score:15.0, fraud_count:9, total_parcels:22,  is_flagged:true,  is_suspended:true,  delta:-30.0,trend:[60,50,38,30,22,18,15.0] },
]

const MOCK_COURIERS = [
  { id:'c1', name:'Marcus Webb',    employee_id:'EMP-0042', trust_score:95.5, fraud_count:0, total_parcels:340, is_flagged:false, delta:+1.5, trend:[93,94,94.5,95,95,95.5,95.5] },
  { id:'c4', name:'Lena Park',      employee_id:'EMP-0095', trust_score:91.0, fraud_count:0, total_parcels:280, is_flagged:false, delta:+0.5, trend:[90,90,90.5,91,91,91,91.0] },
  { id:'c2', name:'Sandra Okonkwo', employee_id:'EMP-0078', trust_score:87.0, fraud_count:1, total_parcels:195, is_flagged:false, delta:-1.0, trend:[89,88.5,88,88,87.5,87,87.0] },
  { id:'c8', name:'Tanya Blume',    employee_id:'EMP-0072', trust_score:51.5, fraud_count:1, total_parcels:88,  is_flagged:false, delta:-5.0, trend:[58,57,55,54,53,52,51.5] },
  { id:'c3', name:'Dmitri Volkov',  employee_id:'EMP-0031', trust_score:61.5, fraud_count:2, total_parcels:112, is_flagged:true,  delta:-13.0,trend:[78,75,72,68,65,63,61.5] },
  { id:'c7', name:'Rico Espinoza',  employee_id:'EMP-0055', trust_score:44.0, fraud_count:3, total_parcels:76,  is_flagged:true,  delta:-18.0,trend:[68,64,60,56,52,47,44.0] },
  { id:'c5', name:'Omar Hassan',    employee_id:'EMP-0018', trust_score:29.0, fraud_count:4, total_parcels:54,  is_flagged:true,  delta:-22.0,trend:[62,55,48,40,35,31,29.0] },
]

const HISTORY_BY_ID = {
  s1: [
    { ts:'2024-01-17', delta:+1.5, reason:'Clean delivery streak (+1.5)', score_after:91.5, type:'reward' },
    { ts:'2024-01-12', delta:+1.5, reason:'Clean delivery streak (+1.5)', score_after:90.0, type:'reward' },
    { ts:'2024-01-07', delta:+1.5, reason:'Clean delivery streak (+1.5)', score_after:88.5, type:'reward' },
  ],
  s5: [
    { ts:'2024-01-17', delta:-15.0, reason:'HIGH fraud confirmed — courier fraud',        score_after:15.0,  type:'penalty' },
    { ts:'2024-01-14', delta:-15.0, reason:'HIGH fraud confirmed — multi-signal',         score_after:30.0,  type:'penalty' },
    { ts:'2024-01-11', delta:-5.0,  reason:'MEDIUM fraud detected — weight discrepancy',  score_after:45.0,  type:'penalty' },
    { ts:'2024-01-09', delta:-5.0,  reason:'MEDIUM fraud detected — dimension mismatch',  score_after:50.0,  type:'penalty' },
    { ts:'2024-01-05', delta:-5.0,  reason:'MEDIUM fraud detected — image anomaly',       score_after:55.0,  type:'penalty' },
    { ts:'2024-01-02', delta:-5.0,  reason:'MEDIUM fraud detected — RFID mismatch',       score_after:60.0,  type:'penalty' },
  ],
  c1: [
    { ts:'2024-01-17', delta:+1.5, reason:'Clean delivery streak', score_after:95.5, type:'reward' },
    { ts:'2024-01-12', delta:+1.5, reason:'Clean delivery streak', score_after:94.0, type:'reward' },
    { ts:'2024-01-07', delta:+1.5, reason:'Clean delivery streak', score_after:92.5, type:'reward' },
  ],
  c5: [
    { ts:'2024-01-17', delta:-15.0, reason:'HIGH fraud confirmed — RFID mismatch',        score_after:29.0,  type:'penalty' },
    { ts:'2024-01-14', delta:-5.0,  reason:'MEDIUM fraud — weight discrepancy',            score_after:44.0,  type:'penalty' },
    { ts:'2024-01-11', delta:-5.0,  reason:'MEDIUM fraud — image similarity 0.38',         score_after:49.0,  type:'penalty' },
    { ts:'2024-01-09', delta:-15.0, reason:'HIGH fraud confirmed — courier substitution',  score_after:54.0,  type:'penalty' },
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = s => s >= 70 ? S.green : s >= 40 ? S.amber : S.red
const scoreRing  = s => s >= 70 ? S.teal  : s >= 40 ? S.amber : S.red

// ─── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, color, width = 80, height = 28 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `₹{x},₹{y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r={2.5} fill={color}
      />
    </svg>
  )
}

// ─── Radial score ring ─────────────────────────────────────────────────────────
function ScoreRing({ score, size = 72 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = scoreRing(score)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={S.bd2} strokeWidth={6} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`₹{filled} ₹{circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Actor card ────────────────────────────────────────────────────────────────
function ActorCard({ actor, rank, type, selected, onClick }) {
  const sc = scoreColor(actor.trust_score)
  const isSelected = selected?.id === actor.id
  const deltaColor = actor.delta > 0 ? S.green : actor.delta < 0 ? S.red : S.tx3

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 80px 60px',
        gap: '.5rem', alignItems: 'center',
        padding: '.65rem .9rem', cursor: 'pointer',
        borderLeft: `3px solid ₹{isSelected ? sc : 'transparent'}`,
        background: isSelected ? `₹{sc}0d` : 'transparent',
        borderBottom: `1px solid ₹{S.bd}`,
        transition: 'all .12s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.02)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ fontFamily: S.title, fontSize: '1rem', color: rank <= 3 ? S.teal : S.tx3, textAlign: 'center' }}>
        {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
      </div>
      <div>
        <div style={{ fontSize: '.7rem', fontWeight: 600, color: S.tx, marginBottom: '.1rem' }}>{actor.name}</div>
        <div style={{ fontSize: '.58rem', color: S.tx3 }}>
          {type === 'courier' ? actor.employee_id + ' · ' : ''}{actor.total_parcels} parcels
        </div>
        <div style={{ display: 'flex', gap: '.35rem', marginTop: '.15rem' }}>
          {actor.is_flagged && <span style={{ fontSize: '.5rem', color: S.amber }}>⚠ FLAGGED</span>}
          {actor.is_suspended && <span style={{ fontSize: '.5rem', color: S.red }}>🚫 SUSPENDED</span>}
          {actor.fraud_count > 0 && <span style={{ fontSize: '.5rem', color: S.tx3 }}>{actor.fraud_count} fraud events</span>}
        </div>
      </div>
      <Sparkline data={actor.trend} color={sc} />
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: S.title, fontSize: '1.3rem', color: sc, lineHeight: 1 }}>{actor.trust_score}</div>
        <div style={{ fontSize: '.55rem', color: deltaColor, marginTop: '.1rem' }}>
          {actor.delta > 0 ? '▲' : actor.delta < 0 ? '▼' : '—'}
          {Math.abs(actor.delta) > 0 ? Math.abs(actor.delta) : ''}
        </div>
      </div>
    </div>
  )
}

// ─── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ actor, type }) {
  const sc = scoreColor(actor.trust_score)
  const history = HISTORY_BY_ID[actor.id] || []
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionDone, setActionDone] = useState(null)

  function handleAction(action) {
    setConfirmAction(action)
  }
  function confirmDo() {
    setActionDone(confirmAction)
    setConfirmAction(null)
    setTimeout(() => setActionDone(null), 3000)
  }

  return (
    <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>

      {/* Actor header */}
      <div style={{
        display: 'flex', gap: '1.2rem', alignItems: 'flex-start',
        marginBottom: '1.5rem', paddingBottom: '1.3rem', borderBottom: `1px solid ₹{S.bd}`,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreRing score={actor.trust_score} size={76} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: S.title, fontSize: '1.3rem', color: sc, lineHeight: 1 }}>
              {actor.trust_score}
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '.58rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.25rem', fontFamily: S.font }}>
            {type === 'seller' ? 'Seller' : 'Courier Agent'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: S.tx, marginBottom: '.3rem' }}>{actor.name}</div>
          {type === 'courier' && <div style={{ fontSize: '.65rem', color: S.tx2 }}>{actor.employee_id}</div>}
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
            {actor.is_flagged && (
              <span style={{ fontSize: '.58rem', color: S.amber, background: S.amberBg, border: '1px solid rgba(251,191,36,.2)', borderRadius: 4, padding: '.15rem .5rem' }}>
                ⚠ FLAGGED
              </span>
            )}
            {actor.is_suspended && (
              <span style={{ fontSize: '.58rem', color: S.red, background: S.redBg, border: '1px solid rgba(251,113,133,.2)', borderRadius: 4, padding: '.15rem .5rem' }}>
                🚫 SUSPENDED
              </span>
            )}
            {!actor.is_flagged && !actor.is_suspended && (
              <span style={{ fontSize: '.58rem', color: S.green, background: S.greenBg, border: '1px solid rgba(52,211,153,.2)', borderRadius: 4, padding: '.15rem .5rem' }}>
                ✓ GOOD STANDING
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.7rem', marginBottom: '1.3rem' }}>
        {[
          ['Trust Score', actor.trust_score, sc],
          ['Fraud Events', actor.fraud_count, actor.fraud_count > 0 ? S.red : S.green],
          ['Total Parcels', actor.total_parcels, S.cyan],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 8, padding: '.7rem' }}>
            <div style={{ fontFamily: S.title, fontSize: '1.5rem', color, lineHeight: 1, marginBottom: '.2rem' }}>{value}</div>
            <div style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Mini trend chart */}
      <div style={{ background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 8, padding: '.9rem', marginBottom: '1.3rem' }}>
        <div style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.7rem', fontFamily: S.font }}>
          Trust Score Trend (7 periods)
        </div>
        <div style={{ display: 'flex', gap: '0', height: 48, alignItems: 'flex-end', marginBottom: '.5rem' }}>
          {actor.trend.map((v, i) => {
            const isLast = i === actor.trend.length - 1
            const h = Math.max(8, ((v - Math.min(...actor.trend)) / (Math.max(...actor.trend) - Math.min(...actor.trend) || 1)) * 40 + 8)
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{
                  width: '70%', height: h,
                  background: isLast ? sc : `₹{sc}40`,
                  borderRadius: '2px 2px 0 0',
                  transition: 'height .5s ease',
                }} />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.52rem', color: S.tx3 }}>
          {['6w','5w','4w','3w','2w','1w','Now'].map(l => <span key={l}>{l}</span>)}
        </div>
      </div>

      {/* Admin controls */}
      <div style={{ background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 8, padding: '.9rem', marginBottom: '1.3rem' }}>
        <div style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.7rem', fontFamily: S.font }}>
          Admin Controls
        </div>

        {actionDone && (
          <div style={{
            marginBottom: '.7rem', padding: '.5rem .8rem', background: S.tealBg,
            border: '1px solid rgba(0,201,177,.2)', borderRadius: 6,
            fontSize: '.65rem', color: S.teal,
          }}>
            ✓ {actionDone === 'flag' ? (actor.is_flagged ? 'Flag removed' : 'Actor flagged') :
               actionDone === 'suspend' ? (actor.is_suspended ? 'Reinstated' : 'Suspended') :
               'Trust score reset'}
          </div>
        )}

        {confirmAction && (
          <div style={{
            marginBottom: '.7rem', padding: '.6rem .8rem',
            background: S.redBg, border: '1px solid rgba(251,113,133,.2)',
            borderRadius: 6, fontSize: '.65rem', color: S.tx2,
          }}>
            <div style={{ marginBottom: '.5rem' }}>
              Confirm: <strong style={{ color: S.tx }}>
                {confirmAction === 'flag' ? (actor.is_flagged ? 'remove flag' : 'flag this actor') :
                 confirmAction === 'suspend' ? (actor.is_suspended ? 'reinstate' : 'suspend') :
                 'reset trust score to 50.0'}
              </strong>?
            </div>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <button onClick={confirmDo} style={{ background: S.redBg, border: '1px solid rgba(251,113,133,.3)', color: S.red, padding: '.3rem .7rem', borderRadius: 5, fontSize: '.6rem', cursor: 'pointer', fontFamily: S.font }}>Confirm</button>
              <button onClick={() => setConfirmAction(null)} style={{ background: 'transparent', border: `1px solid ₹{S.bd2}`, color: S.tx3, padding: '.3rem .7rem', borderRadius: 5, fontSize: '.6rem', cursor: 'pointer', fontFamily: S.font }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          <button onClick={() => handleAction('flag')} style={{
            padding: '.4rem .9rem', borderRadius: 6, fontSize: '.62rem',
            fontFamily: S.font, cursor: 'pointer', letterSpacing: '.04em',
            background: actor.is_flagged ? S.amberBg : 'transparent',
            border: `1px solid ₹{actor.is_flagged ? 'rgba(251,191,36,.3)' : S.bd2}`,
            color: actor.is_flagged ? S.amber : S.tx2, transition: 'all .15s',
          }}>
            {actor.is_flagged ? '⚠ Remove Flag' : '⚠ Flag Actor'}
          </button>
          {type === 'courier' && (
            <button onClick={() => handleAction('suspend')} style={{
              padding: '.4rem .9rem', borderRadius: 6, fontSize: '.62rem',
              fontFamily: S.font, cursor: 'pointer', letterSpacing: '.04em',
              background: actor.is_suspended ? S.redBg : 'transparent',
              border: `1px solid ₹{actor.is_suspended ? 'rgba(251,113,133,.3)' : S.bd2}`,
              color: actor.is_suspended ? S.red : S.tx2, transition: 'all .15s',
            }}>
              {actor.is_suspended ? '🚫 Reinstate' : '🚫 Suspend'}
            </button>
          )}
          <button onClick={() => handleAction('reset')} style={{
            padding: '.4rem .9rem', borderRadius: 6, fontSize: '.62rem',
            fontFamily: S.font, cursor: 'pointer', letterSpacing: '.04em',
            background: 'transparent', border: `1px solid ₹{S.bd2}`,
            color: S.tx3, transition: 'all .15s',
          }}>
            ↺ Reset Score
          </button>
        </div>
      </div>

      {/* Trust event history */}
      <div>
        <div style={{ fontSize: '.55rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.75rem', fontFamily: S.font }}>
          Trust Event History
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: S.tx3, fontSize: '.65rem' }}>
            No trust events recorded
          </div>
        ) : history.map((ev, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '.8rem',
            padding: '.55rem 0', borderBottom: i < history.length - 1 ? `1px solid ₹{S.bd}` : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: ev.type === 'reward' ? S.greenBg : S.redBg,
              fontSize: '.8rem',
            }}>
              {ev.type === 'reward' ? '▲' : '▼'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.68rem', color: S.tx, lineHeight: 1.4 }}>{ev.reason}</div>
              <div style={{ fontSize: '.58rem', color: S.tx3, marginTop: '.1rem' }}>{ev.ts}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: ev.type === 'reward' ? S.green : S.red }}>
                {ev.delta > 0 ? '+' : ''}{ev.delta}
              </div>
              <div style={{ fontSize: '.55rem', color: S.tx3 }}>→ {ev.score_after}</div>
            </div>
          </div>
        ))}
        {history.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '.7rem', fontSize: '.6rem', color: S.tx3 }}>
            Showing latest {history.length} events
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function TrustScores() {
  const [tab, setTab] = useState('sellers')
  const [selected, setSelected] = useState(MOCK_SELLERS[0])
  const [sortBy, setSortBy] = useState('score')
  const [filter, setFilter] = useState('all')

  const list = tab === 'sellers' ? MOCK_SELLERS : MOCK_COURIERS

  const sorted = [...list].filter(a => {
    if (filter === 'flagged') return a.is_flagged
    if (filter === 'suspended') return a.is_suspended
    if (filter === 'clean') return !a.is_flagged && !a.is_suspended
    if (filter === 'high') return a.trust_score >= 70
    if (filter === 'risk') return a.trust_score < 40
    return true
  }).sort((a, b) => {
    if (sortBy === 'score') return b.trust_score - a.trust_score
    if (sortBy === 'fraud') return b.fraud_count - a.fraud_count
    if (sortBy === 'parcels') return b.total_parcels - a.total_parcels
    return 0
  })

  const avgScore = (list.reduce((s, a) => s + a.trust_score, 0) / list.length).toFixed(1)
  const flaggedCount = list.filter(a => a.is_flagged).length
  const suspendedCount = list.filter(a => a.is_suspended).length

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: S.bg, color: S.tx, fontFamily: S.font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Recursive:wght@400;500;700&family=Bebas+Neue&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:₹{S.bd2};border-radius:2px;}
        select option{background:₹{S.s1};}
      `}</style>

      {/* Header */}
      <div style={{ padding: '1rem 2rem', borderBottom: `1px solid ₹{S.bd}`, background: S.s1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: S.title, fontSize: '1.8rem', color: S.tx, margin: 0, letterSpacing: '.06em' }}>⭐ TRUST SCORE SYSTEM</h1>
          <p style={{ fontSize: '.56rem', color: S.tx3, margin: '.1rem 0 0', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Actor Reputation · Leaderboard · Event History
          </p>
        </div>
        {/* Summary chips */}
        <div style={{ display: 'flex', gap: '.7rem' }}>
          {[
            ['AVG SCORE', avgScore, S.teal],
            ['FLAGGED', flaggedCount, S.amber],
            ['SUSPENDED', suspendedCount, S.red],
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: '.4rem .85rem', background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 7, minWidth: 72 }}>
              <div style={{ fontFamily: S.title, fontSize: '1.2rem', color: c, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: '.49rem', color: S.tx3, letterSpacing: '.08em', marginTop: '.08rem' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body: two-panel */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', minHeight: 0 }}>

        {/* Left: leaderboard */}
        <div style={{ borderRight: `1px solid ₹{S.bd}`, display: 'flex', flexDirection: 'column' }}>

          {/* Tab + filters */}
          <div style={{ padding: '.7rem .9rem', borderBottom: `1px solid ₹{S.bd}`, display: 'flex', flexDirection: 'column', gap: '.5rem', background: S.s1, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              {[['sellers', '🏪 Sellers'], ['couriers', '🚚 Couriers']].map(([key, lbl]) => (
                <button key={key} onClick={() => { setTab(key); setSelected(key === 'sellers' ? MOCK_SELLERS[0] : MOCK_COURIERS[0]) }}
                  style={{
                    flex: 1, padding: '.35rem', borderRadius: 5, fontSize: '.6rem',
                    fontFamily: S.font, cursor: 'pointer', transition: 'all .12s',
                    background: tab === key ? S.tealBg : 'transparent',
                    border: tab === key ? `1px solid rgba(0,201,177,.3)` : `1px solid ₹{S.bd}`,
                    color: tab === key ? S.teal : S.tx3,
                  }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ flex: 1, background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 5, padding: '.3rem .5rem', color: S.tx2, fontSize: '.58rem', fontFamily: S.font, outline: 'none', cursor: 'pointer' }}>
                <option value="score">Sort: Score ↓</option>
                <option value="fraud">Sort: Fraud Count ↓</option>
                <option value="parcels">Sort: Parcels ↓</option>
              </select>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ flex: 1, background: S.s2, border: `1px solid ₹{S.bd2}`, borderRadius: 5, padding: '.3rem .5rem', color: S.tx2, fontSize: '.58rem', fontFamily: S.font, outline: 'none', cursor: 'pointer' }}>
                <option value="all">All</option>
                <option value="clean">Clean</option>
                <option value="flagged">Flagged</option>
                <option value="suspended">Suspended</option>
                <option value="high">High Trust (≥70)</option>
                <option value="risk">At Risk (&lt;40)</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sorted.map((actor, i) => (
              <ActorCard
                key={actor.id}
                actor={actor}
                rank={i + 1}
                type={tab === 'sellers' ? 'seller' : 'courier'}
                selected={selected}
                onClick={() => setSelected(actor)}
              />
            ))}
          </div>
        </div>

        {/* Right: detail */}
        <div style={{ overflowY: 'auto' }}>
          {selected
            ? <DetailPanel key={selected.id} actor={selected} type={tab === 'sellers' ? 'seller' : 'courier'} />
            : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: S.tx3 }}>
                <div style={{ fontSize: '3rem', opacity: .25 }}>⭐</div>
                <div style={{ fontFamily: S.title, fontSize: '1rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Select an actor</div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}