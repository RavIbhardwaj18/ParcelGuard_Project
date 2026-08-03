// customer-portal/src/pages/ClaimStatus.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const C = {
  cream: '#faf8f4', parchment: '#f2ede3', sand: '#e8dfc8',
  gold: '#c6914a', goldLight: '#e8b870', goldDark: '#7a5c1e',
  ink: '#1a1612', inkLight: '#4a3f32', inkFade: '#8a7a68',
  ok: '#2d7a4e', warn: '#b07a1a', danger: '#9b2a2a',
  serif: "'Fraunces', serif", sans: "'DM Sans', sans-serif",
}

// Mock claim data by ID
const MOCK_CLAIMS = {
  'CLM-DEMO1': {
    case_number: 'PG-2024-000012',
    status: 'under_review',
    severity: 'high',
    created_at: '2024-01-15T10:32:00',
    resolved_at: null,
    compensation_issued: false,
    timeline: [
      { date: '2024-01-15 10:32', message: 'Your fraud investigation case was opened.' },
      { date: '2024-01-15 10:33', message: 'AI analysis detected high-risk anomalies in your parcel.' },
      { date: '2024-01-15 11:05', message: 'An investigator has been assigned to your case.' },
      { date: '2024-01-16 09:20', message: 'Evidence gathering in progress — reviewing checkpoint photos.' },
      { date: '2024-01-17 14:45', message: 'Your case is currently under active review.' },
    ],
    status_message: 'Your case is currently under active review by our fraud investigation team.',
  },
}

const STATUS_STEPS = [
  { key: 'open',              label: 'Case Opened',        icon: '📋' },
  { key: 'assigned',          label: 'Investigator Assigned', icon: '👤' },
  { key: 'under_review',      label: 'Under Review',       icon: '🔍' },
  { key: 'resolved_fraud',    label: 'Resolved',           icon: '⚖️' },
]

const STATUS_ORDER = ['open', 'assigned', 'evidence_gathering', 'under_review', 'escalated', 'resolved_fraud', 'resolved_cleared', 'closed']

function StatusTimeline({ currentStatus }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === currentStatus)
  const activeIdx = currentIdx === -1 ? 1 : currentIdx

  return (
    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: '.65rem', top: '.8rem',
        width: 2, height: `calc(100% - 1.6rem)`,
        background: `linear-gradient(to bottom, ${C.gold}, ${C.sand})`,
        borderRadius: 1,
      }} />

      {STATUS_STEPS.map((s, i) => {
        const done = i < activeIdx
        const active = i === activeIdx
        return (
          <div key={s.key} style={{
            display: 'flex', alignItems: 'flex-start', gap: '.9rem',
            marginBottom: i < STATUS_STEPS.length - 1 ? '1.4rem' : 0,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? C.gold : active ? C.ink : C.sand,
              border: active ? `2px solid ${C.gold}` : '2px solid transparent',
              boxShadow: active ? `0 0 0 4px ${C.goldLight}40` : 'none',
              marginLeft: '-2rem', zIndex: 1, position: 'relative',
              fontSize: done ? '.75rem' : '.8rem',
              transition: 'all .3s',
            }}>
              {done ? '✓' : <span style={{ color: active ? '#fff' : C.inkFade }}>{s.icon}</span>}
            </div>
            <div style={{ paddingTop: '.2rem' }}>
              <div style={{
                fontSize: '.82rem', fontWeight: active ? 600 : 400,
                color: active ? C.ink : done ? C.inkLight : C.inkFade,
              }}>
                {s.label}
              </div>
              {active && (
                <div style={{ fontSize: '.72rem', color: C.gold, marginTop: '.15rem', fontStyle: 'italic' }}>
                  Current status
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ClaimStatus() {
  const { claimId } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      const found = MOCK_CLAIMS[claimId] || MOCK_CLAIMS['CLM-DEMO1']
      if (found) { setClaim(found) }
      else { setNotFound(true) }
      setLoading(false)
    }, 800)
  }, [claimId])

  const severityColors = {
    high: { bg: '#fff3f3', text: C.danger, border: `${C.danger}25` },
    medium: { bg: '#fffbf0', text: C.warn, border: `${C.warn}30` },
    low: { bg: '#f3fff6', text: C.ok, border: `${C.ok}25` },
  }
  const sc = claim ? (severityColors[claim.severity] || severityColors.medium) : {}

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: C.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,300&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(250,248,244,.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.sand}`,
        padding: '.9rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontSize: '1.3rem' }}>📦</span>
          <span style={{ fontFamily: C.serif, fontSize: '1.05rem', fontWeight: 600, color: C.ink }}>
            Parcel<span style={{ color: C.gold }}>Guard</span>
          </span>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: `1px solid ${C.sand}`, borderRadius: 7, padding: '.4rem .9rem', fontSize: '.75rem', color: C.inkFade, cursor: 'pointer', fontFamily: C.sans }}>
          ← Track Another
        </button>
      </nav>

      <div style={{ maxWidth: 680, margin: '3rem auto 4rem', padding: '0 1.5rem' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '5rem', color: C.inkFade }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${C.sand}`, borderTopColor: C.gold, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '.85rem' }}>Loading your case…</div>
          </div>
        )}

        {notFound && (
          <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: 16, border: `1px solid ${C.sand}` }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <div style={{ fontFamily: C.serif, fontSize: '1.4rem', color: C.ink, marginBottom: '.5rem' }}>Case Not Found</div>
            <div style={{ fontSize: '.85rem', color: C.inkFade, marginBottom: '1.5rem' }}>We couldn't find a case with the ID <strong>{claimId}</strong>.</div>
            <button onClick={() => navigate('/')} style={{ background: C.gold, color: '#fff', border: 'none', borderRadius: 8, padding: '.7rem 1.5rem', fontSize: '.82rem', cursor: 'pointer', fontFamily: C.sans, fontWeight: 600 }}>
              Back to Tracking
            </button>
          </div>
        )}

        {claim && !loading && (
          <div style={{ animation: 'fadeUp .35s ease' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: C.gold, marginBottom: '.4rem', fontFamily: C.sans }}>
                Investigation Case
              </div>
              <h1 style={{ fontFamily: C.serif, fontSize: '2rem', fontWeight: 600, color: C.ink, letterSpacing: '-.02em' }}>
                {claim.case_number}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginTop: '.5rem' }}>
                <span style={{
                  padding: '.3rem .8rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 600,
                  background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                }}>
                  {claim.severity?.toUpperCase()} SEVERITY
                </span>
                <span style={{ fontSize: '.72rem', color: C.inkFade }}>
                  Opened {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>

              {/* Main column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                {/* Status message */}
                <div style={{
                  background: '#fff', border: `1.5px solid ${C.sand}`,
                  borderRadius: 12, padding: '1.3rem 1.5rem',
                }}>
                  <div style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFade, marginBottom: '.5rem', fontFamily: C.sans }}>
                    Current Status
                  </div>
                  <div style={{ fontFamily: C.serif, fontSize: '1.05rem', color: C.ink, lineHeight: 1.5 }}>
                    {claim.status_message}
                  </div>
                </div>

                {/* Timeline */}
                <div style={{
                  background: '#fff', border: `1.5px solid ${C.sand}`,
                  borderRadius: 12, padding: '1.3rem 1.5rem',
                }}>
                  <div style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFade, marginBottom: '1.1rem', fontFamily: C.sans }}>
                    Case Timeline
                  </div>
                  {claim.timeline.map((entry, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '.8rem', alignItems: 'flex-start',
                      marginBottom: i < claim.timeline.length - 1 ? '1rem' : 0,
                      paddingBottom: i < claim.timeline.length - 1 ? '1rem' : 0,
                      borderBottom: i < claim.timeline.length - 1 ? `1px solid ${C.sand}` : 'none',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: i === claim.timeline.length - 1 ? C.gold : C.sand,
                        marginTop: '.35rem',
                      }} />
                      <div>
                        <div style={{ fontSize: '.78rem', color: C.ink, lineHeight: 1.5 }}>{entry.message}</div>
                        <div style={{ fontSize: '.65rem', color: C.inkFade, marginTop: '.15rem' }}>{entry.date}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compensation */}
                {claim.compensation_issued && (
                  <div style={{
                    background: '#f4fff7', border: `1.5px solid ${C.ok}30`,
                    borderRadius: 12, padding: '1.3rem 1.5rem',
                    display: 'flex', gap: '1rem', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>💰</span>
                    <div>
                      <div style={{ fontFamily: C.serif, fontSize: '1rem', fontWeight: 600, color: C.ok }}>Compensation Issued</div>
                      <div style={{ fontSize: '.78rem', color: C.inkFade, marginTop: '.2rem' }}>Your compensation has been processed and will arrive within 3–5 business days.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{
                  background: '#fff', border: `1.5px solid ${C.sand}`,
                  borderRadius: 12, padding: '1.2rem 1.4rem',
                }}>
                  <div style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFade, marginBottom: '.9rem', fontFamily: C.sans }}>
                    Investigation Progress
                  </div>
                  <StatusTimeline currentStatus={claim.status} />
                </div>

                <div style={{
                  background: C.parchment, border: `1px solid ${C.sand}`,
                  borderRadius: 12, padding: '1.1rem 1.3rem',
                }}>
                  <div style={{ fontFamily: C.serif, fontSize: '.95rem', fontWeight: 600, color: C.ink, marginBottom: '.6rem' }}>
                    Need help?
                  </div>
                  <div style={{ fontSize: '.75rem', color: C.inkFade, lineHeight: 1.7, marginBottom: '.8rem' }}>
                    Our support team is available Mon–Fri, 9am–6pm EST.
                  </div>
                  <div style={{ fontSize: '.72rem', color: C.gold, fontWeight: 500 }}>
                    📧 support@parcelguard.com
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
