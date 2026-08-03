// customer-portal/src/pages/TrackPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_FLOW = [
  { key: 'packed',           label: 'Packed',           icon: '📦', desc: 'Your parcel has been packed and is awaiting collection.' },
  { key: 'picked_up',        label: 'Collected',        icon: '🤝', desc: 'Collected from the seller and entered our delivery network.' },
  { key: 'in_transit',       label: 'In Transit',       icon: '🚛', desc: 'Your parcel is moving through our logistics network.' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚', desc: 'Your parcel is with a delivery agent and on its way.' },
  { key: 'delivered',        label: 'Delivered',        icon: '✅', desc: 'Your parcel has been delivered. Did everything arrive correctly?' },
]

const DISPUTED_STATUS = { key: 'disputed', label: 'Under Review', icon: '🔍', desc: 'We have noted an issue with this parcel and are reviewing it.' }
const INVESTIGATION_STATUS = { key: 'investigation', label: 'Investigation Opened', icon: '⚖️', desc: 'A formal investigation has been opened for this parcel.' }

// Demo parcels for when API isn't available
const DEMO_PARCELS = {
  'PGX4K9B2': {
    tracking_number: 'PGX4K9B2',
    status: 'in_transit',
    item_description: 'Electronics — Smartphone',
    origin_city: 'New York, NY',
    destination_city: 'Los Angeles, CA',
    packed_at: '2024-01-15T09:00:00Z',
    delivered_at: null,
    requires_attention: false,
    already_verified: false,
    checkpoints: [
      { type: 'pickup', label: 'Collected from Seller', city: 'New York, NY', time: '2024-01-15T11:30:00Z' },
      { type: 'sort', label: 'Arrived at Sort Facility', city: 'Newark, NJ', time: '2024-01-15T15:45:00Z' },
      { type: 'hub', label: 'In Transit Hub', city: 'Chicago, IL', time: '2024-01-16T08:20:00Z' },
    ],
  },
  'PGM2J7R5': {
    tracking_number: 'PGM2J7R5',
    status: 'investigation',
    item_description: 'Jewellery — Watch',
    origin_city: 'Miami, FL',
    destination_city: 'Boston, MA',
    packed_at: '2024-01-12T10:00:00Z',
    delivered_at: '2024-01-14T14:00:00Z',
    requires_attention: true,
    already_verified: true,
    checkpoints: [
      { type: 'pickup', label: 'Collected from Seller', city: 'Miami, FL', time: '2024-01-12T14:00:00Z' },
      { type: 'sort', label: 'Sort Facility Scan', city: 'Atlanta, GA', time: '2024-01-13T06:30:00Z' },
      { type: 'hub', label: 'Transit Hub — Anomaly Detected', city: 'Charlotte, NC', time: '2024-01-13T18:45:00Z', anomaly: true },
      { type: 'delivered', label: 'Delivered', city: 'Boston, MA', time: '2024-01-14T14:00:00Z' },
    ],
  },
  'PGA8N3W1': {
    tracking_number: 'PGA8N3W1',
    status: 'delivered',
    item_description: 'Clothing — Leather Jacket',
    origin_city: 'Chicago, IL',
    destination_city: 'Los Angeles, CA',
    packed_at: '2024-01-10T08:00:00Z',
    delivered_at: '2024-01-13T11:30:00Z',
    requires_attention: false,
    already_verified: false,
    checkpoints: [
      { type: 'pickup', label: 'Collected from Seller', city: 'Chicago, IL', time: '2024-01-10T12:00:00Z' },
      { type: 'sort', label: 'Sort Facility', city: 'Kansas City, MO', time: '2024-01-11T04:00:00Z' },
      { type: 'hub', label: 'Transit Hub', city: 'Denver, CO', time: '2024-01-11T20:30:00Z' },
      { type: 'delivery', label: 'Out for Delivery', city: 'Los Angeles, CA', time: '2024-01-13T09:00:00Z' },
      { type: 'delivered', label: 'Delivered', city: 'Los Angeles, CA', time: '2024-01-13T11:30:00Z' },
    ],
  },
}

function StatusTimeline({ status, checkpoints = [] }) {
  const isDisputed = status === 'disputed'
  const isInvestigation = status === 'investigation'

  const currentIndex = isDisputed || isInvestigation
    ? STATUS_FLOW.length - 1
    : STATUS_FLOW.findIndex(s => s.key === status)

  const displayStatus = isDisputed
    ? DISPUTED_STATUS
    : isInvestigation
    ? INVESTIGATION_STATUS
    : null

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical connector line */}
      <div style={{
        position: 'absolute', left: 18, top: 24, bottom: 24,
        width: 1, background: '#d8cfc4', zIndex: 0,
      }} />

      {/* Standard flow steps */}
      {STATUS_FLOW.map((step, i) => {
        const isCompleted = i < currentIndex
        const isCurrent = i === currentIndex && !isDisputed && !isInvestigation
        const isPending = i > currentIndex

        return (
          <div key={step.key} style={{
            display: 'flex', gap: '1.2rem', alignItems: 'flex-start',
            marginBottom: '1.5rem', position: 'relative', zIndex: 1,
          }}>
            {/* Step indicator */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              background: isCompleted ? '#2d6a4f'
                : isCurrent ? '#c4622d'
                : '#ede7d9',
              border: isCurrent ? '2px solid #c4622d'
                : isCompleted ? '2px solid #2d6a4f'
                : '1px solid #d8cfc4',
              transition: 'all .3s',
              boxShadow: isCurrent ? '0 0 0 4px rgba(196,98,45,0.12)' : 'none',
            }}>
              {isCompleted ? (
                <span style={{ color: '#fff', fontSize: '.9rem' }}>✓</span>
              ) : (
                <span style={{ opacity: isPending ? .4 : 1 }}>{step.icon}</span>
              )}
            </div>

            {/* Content */}
            <div style={{ paddingTop: '.4rem' }}>
              <div style={{
                fontSize: '.85rem', fontWeight: 600,
                color: isCurrent ? '#c4622d'
                  : isCompleted ? '#1c1712'
                  : '#8a7a6a',
                transition: 'color .2s',
              }}>{step.label}</div>
              {(isCurrent || isCompleted) && (
                <div style={{
                  fontSize: '.75rem', color: '#8a7a6a',
                  marginTop: '.1rem', lineHeight: 1.5,
                }}>
                  {step.desc}
                </div>
              )}
              {/* Show checkpoint city if available */}
              {checkpoints[i] && (
                <div style={{
                  fontSize: '.7rem', color: '#8a7a6a', marginTop: '.2rem',
                  display: 'flex', alignItems: 'center', gap: '.3rem',
                }}>
                  <span style={{
                    color: checkpoints[i].anomaly ? '#9b2c2c' : '#2d6a4f',
                    fontSize: '.65rem',
                  }}>
                    {checkpoints[i].anomaly ? '⚠' : '📍'}
                  </span>
                  {checkpoints[i].city}
                  {checkpoints[i].time && (
                    <span style={{ color: '#b8a898', marginLeft: '.3rem' }}>
                      · {new Date(checkpoints[i].time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {checkpoints[i].anomaly && (
                    <span style={{
                      fontSize: '.6rem', color: '#9b2c2c',
                      background: 'rgba(155,44,44,0.08)', border: '1px solid rgba(155,44,44,0.2)',
                      padding: '.08rem .4rem', borderRadius: 3, marginLeft: '.3rem',
                    }}>anomaly logged</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Disputed / Investigation extra step */}
      {displayStatus && (
        <div style={{
          display: 'flex', gap: '1.2rem', alignItems: 'flex-start',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
            background: '#9b2c2c', border: '2px solid #9b2c2c',
            boxShadow: '0 0 0 4px rgba(155,44,44,0.12)',
          }}>
            {displayStatus.icon}
          </div>
          <div style={{ paddingTop: '.4rem' }}>
            <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#9b2c2c' }}>
              {displayStatus.label}
            </div>
            <div style={{ fontSize: '.75rem', color: '#8a7a6a', marginTop: '.1rem' }}>
              {displayStatus.desc}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrackPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [parcel, setParcel] = useState(null)

  async function handleTrack(e) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setParcel(null)

    try {
      const res = await fetch(`${API}/api/customer/track/${input.trim().toUpperCase()}`)
      if (!res.ok) throw new Error('Tracking number not found')
      const data = await res.json()
      setParcel(data)
    } catch {
      // Fall back to demo data
      const demo = DEMO_PARCELS[input.trim().toUpperCase()]
      if (demo) {
        setParcel(demo)
      } else {
        setError('We couldn\'t find that tracking number. Please double-check it and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const demoKeys = Object.keys(DEMO_PARCELS)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 2rem' }}>

      {/* Hero section */}
      <div style={{
        textAlign: 'center', marginBottom: '3.5rem',
        animation: 'cpFadeIn .6s ease',
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase',
          color: '#c4622d', fontWeight: 600, marginBottom: '1rem',
          padding: '.3rem .9rem', borderRadius: 20,
          background: 'rgba(196,98,45,0.06)', border: '1px solid rgba(196,98,45,0.15)',
        }}>
          Delivery Tracking
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 300, color: '#1c1712',
          letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: '1rem',
        }}>
          Where is your <em style={{ fontStyle: 'italic', color: '#c4622d' }}>parcel?</em>
        </h1>
        <p style={{
          fontSize: '.9rem', color: '#8a7a6a', maxWidth: 420,
          margin: '0 auto', lineHeight: 1.7,
        }}>
          Enter your tracking number to see real-time status, delivery timeline, and raise any issues with your order.
        </p>
      </div>

      {/* Tracking form */}
      <div style={{
        maxWidth: 560, margin: '0 auto 3rem',
        animation: 'cpFadeIn .6s ease .1s both',
      }}>
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '.8rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              placeholder="e.g. PGX4K9B2"
              style={{
                width: '100%', padding: '1rem 1.2rem',
                background: '#fff', border: '1.5px solid #d8cfc4',
                borderRadius: 10, fontSize: '.95rem', color: '#1c1712',
                outline: 'none', transition: 'border-color .15s, box-shadow .15s',
                letterSpacing: '.06em', fontFamily: "'Instrument Sans', sans-serif",
              }}
              onFocus={e => {
                e.target.style.borderColor = '#c4622d'
                e.target.style.boxShadow = '0 0 0 3px rgba(196,98,45,0.1)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#d8cfc4'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '1rem 1.8rem',
              background: loading ? '#ede7d9' : '#1c1712',
              color: loading ? '#8a7a6a' : '#f5f0e8',
              border: 'none', borderRadius: 10, fontSize: '.85rem',
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              whiteSpace: 'nowrap', transition: 'all .2s',
              display: 'flex', alignItems: 'center', gap: '.5rem',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#c4622d' }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#1c1712' }}
          >
            {loading ? (
              <span style={{
                width: 14, height: 14, border: '2px solid #c4622d',
                borderTopColor: 'transparent', borderRadius: '50%',
                animation: 'cpSpin .7s linear infinite', display: 'inline-block',
              }} />
            ) : '→'}
            {loading ? 'Looking up…' : 'Track'}
          </button>
        </form>

        {/* Demo hints */}
        <div style={{
          marginTop: '1rem', display: 'flex', alignItems: 'center',
          gap: '.6rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '.72rem', color: '#b8a898' }}>Try:</span>
          {demoKeys.map(k => (
            <button
              key={k}
              onClick={() => { setInput(k); setError(null) }}
              style={{
                padding: '.25rem .7rem', borderRadius: 20, border: '1px solid #d8cfc4',
                background: 'transparent', fontSize: '.7rem', color: '#8a7a6a',
                cursor: 'pointer', letterSpacing: '.04em',
                transition: 'all .15s', fontFamily: "'Instrument Sans', sans-serif",
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#c4622d'; e.target.style.color = '#c4622d' }}
              onMouseLeave={e => { e.target.style.borderColor = '#d8cfc4'; e.target.style.color = '#8a7a6a' }}
            >{k}</button>
          ))}
        </div>

        {error && (
          <div style={{
            marginTop: '1rem', padding: '.9rem 1.1rem',
            background: 'rgba(155,44,44,0.05)', border: '1px solid rgba(155,44,44,0.2)',
            borderRadius: 8, fontSize: '.8rem', color: '#9b2c2c',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {parcel && (
        <div style={{
          animation: 'cpSlideIn .4s ease',
          display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem',
          alignItems: 'start',
        }}>

          {/* Timeline */}
          <div>
            <div style={{
              background: '#fff', border: '1px solid #d8cfc4',
              borderRadius: 14, padding: '2rem',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #ebe4d9',
              }}>
                <div>
                  <div style={{ fontSize: '.62rem', color: '#8a7a6a', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '.3rem' }}>
                    Tracking Number
                  </div>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1.8rem', fontWeight: 600, color: '#1c1712',
                    letterSpacing: '.06em', lineHeight: 1,
                  }}>
                    {parcel.tracking_number}
                  </div>
                  {parcel.item_description && (
                    <div style={{ fontSize: '.8rem', color: '#8a7a6a', marginTop: '.4rem' }}>
                      {parcel.item_description}
                    </div>
                  )}
                </div>

                {/* Status chip */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem',
                }}>
                  {parcel.requires_attention && (
                    <span style={{
                      fontSize: '.62rem', padding: '.25rem .7rem', borderRadius: 20,
                      background: 'rgba(155,44,44,0.08)', border: '1px solid rgba(155,44,44,0.25)',
                      color: '#9b2c2c', fontWeight: 600, letterSpacing: '.06em',
                    }}>⚠ Attention Required</span>
                  )}
                  {!parcel.requires_attention && parcel.status === 'delivered' && (
                    <span style={{
                      fontSize: '.62rem', padding: '.25rem .7rem', borderRadius: 20,
                      background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.25)',
                      color: '#2d6a4f', fontWeight: 600, letterSpacing: '.06em',
                    }}>✓ Delivered</span>
                  )}
                </div>
              </div>

              {/* Route */}
              {(parcel.origin_city || parcel.destination_city) && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.8rem',
                  marginBottom: '2rem', padding: '.9rem 1rem',
                  background: '#faf8f4', borderRadius: 8, border: '1px solid #ebe4d9',
                }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '.6rem', color: '#b8a898', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.2rem' }}>From</div>
                    <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1c1712' }}>{parcel.origin_city || '—'}</div>
                  </div>
                  <div style={{ color: '#c4622d', fontSize: '1.2rem' }}>→</div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '.6rem', color: '#b8a898', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.2rem' }}>To</div>
                    <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1c1712' }}>{parcel.destination_city || '—'}</div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <StatusTimeline
                status={parcel.status}
                checkpoints={parcel.checkpoints || []}
              />
            </div>
          </div>

          {/* Sidebar: actions + info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Report issue CTA */}
            {parcel.status === 'delivered' && !parcel.already_verified && (
              <div style={{
                background: '#fff', border: '1px solid #d8cfc4',
                borderRadius: 14, padding: '1.5rem',
              }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.2rem', fontWeight: 600, color: '#1c1712',
                  marginBottom: '.5rem',
                }}>
                  Did everything arrive correctly?
                </div>
                <p style={{ fontSize: '.78rem', color: '#8a7a6a', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                  If your parcel arrived damaged, incorrect, or tampered with — report it now. Our AI system will investigate immediately.
                </p>
                <button
                  onClick={() => navigate(`/verify?tracking=${parcel.tracking_number}`)}
                  style={{
                    width: '100%', padding: '.9rem',
                    background: '#c4622d', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: '.85rem',
                    fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Instrument Sans', sans-serif",
                    transition: 'background .2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#b8562a'}
                  onMouseLeave={e => e.target.style.background = '#c4622d'}
                >
                  Report an Issue
                </button>
                <button
                  onClick={() => navigate(`/verify?tracking=${parcel.tracking_number}&confirm=true`)}
                  style={{
                    width: '100%', marginTop: '.6rem', padding: '.75rem',
                    background: 'transparent', color: '#2d6a4f',
                    border: '1px solid #2d6a4f', borderRadius: 8, fontSize: '.82rem',
                    fontWeight: 500, cursor: 'pointer',
                    fontFamily: "'Instrument Sans', sans-serif",
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => { e.target.style.background = 'rgba(45,106,79,0.06)' }}
                  onMouseLeave={e => { e.target.style.background = 'transparent' }}
                >
                  ✓ Everything is fine
                </button>
              </div>
            )}

            {/* Already verified */}
            {parcel.already_verified && (
              <div style={{
                background: '#fff', border: '1px solid #d8cfc4',
                borderRadius: 14, padding: '1.5rem',
              }}>
                <div style={{ fontSize: '.72rem', color: '#2d6a4f', marginBottom: '.4rem', fontWeight: 600 }}>✓ Delivery Confirmed</div>
                <p style={{ fontSize: '.78rem', color: '#8a7a6a', lineHeight: 1.6 }}>
                  You have already submitted confirmation for this parcel. If there is an open investigation, you can check its status below.
                </p>
              </div>
            )}

            {/* Investigation open */}
            {parcel.requires_attention && (
              <div style={{
                background: 'rgba(155,44,44,0.04)',
                border: '1px solid rgba(155,44,44,0.2)',
                borderRadius: 14, padding: '1.5rem',
              }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.1rem', fontWeight: 600, color: '#9b2c2c',
                  marginBottom: '.5rem',
                }}>
                  Investigation Opened
                </div>
                <p style={{ fontSize: '.78rem', color: '#8a7a6a', lineHeight: 1.6, marginBottom: '1rem' }}>
                  Our fraud detection system has flagged anomalies with this parcel. An investigation has been opened and investigators have been notified.
                </p>
                <div style={{
                  fontSize: '.72rem', color: '#9b2c2c',
                  padding: '.6rem .8rem', background: 'rgba(155,44,44,0.06)',
                  borderRadius: 6, lineHeight: 1.6,
                }}>
                  You will be contacted by our team within 24–48 hours regarding resolution and any compensation.
                </div>
              </div>
            )}

            {/* Parcel details */}
            <div style={{
              background: '#fff', border: '1px solid #d8cfc4',
              borderRadius: 14, padding: '1.5rem',
            }}>
              <div style={{
                fontSize: '.62rem', color: '#8a7a6a', letterSpacing: '.12em',
                textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600,
              }}>Parcel Details</div>
              {[
                { label: 'Description', val: parcel.item_description || '—' },
                { label: 'Dispatched', val: parcel.packed_at ? new Date(parcel.packed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : '—' },
                { label: 'Delivered', val: parcel.delivered_at ? new Date(parcel.delivered_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : 'Pending' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '.55rem 0', borderBottom: '1px solid #ebe4d9', gap: '1rem',
                }}>
                  <span style={{ fontSize: '.75rem', color: '#8a7a6a' }}>{item.label}</span>
                  <span style={{ fontSize: '.78rem', color: '#1c1712', fontWeight: 500, textAlign: 'right' }}>{item.val}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Empty state illustration */}
      {!parcel && !loading && (
        <div style={{
          textAlign: 'center', padding: '2rem',
          animation: 'cpFadeIn .6s ease .2s both',
        }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            gap: '1.5rem', padding: '3rem', maxWidth: 440,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(196,98,45,0.06)', border: '1px solid rgba(196,98,45,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem',
            }}>📦</div>
            <div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.3rem', fontWeight: 400, color: '#4a3f35',
                marginBottom: '.5rem',
              }}>
                Enter your tracking number above
              </div>
              <div style={{ fontSize: '.78rem', color: '#8a7a6a', lineHeight: 1.7 }}>
                Your tracking number can be found in your order confirmation email,
                starting with <strong style={{ color: '#c4622d' }}>PG</strong> followed by 8 characters.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cpFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cpSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cpSpin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
