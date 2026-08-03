// customer-portal/src/pages/ClaimPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STATUS_INFO = {
  open:               { label: 'Case Opened',        icon: '📋', color: '#b8942a', desc: 'Your case has been opened and is awaiting assignment to an investigator.' },
  assigned:           { label: 'Investigator Assigned', icon: '👤', color: '#c4622d', desc: 'An investigator has been assigned to your case and will begin review shortly.' },
  evidence_gathering: { label: 'Gathering Evidence',  icon: '🔍', color: '#c4622d', desc: 'Our team is collecting evidence, including image comparison and courier records.' },
  pending_response:   { label: 'Awaiting Response',   icon: '⏳', color: '#c4622d', desc: 'We are awaiting a response from the seller or courier involved.' },
  under_review:       { label: 'Under Active Review', icon: '⚖️', color: '#c4622d', desc: 'Your case is currently under active review by our investigation team.' },
  escalated:          { label: 'Escalated',           icon: '🚨', color: '#9b2c2c', desc: 'Your case has been escalated to senior investigators for priority handling.' },
  resolved_fraud:     { label: 'Fraud Confirmed',     icon: '✅', color: '#2d6a4f', desc: 'The investigation concluded that fraud occurred. Compensation is being processed.' },
  resolved_cleared:   { label: 'Case Cleared',        icon: '✓',  color: '#4a3f35', desc: 'The investigation concluded and no fraud was confirmed.' },
  closed:             { label: 'Case Closed',         icon: '🔒', color: '#8a7a6a', desc: 'This case has been resolved and closed.' },
}

const DEMO_CLAIM = {
  case_number: 'PG-2024-000042',
  status: 'evidence_gathering',
  severity: 'high',
  created_at: '2024-01-14T16:30:00Z',
  resolved_at: null,
  compensation_issued: false,
  timeline: [
    { date: '2024-01-14T16:30:00Z', message: 'Your fraud investigation case was opened.' },
    { date: '2024-01-14T16:31:00Z', message: 'AI analysis detected significant anomalies (score: 84.2/100).' },
    { date: '2024-01-15T09:15:00Z', message: 'An investigator has been assigned to your case.' },
    { date: '2024-01-15T11:40:00Z', message: 'Evidence gathering has begun — reviewing courier records and image comparisons.' },
  ],
}

export default function ClaimPage() {
  const { claimId } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/customer/claim/${claimId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(d => { setClaim(d); setLoading(false) })
      .catch(() => {
        // Demo fallback for any claim ID
        setClaim(DEMO_CLAIM)
        setLoading(false)
      })
  }, [claimId])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#8a7a6a' }}>
        <div style={{
          width: 32, height: 32, border: '2px solid #d8cfc4', borderTopColor: '#c4622d',
          borderRadius: '50%', animation: 'cpSpin .7s linear infinite',
          display: 'inline-block', marginBottom: '1rem',
        }} />
        <div style={{ fontSize: '.85rem' }}>Loading your case…</div>
        <style>{`@keyframes cpSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#1c1712', marginBottom: '1rem' }}>
          Case not found
        </h2>
        <p style={{ fontSize: '.88rem', color: '#8a7a6a', marginBottom: '2rem' }}>
          We couldn't find a case with that reference number.
        </p>
        <button onClick={() => navigate('/')} style={{
          padding: '.85rem 2rem', background: '#1c1712', color: '#f5f0e8',
          border: 'none', borderRadius: 10, fontSize: '.85rem', cursor: 'pointer',
          fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600,
        }}>Return to Tracking</button>
      </div>
    )
  }

  const statusInfo = STATUS_INFO[claim?.status] || STATUS_INFO.open
  const isResolved = ['resolved_fraud', 'resolved_cleared', 'closed'].includes(claim?.status)

  const progressSteps = [
    'open', 'assigned', 'evidence_gathering', 'under_review',
    isResolved ? claim.status : 'resolved_fraud',
  ]
  const currentProgressIndex = progressSteps.indexOf(claim?.status)

  return (
    <div style={{
      maxWidth: 760, margin: '0 auto', padding: '3rem 2rem',
      animation: 'cpFadeIn .5s ease',
    }}>
      <style>{`
        @keyframes cpFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cpSpin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '2rem', fontSize: '.75rem', color: '#8a7a6a' }}>
        <span style={{ cursor: 'pointer', color: '#c4622d' }} onClick={() => navigate('/')}>Track Parcel</span>
        <span>›</span>
        <span>Case Status</span>
      </div>

      {/* Case header */}
      <div style={{
        background: '#fff', border: '1px solid #d8cfc4',
        borderRadius: 14, padding: '2rem', marginBottom: '1.5rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '1.5rem',
        }}>
          <div>
            <div style={{ fontSize: '.62rem', color: '#8a7a6a', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '.3rem' }}>
              Case Reference
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.8rem', fontWeight: 600, color: '#1c1712', lineHeight: 1,
            }}>{claim.case_number}</div>
            <div style={{ fontSize: '.75rem', color: '#8a7a6a', marginTop: '.4rem' }}>
              Opened {new Date(claim.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* Status badge */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.5rem',
              padding: '.5rem 1rem', borderRadius: 30,
              background: `${statusInfo.color}0f`,
              border: `1px solid ${statusInfo.color}30`,
            }}>
              <span style={{ fontSize: '1rem' }}>{statusInfo.icon}</span>
              <span style={{
                fontSize: '.78rem', fontWeight: 600, color: statusInfo.color,
              }}>{statusInfo.label}</span>
            </div>
            {claim.severity === 'high' || claim.severity === 'critical' ? (
              <div style={{ fontSize: '.65rem', color: '#9b2c2c', marginTop: '.4rem' }}>
                {claim.severity === 'critical' ? '🔴 Critical priority' : '🟠 High priority'}
              </div>
            ) : null}
          </div>
        </div>

        {/* Status description */}
        <div style={{
          padding: '1rem', background: `${statusInfo.color}08`,
          border: `1px solid ${statusInfo.color}20`, borderRadius: 8,
          fontSize: '.82rem', color: '#4a3f35', lineHeight: 1.6,
          marginBottom: '1.5rem',
        }}>
          {statusInfo.desc}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ fontSize: '.62rem', color: '#8a7a6a', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.8rem' }}>
            Investigation Progress
          </div>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            {['Opened', 'Assigned', 'Investigating', 'Reviewing', 'Resolved'].map((label, i) => {
              const done = i < currentProgressIndex
              const active = i === currentProgressIndex
              const last = i === 4

              return (
                <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: done ? '#2d6a4f' : active ? statusInfo.color : '#ebe4d9',
                      border: `2px solid ${done ? '#2d6a4f' : active ? statusInfo.color : '#d8cfc4'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: active ? `0 0 0 4px ${statusInfo.color}20` : 'none',
                      transition: 'all .3s',
                    }}>
                      {done && <span style={{ color: '#fff', fontSize: '.55rem', fontWeight: 700 }}>✓</span>}
                      {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                    </div>
                    <div style={{
                      fontSize: '.55rem', marginTop: '.35rem', textAlign: 'center',
                      color: active ? statusInfo.color : done ? '#2d6a4f' : '#b8a898',
                      fontWeight: active ? 600 : 400, maxWidth: 52,
                      letterSpacing: '.02em', lineHeight: 1.3,
                    }}>{label}</div>
                  </div>
                  {!last && (
                    <div style={{
                      flex: 1, height: 2, margin: '0 4px',
                      background: done ? '#2d6a4f' : '#ebe4d9',
                      marginBottom: '1.2rem',
                      transition: 'background .3s',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Compensation notice */}
      {claim.status === 'resolved_fraud' && (
        <div style={{
          background: 'rgba(45,106,79,0.05)', border: '1px solid rgba(45,106,79,0.25)',
          borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.3rem', fontWeight: 600, color: '#2d6a4f', marginBottom: '.5rem',
          }}>
            Fraud Confirmed — Compensation in Progress
          </div>
          <p style={{ fontSize: '.82rem', color: '#4a3f35', lineHeight: 1.7 }}>
            Our investigation confirmed fraudulent activity with your delivery.
            {claim.compensation_issued
              ? ' Your compensation has been issued and should arrive within 3–5 business days.'
              : ' Your compensation is being processed and will be issued shortly.'}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div style={{
        background: '#fff', border: '1px solid #d8cfc4',
        borderRadius: 14, padding: '2rem',
      }}>
        <div style={{
          fontSize: '.65rem', color: '#8a7a6a', letterSpacing: '.12em',
          textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: 600,
        }}>Case Timeline</div>

        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 10, top: 12, bottom: 12,
            width: 1, background: '#ebe4d9',
          }} />

          {(claim.timeline || []).map((entry, i) => (
            <div key={i} style={{
              display: 'flex', gap: '1.2rem', marginBottom: '1.5rem',
              position: 'relative', zIndex: 1,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? '#c4622d' : '#ebe4d9',
                border: `2px solid ${i === 0 ? '#c4622d' : '#d8cfc4'}`,
                marginTop: '.15rem',
              }} />
              <div>
                <div style={{ fontSize: '.72rem', color: '#8a7a6a', marginBottom: '.2rem' }}>
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                <div style={{ fontSize: '.82rem', color: '#1c1712', lineHeight: 1.5 }}>
                  {entry.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.8rem' }}>
        <button onClick={() => navigate('/')} style={{
          padding: '.75rem 1.6rem', background: 'transparent',
          border: '1px solid #d8cfc4', borderRadius: 10, fontSize: '.83rem',
          color: '#4a3f35', cursor: 'pointer',
          fontFamily: "'Instrument Sans', sans-serif",
          transition: 'border-color .15s',
        }}
          onMouseEnter={e => e.target.style.borderColor = '#c4622d'}
          onMouseLeave={e => e.target.style.borderColor = '#d8cfc4'}
        >← Track Another Parcel</button>

        <button onClick={() => window.location.reload()} style={{
          padding: '.75rem 1.6rem', background: '#1c1712', color: '#f5f0e8',
          border: 'none', borderRadius: 10, fontSize: '.83rem', cursor: 'pointer',
          fontFamily: "'Instrument Sans', sans-serif",
        }}>↻ Refresh Status</button>
      </div>
    </div>
  )
}
