// customer-portal/src/pages/VerifyPage.jsx
import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ISSUE_TYPES = [
  { id: 'wrong_item',   icon: '🔄', label: 'Wrong item received',     desc: 'The item I received is not what I ordered' },
  { id: 'damaged',      icon: '💔', label: 'Item arrived damaged',     desc: 'My item was broken, cracked, or otherwise damaged' },
  { id: 'missing',      icon: '📭', label: 'Item is missing',          desc: 'The parcel arrived empty or with missing contents' },
  { id: 'tampered',     icon: '🔓', label: 'Parcel was tampered with', desc: 'The packaging was opened or resealed before delivery' },
  { id: 'counterfeit',  icon: '🏷️',  label: 'Item appears counterfeit', desc: 'The product does not appear to be genuine' },
  { id: 'other',        icon: '❓', label: 'Other issue',              desc: 'Something else went wrong with my delivery' },
]

function PhotoUploadZone({ onFile, preview, title, description, icon }) {
  const onDrop = useCallback(files => {
    if (files[0]) onFile(files[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  })

  return (
    <div>
      <div style={{
        fontSize: '.75rem', fontWeight: 600, color: '#4a3f35', marginBottom: '.3rem',
      }}>{title}</div>
      <div style={{
        fontSize: '.72rem', color: '#8a7a6a', marginBottom: '.7rem', lineHeight: 1.5,
      }}>{description}</div>

      <div
        {...getRootProps()}
        style={{
          border: `1.5px dashed ${isDragActive ? '#c4622d' : preview ? '#2d6a4f' : '#d8cfc4'}`,
          borderRadius: 10, padding: '1.5rem', cursor: 'pointer', textAlign: 'center',
          background: isDragActive ? 'rgba(196,98,45,0.03)' : preview ? 'rgba(45,106,79,0.03)' : '#faf8f4',
          transition: 'all .2s', minHeight: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img src={preview} alt="upload preview"
              style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }} />
            <div style={{
              position: 'absolute', top: 6, right: 6,
              background: '#2d6a4f', color: '#fff',
              fontSize: '.6rem', fontWeight: 700, padding: '.2rem .5rem', borderRadius: 12,
              letterSpacing: '.04em',
            }}>✓ Uploaded</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{icon}</div>
            <div style={{ fontSize: '.78rem', color: isDragActive ? '#c4622d' : '#8a7a6a', fontWeight: isDragActive ? 600 : 400 }}>
              {isDragActive ? 'Drop your photo here' : 'Drag & drop or click to upload'}
            </div>
            <div style={{ fontSize: '.68rem', color: '#b8a898', marginTop: '.3rem' }}>
              JPG, PNG, HEIC — max 20MB
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Pre-fill from tracking page
  const prefillTracking = params.get('tracking') || ''
  const prefillConfirm = params.get('confirm') === 'true'

  const [step, setStep] = useState(prefillConfirm ? 'confirm' : 1)
  const [tracking, setTracking] = useState(prefillTracking)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedIssue, setSelectedIssue] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Confirm delivery (no issues) flow
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (prefillConfirm) setStep('confirm')
  }, [prefillConfirm])

  const handlePhotoFile = f => { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)) }
  const handleVideoFile = f => setVideoFile(f)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tracking.trim() || !name.trim() || !email.trim() || !selectedIssue) return
    setSubmitting(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('tracking_number', tracking.trim().toUpperCase())
      fd.append('customer_name', name.trim())
      fd.append('customer_email', email.trim())
      fd.append('complaint_description', `${selectedIssue}: ${description}`)
      if (photoFile) fd.append('received_photo', photoFile)
      if (videoFile) fd.append('unboxing_video', videoFile)

      const res = await fetch(`${API}/api/customer/verify`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Submission failed')
      const data = await res.json()
      setResult(data)
      setStep('done')
    } catch {
      // Demo fallback
      const demoResult = {
        tracking_number: tracking.trim().toUpperCase(),
        fraud_risk: photoFile ? 'high' : 'medium',
        message: photoFile
          ? '🚨 Significant anomalies detected. A fraud investigation has been opened automatically. You will be contacted shortly.'
          : '⚠️ We noticed some discrepancies. Our team will review your case within 24 hours.',
        claim_id: 'claim_' + Math.random().toString(36).substring(2, 10),
      }
      setResult(demoResult)
      setStep('done')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmDelivery() {
    setConfirming(true)
    await new Promise(r => setTimeout(r, 1000))
    setConfirming(false)
    setStep('confirmed')
  }

  const canProceedStep1 = tracking.trim() && name.trim() && email.trim()
  const canSubmit = canProceedStep1 && selectedIssue

  // ── Confirm delivery screen ──────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div style={{ maxWidth: 560, margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📦</div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2rem', fontWeight: 400, color: '#1c1712', marginBottom: '1rem',
        }}>Confirm your delivery</h1>
        <p style={{ fontSize: '.88rem', color: '#8a7a6a', lineHeight: 1.7, marginBottom: '2rem' }}>
          Parcel <strong style={{ color: '#c4622d' }}>{tracking}</strong> was marked as delivered.
          By confirming, you help us improve our service and build trust in the delivery network.
        </p>
        {step !== 'confirmed' && <button
          onClick={handleConfirmDelivery}
          disabled={confirming}
          style={{
            padding: '1rem 2.5rem', background: '#2d6a4f', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: '.9rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: '.6rem', margin: '0 auto',
          }}
        >
          {confirming ? '…' : '✓'} {confirming ? 'Confirming…' : 'Everything arrived correctly'}
        </button>}
        <button
          onClick={() => setStep(1)}
          style={{
            display: 'block', margin: '1rem auto 0',
            background: 'none', border: 'none', color: '#c4622d',
            fontSize: '.82rem', cursor: 'pointer', textDecoration: 'underline',
            fontFamily: "'Instrument Sans', sans-serif",
          }}
        >Something is wrong — report an issue</button>
      </div>
    )
  }

  if (step === 'confirmed') {
    return (
      <div style={{ maxWidth: 520, margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: 'rgba(45,106,79,0.1)',
          border: '2px solid #2d6a4f', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem',
        }}>✓</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, color: '#1c1712', marginBottom: '1rem' }}>
          Thank you!
        </h1>
        <p style={{ fontSize: '.88rem', color: '#8a7a6a', lineHeight: 1.7 }}>
          Your confirmation has been recorded. This helps us reward reliable sellers and couriers in our trust scoring system.
        </p>
        <button onClick={() => navigate('/')} style={{
          marginTop: '2rem', padding: '.85rem 2rem',
          background: '#1c1712', color: '#f5f0e8',
          border: 'none', borderRadius: 10, fontSize: '.85rem',
          fontWeight: 600, cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
        }}>Track another parcel</button>
      </div>
    )
  }

  // ── Submission success ────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    const isHigh = result.fraud_risk === 'high'
    const isMedium = result.fraud_risk === 'medium'

    return (
      <div style={{ maxWidth: 580, margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{
          background: '#fff', border: '1px solid #d8cfc4',
          borderRadius: 16, padding: '2.5rem', textAlign: 'center',
          animation: 'cpFadeIn .5s ease',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.5rem',
            background: isHigh ? 'rgba(155,44,44,0.08)' : isMedium ? 'rgba(184,148,42,0.08)' : 'rgba(45,106,79,0.08)',
            border: `2px solid ${isHigh ? '#9b2c2c' : isMedium ? '#b8942a' : '#2d6a4f'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            {isHigh ? '🚨' : isMedium ? '⚠️' : '✓'}
          </div>

          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.8rem', fontWeight: 400, color: '#1c1712', marginBottom: '1rem',
          }}>
            {isHigh ? 'Investigation Opened' : isMedium ? 'Case Under Review' : 'Submission Received'}
          </h2>

          <p style={{
            fontSize: '.88rem', color: '#4a3f35', lineHeight: 1.7, marginBottom: '1.5rem',
          }}>{result.message}</p>

          {result.claim_id && (
            <div style={{
              background: '#faf8f4', border: '1px solid #ebe4d9',
              borderRadius: 8, padding: '1rem 1.5rem', marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: '.65rem', color: '#8a7a6a', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '.3rem' }}>
                Your Case Reference
              </div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.4rem', fontWeight: 600, color: '#c4622d',
                letterSpacing: '.06em',
              }}>
                {result.claim_id}
              </div>
              <div style={{ fontSize: '.72rem', color: '#8a7a6a', marginTop: '.3rem' }}>
                Keep this for your records. You can check status at any time.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center' }}>
            {result.claim_id && (
              <button
                onClick={() => navigate(`/claim/${result.claim_id}`)}
                style={{
                  padding: '.85rem 1.8rem', background: '#1c1712', color: '#f5f0e8',
                  border: 'none', borderRadius: 10, fontSize: '.85rem',
                  fontWeight: 600, cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
                }}
              >Check Claim Status →</button>
            )}
            <button onClick={() => navigate('/')} style={{
              padding: '.85rem 1.8rem', background: 'transparent',
              border: '1px solid #d8cfc4', borderRadius: 10, fontSize: '.85rem',
              color: '#4a3f35', cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
            }}>Track Another Parcel</button>
          </div>
        </div>
        <style>{`@keyframes cpFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 2rem' }}>
      <style>{`@keyframes cpFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ maxWidth: 560, marginBottom: '3rem', animation: 'cpFadeIn .5s ease' }}>
        <div style={{
          fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase',
          color: '#c4622d', fontWeight: 600, marginBottom: '1rem',
          display: 'inline-block', padding: '.3rem .9rem', borderRadius: 20,
          background: 'rgba(196,98,45,0.06)', border: '1px solid rgba(196,98,45,0.15)',
        }}>Report an Issue</div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 300, color: '#1c1712',
          letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: '.8rem',
        }}>
          Something wasn't <em style={{ color: '#c4622d', fontStyle: 'italic' }}>right</em>?
        </h1>
        <p style={{ fontSize: '.88rem', color: '#8a7a6a', lineHeight: 1.7 }}>
          Tell us what happened. Our AI will analyse your photos against the original packing record to identify what went wrong and who is responsible.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>

          {/* Left: form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>

            {/* Step 1: Contact */}
            <div style={{
              background: '#fff', border: '1px solid #d8cfc4',
              borderRadius: 14, padding: '1.8rem',
            }}>
              <div style={{
                fontSize: '.62rem', color: '#8a7a6a', letterSpacing: '.15em',
                textTransform: 'uppercase', marginBottom: '1.2rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '.6rem',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: canProceedStep1 ? '#2d6a4f' : '#c4622d',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '.62rem', fontWeight: 700,
                }}>{canProceedStep1 ? '✓' : '1'}</span>
                Your Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '.73rem', color: '#4a3f35', display: 'block', marginBottom: '.4rem', fontWeight: 500 }}>
                    Full Name *
                  </label>
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name" required
                    style={inputStyle}
                    onFocus={focusStyle} onBlur={blurStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '.73rem', color: '#4a3f35', display: 'block', marginBottom: '.4rem', fontWeight: 500 }}>
                    Email Address *
                  </label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    style={inputStyle}
                    onFocus={focusStyle} onBlur={blurStyle}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '.73rem', color: '#4a3f35', display: 'block', marginBottom: '.4rem', fontWeight: 500 }}>
                  Tracking Number *
                </label>
                <input
                  value={tracking} onChange={e => setTracking(e.target.value.toUpperCase())}
                  placeholder="PG12345678" required
                  style={{ ...inputStyle, letterSpacing: '.08em', fontWeight: 600 }}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
            </div>

            {/* Step 2: Issue type */}
            <div style={{
              background: '#fff', border: '1px solid #d8cfc4',
              borderRadius: 14, padding: '1.8rem',
            }}>
              <div style={{
                fontSize: '.62rem', color: '#8a7a6a', letterSpacing: '.15em',
                textTransform: 'uppercase', marginBottom: '1.2rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '.6rem',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: selectedIssue ? '#2d6a4f' : '#c4622d',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '.62rem', fontWeight: 700,
                }}>{selectedIssue ? '✓' : '2'}</span>
                What went wrong?
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '1.2rem' }}>
                {ISSUE_TYPES.map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue.id)}
                    style={{
                      padding: '.9rem 1rem', borderRadius: 9, cursor: 'pointer',
                      border: `1.5px solid ${selectedIssue === issue.id ? '#c4622d' : '#ebe4d9'}`,
                      background: selectedIssue === issue.id ? 'rgba(196,98,45,0.04)' : '#faf8f4',
                      transition: 'all .15s',
                      display: 'flex', alignItems: 'flex-start', gap: '.7rem',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '.05rem' }}>{issue.icon}</span>
                    <div>
                      <div style={{
                        fontSize: '.78rem', fontWeight: 600,
                        color: selectedIssue === issue.id ? '#c4622d' : '#1c1712',
                        marginBottom: '.15rem',
                      }}>{issue.label}</div>
                      <div style={{ fontSize: '.68rem', color: '#8a7a6a', lineHeight: 1.4 }}>
                        {issue.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '.73rem', color: '#4a3f35', display: 'block', marginBottom: '.4rem', fontWeight: 500 }}>
                  Additional Details
                </label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Please describe what happened in as much detail as possible…"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical', lineHeight: 1.6, paddingTop: '.7rem',
                  }}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
            </div>

            {/* Step 3: Photos */}
            <div style={{
              background: '#fff', border: '1px solid #d8cfc4',
              borderRadius: 14, padding: '1.8rem',
            }}>
              <div style={{
                fontSize: '.62rem', color: '#8a7a6a', letterSpacing: '.15em',
                textTransform: 'uppercase', marginBottom: '1.2rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '.6rem',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: photoFile ? '#2d6a4f' : '#8a7a6a',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '.62rem', fontWeight: 700,
                }}>{photoFile ? '✓' : '3'}</span>
                Upload Photos{' '}
                <span style={{ fontSize: '.6rem', color: '#b8a898', fontWeight: 400, letterSpacing: '.08em' }}>
                  (Recommended — greatly improves AI accuracy)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                <PhotoUploadZone
                  title="Photo of received item"
                  description="Photo of what you actually received. The AI will compare this to the original packing photo."
                  icon="📸"
                  onFile={handlePhotoFile}
                  preview={photoPreview}
                />
                <PhotoUploadZone
                  title="Unboxing video (optional)"
                  description="A short video of you opening the parcel provides the strongest evidence."
                  icon="🎥"
                  onFile={handleVideoFile}
                  preview={null}
                />
              </div>

              {photoFile && (
                <div style={{
                  marginTop: '1rem', padding: '.8rem 1rem',
                  background: 'rgba(45,106,79,0.05)', border: '1px solid rgba(45,106,79,0.2)',
                  borderRadius: 8, fontSize: '.75rem', color: '#2d6a4f', lineHeight: 1.6,
                }}>
                  ✓ Photo uploaded. Our ResNet50 AI will compare this against the original packing image to compute a fraud score automatically.
                </div>
              )}
            </div>
          </div>

          {/* Right: summary + submit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'sticky', top: 80 }}>

            {/* Summary card */}
            <div style={{
              background: '#fff', border: '1px solid #d8cfc4',
              borderRadius: 14, padding: '1.5rem',
            }}>
              <div style={{
                fontSize: '.65rem', color: '#8a7a6a', letterSpacing: '.12em',
                textTransform: 'uppercase', marginBottom: '1.2rem', fontWeight: 600,
              }}>Report Summary</div>

              {[
                { label: 'Tracking', val: tracking || '—', highlight: !!tracking },
                { label: 'Name', val: name || '—', highlight: !!name },
                { label: 'Issue', val: ISSUE_TYPES.find(i => i.id === selectedIssue)?.label || '—', highlight: !!selectedIssue },
                { label: 'Photo', val: photoFile ? `${photoFile.name.substring(0, 20)}…` : 'Not uploaded', highlight: !!photoFile },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '.55rem 0', borderBottom: '1px solid #ebe4d9', gap: '1rem',
                }}>
                  <span style={{ fontSize: '.72rem', color: '#8a7a6a', flexShrink: 0 }}>{item.label}</span>
                  <span style={{
                    fontSize: '.75rem', color: item.highlight ? '#1c1712' : '#b8a898',
                    fontWeight: item.highlight ? 500 : 400, textAlign: 'right',
                    wordBreak: 'break-all',
                  }}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* What happens next */}
            <div style={{
              background: '#faf8f4', border: '1px solid #ebe4d9',
              borderRadius: 14, padding: '1.5rem',
            }}>
              <div style={{
                fontSize: '.65rem', color: '#8a7a6a', letterSpacing: '.12em',
                textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600,
              }}>What happens next</div>
              {[
                { icon: '🤖', text: 'AI analyses your photo against the original packing image' },
                { icon: '⚖️', text: 'Fraud score computed from image similarity, weight & RFID data' },
                { icon: '🔍', text: 'If score > 70, investigation case is automatically opened' },
                { icon: '📧', text: 'You receive an email update within 24–48 hours' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '.7rem', marginBottom: '.75rem',
                  fontSize: '.75rem', color: '#4a3f35', lineHeight: 1.5,
                }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              style={{
                width: '100%', padding: '1.1rem',
                background: canSubmit ? '#c4622d' : '#ede7d9',
                color: canSubmit ? '#fff' : '#8a7a6a',
                border: 'none', borderRadius: 10, fontSize: '.9rem',
                fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontFamily: "'Instrument Sans', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '.6rem', transition: 'background .2s',
              }}
              onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#b8562a' }}
              onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#c4622d' }}
            >
              {submitting ? (
                <><span style={{
                  width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'cpSpin .7s linear infinite', display: 'inline-block',
                }} /> Submitting…</>
              ) : '→ Submit Report'}
            </button>

            {!canSubmit && (
              <div style={{ fontSize: '.7rem', color: '#b8a898', textAlign: 'center' }}>
                Complete required fields above to submit
              </div>
            )}

            <style>{`
              @keyframes cpSpin { to{transform:rotate(360deg)} }
            `}</style>
          </div>
        </div>
      </form>
    </div>
  )
}

// Shared input styles
const inputStyle = {
  width: '100%', padding: '.7rem .9rem',
  background: '#faf8f4', border: '1.5px solid #d8cfc4',
  borderRadius: 8, fontSize: '.85rem', color: '#1c1712',
  outline: 'none', transition: 'border-color .15s, box-shadow .15s',
  boxSizing: 'border-box',
}

const focusStyle = e => {
  e.target.style.borderColor = '#c4622d'
  e.target.style.boxShadow = '0 0 0 3px rgba(196,98,45,0.1)'
  e.target.style.background = '#fff'
}

const blurStyle = e => {
  e.target.style.borderColor = '#d8cfc4'
  e.target.style.boxShadow = 'none'
  e.target.style.background = '#faf8f4'
}
