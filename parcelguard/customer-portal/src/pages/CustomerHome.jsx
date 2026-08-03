// customer-portal/src/pages/CustomerHome.jsx
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  cream: '#faf8f4', parchment: '#f2ede3', sand: '#e8dfc8',
  gold: '#c6914a', goldLight: '#e8b870', goldDark: '#7a5c1e',
  ink: '#1a1612', inkLight: '#4a3f32', inkFade: '#8a7a68',
  navy: '#1e2a42', teal: '#2a6b6b',
  ok: '#2d7a4e', warn: '#b07a1a', danger: '#9b2a2a',
  okBg: '#edf7f0', warnBg: '#fdf6e3', dangerBg: '#fdf0f0',
  serif: "'Fraunces', serif",
  sans: "'DM Sans', sans-serif",
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Track Package' },
  { n: 2, label: 'Your Details'  },
  { n: 3, label: 'Upload Photo'  },
  { n: 4, label: 'Result'        },
]

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PARCELS = {
  'PGX4K9B2': { tracking: 'PGX4K9B2', item: 'Electronics — Smartphone', origin: 'New York, NY', destination: 'Los Angeles, CA', status: 'delivered', delivered_at: '2024-01-15', requires_attention: false, already_verified: false },
  'PGM2J7R5': { tracking: 'PGM2J7R5', item: 'Jewelry — Luxury Watch', origin: 'Miami, FL', destination: 'Chicago, IL', status: 'delivered', delivered_at: '2024-01-14', requires_attention: true, already_verified: false },
  'PGA8N3W1': { tracking: 'PGA8N3W1', item: 'Clothing — Winter Jacket', origin: 'Seattle, WA', destination: 'Denver, CO', status: 'delivered', delivered_at: '2024-01-16', requires_attention: false, already_verified: false },
  'PGL3H8K4': { tracking: 'PGL3H8K4', item: 'Books — Collector\'s Set', origin: 'Boston, MA', destination: 'Atlanta, GA', status: 'in_transit', delivered_at: null, requires_attention: false, already_verified: false },
}

const STATUS_LABELS = {
  packed: 'Preparing',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  disputed: 'Under Review',
  investigation: 'Under Investigation',
}

// ─── Small shared components ──────────────────────────────────────────────────
function ProgressBar({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '3rem' }}>
      {STEPS.map((s, i) => {
        const done = step > s.n, active = step === s.n
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '.7rem',
                fontWeight: 700, transition: 'all .3s',
                background: done ? C.gold : active ? C.ink : C.sand,
                color: done || active ? '#fff' : C.inkFade,
                border: active ? `2px solid ${C.gold}` : '2px solid transparent',
                boxShadow: active ? `0 0 0 4px ${C.goldLight}40` : 'none',
              }}>
                {done ? '✓' : s.n}
              </div>
              <span style={{
                fontSize: '.62rem', fontWeight: active ? 600 : 400,
                color: active ? C.ink : done ? C.gold : C.inkFade,
                whiteSpace: 'nowrap',
              }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 .5rem', marginBottom: '1.2rem',
                background: step > s.n ? C.gold : C.sand,
                transition: 'background .3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '.62rem', fontWeight: 600, letterSpacing: '.14em',
      textTransform: 'uppercase', color: C.gold, marginBottom: '.45rem',
      fontFamily: C.sans,
    }}>{children}</div>
  )
}

function TextInput({ label, value, onChange, placeholder, type = 'text', hint }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: C.inkLight, marginBottom: '.35rem', fontFamily: C.sans }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', padding: '.7rem 1rem',
          background: focused ? '#fff' : C.cream,
          border: `1.5px solid ${focused ? C.gold : C.sand}`,
          borderRadius: 8, fontSize: '.85rem', fontFamily: C.sans,
          color: C.ink, outline: 'none', transition: 'all .2s',
          boxShadow: focused ? `0 0 0 3px ${C.goldLight}30` : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {hint && <div style={{ fontSize: '.65rem', color: C.inkFade, marginTop: '.3rem' }}>{hint}</div>}
    </div>
  )
}

function PrimaryBtn({ children, onClick, disabled, loading, style }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick} disabled={disabled || loading}
      style={{
        padding: '.8rem 2rem', background: disabled ? C.sand : hov ? C.goldDark : C.gold,
        color: disabled ? C.inkFade : '#fff', border: 'none', borderRadius: 8,
        fontSize: '.85rem', fontWeight: 600, fontFamily: C.sans,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '.5rem',
        boxShadow: (!disabled && !loading) ? '0 2px 12px rgba(198,145,74,.35)' : 'none',
        ...style,
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />}
      {children}
    </button>
  )
}

// ─── Step 1: Track ────────────────────────────────────────────────────────────
function StepTrack({ onNext }) {
  const [tracking, setTracking] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  function lookup() {
    if (!tracking.trim()) return
    setLoading(true); setError(null); setResult(null)
    setTimeout(() => {
      const p = MOCK_PARCELS[tracking.trim().toUpperCase()]
      if (p) { setResult(p) }
      else { setError('We couldn\'t find that tracking number. Please double-check and try again.') }
      setLoading(false)
    }, 900)
  }

  const statusColors = {
    delivered: { bg: C.okBg, text: C.ok, dot: C.ok },
    in_transit: { bg: C.warnBg, text: C.warn, dot: C.warn },
    investigation: { bg: C.dangerBg, text: C.danger, dot: C.danger },
  }
  const sc = result ? (statusColors[result.status] || { bg: C.parchment, text: C.inkLight, dot: C.inkFade }) : {}

  return (
    <div>
      <h2 style={{ fontFamily: C.serif, fontSize: '1.9rem', fontWeight: 600, color: C.ink, marginBottom: '.5rem', letterSpacing: '-.02em' }}>
        Track your package
      </h2>
      <p style={{ color: C.inkFade, fontSize: '.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
        Enter your tracking number to see delivery status and report any issues.
      </p>

      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1.5rem' }}>
        <input
          value={tracking}
          onChange={e => { setTracking(e.target.value.toUpperCase()); setError(null); setResult(null) }}
          placeholder="e.g. PGX4K9B2"
          onKeyDown={e => e.key === 'Enter' && lookup()}
          style={{
            flex: 1, padding: '.75rem 1.1rem', background: '#fff',
            border: `1.5px solid ${C.sand}`, borderRadius: 8,
            fontSize: '.9rem', fontFamily: C.sans, color: C.ink, outline: 'none',
            letterSpacing: '.06em', fontWeight: 500,
          }}
        />
        <PrimaryBtn onClick={lookup} loading={loading} disabled={!tracking.trim()}>
          {!loading && '→'} Track
        </PrimaryBtn>
      </div>

      {/* Demo hints */}
      <div style={{ fontSize: '.72rem', color: C.inkFade, marginBottom: '1.5rem' }}>
        Demo: try&nbsp;
        {['PGX4K9B2', 'PGM2J7R5', 'PGA8N3W1'].map((t, i) => (
          <span key={t}>
            <span style={{ color: C.gold, cursor: 'pointer', fontWeight: 500, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
              onClick={() => { setTracking(t); setError(null); setResult(null) }}>
              {t}
            </span>
            {i < 2 ? ' · ' : ''}
          </span>
        ))}
      </div>

      {error && (
        <div style={{ padding: '1rem 1.2rem', background: C.dangerBg, border: `1px solid ${C.danger}30`, borderRadius: 8, fontSize: '.82rem', color: C.danger, marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          background: '#fff', border: `1.5px solid ${C.sand}`,
          borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem',
          animation: 'fadeUp .3s ease',
        }}>
          {/* Status header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
            <div>
              <div style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFade, marginBottom: '.3rem', fontFamily: C.sans }}>
                Tracking Number
              </div>
              <div style={{ fontFamily: C.serif, fontSize: '1.3rem', fontWeight: 600, color: C.ink, letterSpacing: '.02em' }}>
                {result.tracking}
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.4rem',
              padding: '.4rem .9rem', borderRadius: 20,
              background: sc.bg, border: `1px solid ${sc.dot}20`,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
              <span style={{ fontSize: '.72rem', fontWeight: 600, color: sc.text }}>
                {STATUS_LABELS[result.status] || result.status}
              </span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.sand}`, paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
            <div>
              <div style={{ fontSize: '.62rem', color: C.inkFade, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.25rem' }}>Item</div>
              <div style={{ fontSize: '.82rem', color: C.ink, fontWeight: 500 }}>{result.item}</div>
            </div>
            <div>
              <div style={{ fontSize: '.62rem', color: C.inkFade, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.25rem' }}>
                {result.delivered_at ? 'Delivered' : 'Est. Delivery'}
              </div>
              <div style={{ fontSize: '.82rem', color: C.ink, fontWeight: 500 }}>{result.delivered_at || 'In progress'}</div>
            </div>
            <div>
              <div style={{ fontSize: '.62rem', color: C.inkFade, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.25rem' }}>From</div>
              <div style={{ fontSize: '.82rem', color: C.ink }}>{result.origin}</div>
            </div>
            <div>
              <div style={{ fontSize: '.62rem', color: C.inkFade, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.25rem' }}>To</div>
              <div style={{ fontSize: '.82rem', color: C.ink }}>{result.destination}</div>
            </div>
          </div>

          {result.requires_attention && (
            <div style={{
              marginTop: '1rem', padding: '.75rem 1rem',
              background: 'linear-gradient(135deg, #fff8ed, #fff3e0)',
              border: `1px solid ${C.gold}40`, borderRadius: 8,
              fontSize: '.78rem', color: C.warn, lineHeight: 1.6,
            }}>
              ⚠ Our system has flagged anomalies with this parcel. We recommend filing a report below.
            </div>
          )}

          {result.already_verified && (
            <div style={{
              marginTop: '1rem', padding: '.75rem 1rem', background: C.okBg,
              border: `1px solid ${C.ok}30`, borderRadius: 8,
              fontSize: '.78rem', color: C.ok,
            }}>
              ✓ You have already submitted a report for this parcel.
            </div>
          )}
        </div>
      )}

      {result && !result.already_verified && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '.78rem', color: C.inkFade }}>
            {result.status === 'delivered'
              ? 'Did your package arrive correctly? Report any issues below.'
              : 'Package not yet delivered. You can still file a preemptive report.'}
          </div>
          <PrimaryBtn onClick={() => onNext(result)}>
            {result.requires_attention ? '🚨 File Fraud Report' : 'Continue →'}
          </PrimaryBtn>
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Customer Details ─────────────────────────────────────────────────
function StepDetails({ parcel, onNext, onBack }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')

  const canContinue = name.trim() && email.trim() && email.includes('@')

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.inkFade, fontSize: '.78rem', cursor: 'pointer', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '.3rem' }}>
        ← Back
      </button>
      <h2 style={{ fontFamily: C.serif, fontSize: '1.9rem', fontWeight: 600, color: C.ink, marginBottom: '.5rem', letterSpacing: '-.02em' }}>
        Your details
      </h2>
      <p style={{ color: C.inkFade, fontSize: '.88rem', marginBottom: '2rem', lineHeight: 1.6 }}>
        For parcel <strong style={{ color: C.ink }}>{parcel.tracking}</strong> — {parcel.item}
      </p>

      <TextInput label="Full name *" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
      <TextInput label="Email address *" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" hint="We'll send you case updates here." />

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: C.inkLight, marginBottom: '.35rem', fontFamily: C.sans }}>
          Describe the issue (optional)
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. The package arrived open and appeared to contain different items than ordered…"
          rows={4}
          style={{
            width: '100%', padding: '.7rem 1rem', background: '#fff',
            border: `1.5px solid ${C.sand}`, borderRadius: 8,
            fontSize: '.85rem', fontFamily: C.sans, color: C.ink, outline: 'none',
            resize: 'vertical', lineHeight: 1.6,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryBtn onClick={() => onNext({ name, email, description })} disabled={!canContinue}>
          Continue →
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Step 3: Upload Photo ─────────────────────────────────────────────────────
function StepUpload({ parcel, details, onNext, onBack }) {
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((files) => {
    const f = files[0]
    if (!f) return
    setPhoto(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [], 'video/*': [] }, maxFiles: 1,
  })

  function handleSubmit() {
    setLoading(true)
    setTimeout(() => {
      // Simulate AI analysis result
      const isHighRisk = parcel.requires_attention
      const result = {
        fraud_risk: isHighRisk ? 'high' : photo ? 'low' : 'unknown',
        message: isHighRisk
          ? '🚨 Significant anomalies detected. A fraud investigation has been opened automatically. You will be contacted shortly.'
          : photo
          ? '✅ Your parcel looks good! No anomalies detected between our packing scan and your received photo.'
          : '📋 Your submission has been received. Our team will review it within 24 hours.',
        claim_id: isHighRisk ? 'CLM-' + Math.random().toString(36).substring(2, 8).toUpperCase() : null,
        tracking: parcel.tracking,
        name: details.name,
        email: details.email,
      }
      onNext(result)
    }, 2000)
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.inkFade, fontSize: '.78rem', cursor: 'pointer', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '.3rem' }}>
        ← Back
      </button>
      <h2 style={{ fontFamily: C.serif, fontSize: '1.9rem', fontWeight: 600, color: C.ink, marginBottom: '.5rem', letterSpacing: '-.02em' }}>
        Upload your photo
      </h2>
      <p style={{ color: C.inkFade, fontSize: '.88rem', marginBottom: '2rem', lineHeight: 1.6 }}>
        A photo of your received item helps our AI compare it against the original packing scan. This is the most powerful evidence for fraud detection.
      </p>

      {/* Drop zone */}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? C.gold : preview ? C.gold + '80' : C.sand}`,
        borderRadius: 16, padding: '2rem', cursor: 'pointer',
        background: isDragActive ? '#fffbf2' : preview ? '#fffdf8' : '#fff',
        textAlign: 'center', transition: 'all .2s', marginBottom: '1.5rem',
        minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <input {...getInputProps()} />
        {preview
          ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <img src={preview} alt="" style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
              <div style={{
                position: 'absolute', top: 8, right: 8,
                background: C.gold, color: '#fff',
                fontSize: '.65rem', fontWeight: 600, padding: '.25rem .6rem',
                borderRadius: 4,
              }}>✓ Ready</div>
            </div>
          )
          : (
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '.8rem' }}>📸</div>
              <div style={{ fontFamily: C.serif, fontSize: '1.1rem', color: C.inkLight, marginBottom: '.4rem' }}>
                {isDragActive ? 'Drop your photo here' : 'Photograph your received item'}
              </div>
              <div style={{ fontSize: '.78rem', color: C.inkFade, lineHeight: 1.7 }}>
                Drag & drop or click to select<br />
                <span style={{ fontSize: '.7rem' }}>JPG, PNG, HEIC, MP4 · Max 50MB</span>
              </div>
            </div>
          )
        }
      </div>

      {/* Tips */}
      <div style={{
        padding: '1rem 1.2rem', background: C.parchment,
        border: `1px solid ${C.sand}`, borderRadius: 10,
        fontSize: '.78rem', color: C.inkLight, lineHeight: 1.8,
        marginBottom: '1.5rem',
      }}>
        <strong style={{ color: C.goldDark }}>📷 Photo tips for best results</strong>
        <ul style={{ marginTop: '.4rem', paddingLeft: '1.2rem' }}>
          <li>Show the full item in good lighting</li>
          <li>Include the packaging / box if present</li>
          <li>Capture any damage, missing parts, or seal breaks</li>
          <li>Multiple angles help — take several shots</li>
        </ul>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => onNext({ fraud_risk: 'unknown', message: '📋 Submission received without photo. Our team will review your case.', claim_id: null, tracking: parcel.tracking, name: details.name, email: details.email })}
          style={{ background: 'none', border: 'none', color: C.inkFade, fontSize: '.78rem', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
        >
          Skip — submit without photo
        </button>
        <PrimaryBtn onClick={handleSubmit} loading={loading} disabled={!photo}>
          {!loading && '🔍'} Run AI Analysis
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Step 4: Result ───────────────────────────────────────────────────────────
function StepResult({ result, onReset }) {
  const navigate = useNavigate()
  const isHigh = result.fraud_risk === 'high'
  const isLow = result.fraud_risk === 'low'

  const palette = isHigh
    ? { bg: '#fff8f8', border: C.danger + '30', icon: '🚨', titleColor: C.danger, badgeBg: C.dangerBg, badgeColor: C.danger }
    : isLow
    ? { bg: '#f8fff9', border: C.ok + '30', icon: '✅', titleColor: C.ok, badgeBg: C.okBg, badgeColor: C.ok }
    : { bg: '#fffdf8', border: C.gold + '30', icon: '📋', titleColor: C.goldDark, badgeBg: C.warnBg, badgeColor: C.warn }

  return (
    <div style={{ animation: 'fadeUp .4s ease' }}>
      {/* Result card */}
      <div style={{
        background: palette.bg, border: `1.5px solid ${palette.border}`,
        borderRadius: 16, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{palette.icon}</div>
        <div style={{
          fontFamily: C.serif, fontSize: '1.6rem', fontWeight: 600,
          color: palette.titleColor, letterSpacing: '-.02em', marginBottom: '.6rem',
        }}>
          {isHigh ? 'Fraud Investigation Opened' : isLow ? 'Parcel Looks Clean' : 'Submission Received'}
        </div>
        <p style={{ fontSize: '.88rem', color: C.inkLight, lineHeight: 1.7, maxWidth: 440, margin: '0 auto 1.2rem' }}>
          {result.message}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '.75rem', color: C.inkFade }}>
          <span>Tracking: <strong style={{ color: C.ink }}>{result.tracking}</strong></span>
          <span>Filed by: <strong style={{ color: C.ink }}>{result.name}</strong></span>
          <span>Notified: <strong style={{ color: C.ink }}>{result.email}</strong></span>
        </div>
      </div>

      {/* Claim ID card */}
      {result.claim_id && (
        <div style={{
          background: '#fff', border: `1.5px solid ${C.sand}`,
          borderRadius: 12, padding: '1.2rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFade, marginBottom: '.25rem' }}>
              Your Claim Reference
            </div>
            <div style={{ fontFamily: C.serif, fontSize: '1.4rem', fontWeight: 600, color: C.ink, letterSpacing: '.04em' }}>
              {result.claim_id}
            </div>
            <div style={{ fontSize: '.72rem', color: C.inkFade, marginTop: '.2rem' }}>
              Save this reference — you'll need it to check your claim status
            </div>
          </div>
          <PrimaryBtn onClick={() => navigate(`/claim/${result.claim_id}`)}>
            Check Status →
          </PrimaryBtn>
        </div>
      )}

      {/* What happens next */}
      <div style={{
        background: C.parchment, border: `1px solid ${C.sand}`,
        borderRadius: 12, padding: '1.2rem 1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ fontFamily: C.serif, fontSize: '1rem', fontWeight: 600, color: C.ink, marginBottom: '.8rem' }}>
          What happens next?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {(isHigh ? [
            ['🔍', 'Investigation opened', 'Our fraud team has been alerted and your case is already being reviewed.'],
            ['📧', 'Email confirmation', `A detailed summary has been sent to ${result.email}.`],
            ['⚖️', 'Resolution within 5–7 days', 'If fraud is confirmed, compensation will be processed automatically.'],
          ] : isLow ? [
            ['✅', 'No action needed', 'Our AI found no anomalies. Your parcel appears to have arrived correctly.'],
            ['📧', 'Confirmation email sent', `A summary has been sent to ${result.email}.`],
          ] : [
            ['👀', 'Manual review queued', 'Our team will review your submission within 24 hours.'],
            ['📧', 'Email confirmation sent', `We\'ll update you at ${result.email}.`],
          ]).map(([icon, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: '.8rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 600, color: C.ink }}>{title}</div>
                <div style={{ fontSize: '.74rem', color: C.inkFade, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={onReset} style={{
          background: 'none', border: `1px solid ${C.sand}`, borderRadius: 8,
          padding: '.6rem 1.4rem', fontSize: '.78rem', color: C.inkFade,
          cursor: 'pointer', fontFamily: C.sans,
        }}>
          Track another package
        </button>
      </div>
    </div>
  )
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────
export default function CustomerHome() {
  const [step, setStep] = useState(1)
  const [parcel, setParcel] = useState(null)
  const [details, setDetails] = useState(null)
  const [result, setResult] = useState(null)

  function reset() {
    setStep(1); setParcel(null); setDetails(null); setResult(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: C.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,300&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        input::placeholder,textarea::placeholder{color:#b0a090;}
      `}</style>

      {/* Top nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(250,248,244,.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.sand}`,
        padding: '.9rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📦</span>
          <div>
            <span style={{ fontFamily: C.serif, fontSize: '1.05rem', fontWeight: 600, color: C.ink }}>
              Parcel<span style={{ color: C.gold }}>Guard</span>
            </span>
            <span style={{ fontSize: '.6rem', color: C.inkFade, marginLeft: '.6rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Customer Portal
            </span>
          </div>
        </div>
        <div style={{ fontSize: '.72rem', color: C.inkFade, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.ok, display: 'inline-block' }} />
          All systems operational
        </div>
      </nav>

      {/* Hero band — only on step 1 */}
      {step === 1 && (
        <div style={{
          background: `linear-gradient(135deg, ${C.navy} 0%, #2a3a5a 60%, #1e3050 100%)`,
          padding: '4rem 2rem 5rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative rings */}
          {[180, 280, 380].map((size, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size, height: size, borderRadius: '50%',
              border: `1px solid rgba(198,145,74,${0.08 - i * 0.02})`,
              pointerEvents: 'none',
            }} />
          ))}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-block', fontSize: '.65rem', fontWeight: 600,
              letterSpacing: '.15em', textTransform: 'uppercase',
              color: C.goldLight, marginBottom: '1rem',
              background: 'rgba(198,145,74,.12)', padding: '.35rem .9rem',
              borderRadius: 20, border: '1px solid rgba(198,145,74,.25)',
            }}>
              Secure Parcel Verification
            </div>
            <h1 style={{
              fontFamily: C.serif, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 300, color: '#f5f0e8',
              letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: '1rem',
            }}>
              Did your package arrive<br />
              <em style={{ fontWeight: 600, color: C.goldLight }}>as expected?</em>
            </h1>
            <p style={{ fontSize: '.92rem', color: 'rgba(255,255,255,.6)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
              Track your parcel and report any discrepancies. Our AI compares your received item against the original packing scan.
            </p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div style={{
        maxWidth: 620,
        margin: step === 1 ? '-3rem auto 4rem' : '3rem auto 4rem',
        padding: '0 1.5rem',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '2.5rem',
          boxShadow: '0 4px 40px rgba(26,22,18,.08), 0 1px 4px rgba(26,22,18,.04)',
          border: `1px solid ${C.sand}`,
        }}>
          {step < 4 && <ProgressBar step={step} />}

          {step === 1 && <StepTrack onNext={p => { setParcel(p); setStep(2) }} />}
          {step === 2 && <StepDetails parcel={parcel} onNext={d => { setDetails(d); setStep(3) }} onBack={() => setStep(1)} />}
          {step === 3 && <StepUpload parcel={parcel} details={details} onNext={r => { setResult(r); setStep(4) }} onBack={() => setStep(2)} />}
          {step === 4 && <StepResult result={result} onReset={reset} />}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${C.sand}`, padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '.7rem', color: C.inkFade,
      }}>
        <span>© 2024 ParcelGuard · Powered by AI Fraud Detection</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>Support</span>
        </div>
      </footer>
    </div>
  )
}
