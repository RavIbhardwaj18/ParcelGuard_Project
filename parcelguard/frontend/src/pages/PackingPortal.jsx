// frontend/src/pages/PackingPortal.jsx
import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { parcelsApi, verificationApi } from '../api/parcels'

const S = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem' },
  label: { fontSize: '0.73rem', fontWeight: 600, color: 'var(--tx2)', marginBottom: '0.4rem', display: 'block' },
  input: {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '0.65rem 0.85rem', color: 'var(--tx)',
    fontSize: '0.85rem', outline: 'none', transition: 'border-color .15s, box-shadow .15s',
  },
}

function Label({ children, required }) {
  return <label style={S.label}>{children}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}</label>
}

function Input({ ...props }) {
  const [f, setF] = useState(false)
  return (
    <input {...props} style={{ ...S.input, borderColor: f ? 'var(--accent)' : 'var(--border)', boxShadow: f ? '0 0 0 3px var(--accent-bg)' : 'none', ...props.style }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  )
}

function Sel({ children, ...props }) {
  const [f, setF] = useState(false)
  return (
    <select {...props} style={{
      ...S.input, cursor: 'pointer', appearance: 'none',
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px',
      paddingRight: '2.2rem', borderColor: f ? 'var(--accent)' : 'var(--border)',
      boxShadow: f ? '0 0 0 3px var(--accent-bg)' : 'none', ...props.style,
    }} onFocus={() => setF(true)} onBlur={() => setF(false)}>{children}</select>
  )
}

function SecHead({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem', paddingBottom: '0.9rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--tx)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.67rem', color: 'var(--tx3)', marginTop: '0.1rem' }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function Badge({ children, color = 'default' }) {
  const C = { green: ['var(--green-bg)','var(--green-bd)','var(--green)'], amber: ['var(--amber-bg)','var(--amber-bd)','var(--amber)'], red: ['var(--red-bg)','var(--red-bd)','var(--red)'], blue: ['var(--blue-bg)','var(--blue-bd)','var(--blue)'], default: ['var(--surface3)','var(--border2)','var(--tx2)'] }
  const [bg, bd, tx] = C[color] || C.default
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: bg, border: `1px solid ${bd}`, color: tx }}>{children}</span>
}

function DropZone({ label, subtitle, icon, onFile, preview }) {
  const onDrop = useCallback(files => { if (files[0]) onFile(files[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 })
  return (
    <div>
      <Label>{label}</Label>
      {subtitle && <div style={{ fontSize: '0.66rem', color: 'var(--tx3)', marginBottom: '0.5rem' }}>{subtitle}</div>}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? 'var(--accent)' : preview ? 'var(--green)' : 'var(--border2)'}`,
        borderRadius: 10, padding: '1.2rem', cursor: 'pointer', textAlign: 'center',
        background: isDragActive ? 'var(--accent-bg)' : preview ? 'var(--green-bg)' : 'var(--surface2)',
        transition: 'all .15s', minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <input {...getInputProps()} />
        {preview ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img src={preview} alt="preview" style={{ maxHeight: 110, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }} />
            <span style={{ position: 'absolute', top: -4, right: 0, background: 'var(--green)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 5 }}>✓ Uploaded</span>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{icon}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tx2)', fontWeight: 500 }}>{isDragActive ? 'Drop it here' : 'Drag & drop or click to upload'}</div>
            <div style={{ fontSize: '0.63rem', color: 'var(--tx3)', marginTop: '0.25rem' }}>PNG, JPG up to 50MB</div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontSize: '1.7rem', fontWeight: 700, fontFamily: 'var(--display)', color: color || 'var(--tx)', lineHeight: 1 }}>{value}</span>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--tx3)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function ParcelRow({ parcel, onAnalyze }) {
  const riskM = { low:'green', medium:'amber', high:'red', unknown:'default' }
  const statusM = { packed:'Packed', picked_up:'Picked Up', in_transit:'In Transit', delivered:'Delivered', disputed:'Disputed', investigation:'Investigation' }
  const [hov, setHov] = useState(false)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 120px 80px 70px 90px', gap: '0.75rem', alignItems: 'center', padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', background: hov ? 'var(--surface2)' : 'transparent', transition: 'background .1s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-l)', fontFamily: 'var(--mono)' }}>{parcel.tracking_number}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--tx3)', marginTop: '0.15rem' }}>{parcel.item_description || '—'}</div>
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>{parcel.declared_weight_kg} kg</div>
      <div><Badge>{statusM[parcel.status] || parcel.status}</Badge></div>
      <div><Badge color={riskM[parcel.fraud_risk] || 'default'}>{(parcel.fraud_risk || 'N/A').toUpperCase()}</Badge></div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--tx2)' }}>{parcel.fraud_score != null ? parcel.fraud_score.toFixed(1) : '—'}</div>
      <div>
        <button onClick={() => onAnalyze(parcel.id)} style={{ padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', color: 'var(--accent-l)', cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => { e.target.style.background='var(--accent)'; e.target.style.color='#fff' }}
          onMouseLeave={e => { e.target.style.background='var(--accent-bg)'; e.target.style.color='var(--accent-l)' }}>
          Analyze
        </button>
      </div>
    </div>
  )
}

export default function PackingPortal() {
  const [tab, setTab] = useState('new')
  const [sellers, setSellers] = useState([])
  const [parcels, setParcels] = useState([])
  const [loadingParcels, setLoadingParcels] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [description, setDescription] = useState('')
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [declaredValue, setDeclaredValue] = useState('')
  const [rfid, setRfid] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [xrayFile, setXrayFile] = useState(null)
  const [packingFile, setPackingFile] = useState(null)
  const [productFile, setProductFile] = useState(null)
  const [xrayPreview, setXrayPreview] = useState(null)
  const [packingPreview, setPackingPreview] = useState(null)
  const [productPreview, setProductPreview] = useState(null)

  useEffect(() => { loadSellers(); loadParcels() }, [])

  async function loadSellers() { try { const data = await verificationApi.getSellers(); setSellers(Array.isArray(data) ? data : []) } catch(e) { console.error(e) } }
  async function loadParcels(q = '') {
    setLoadingParcels(true)
    try { const data = await parcelsApi.list({ search: q, limit: 50 }); setParcels(Array.isArray(data) ? data : data?.items || []) }
    catch {} finally { setLoadingParcels(false) }
  }
  function handleFileWithPreview(file, setFile, setPreview) {
    setFile(file)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }
  function generateRFID() {
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    setRfid('RFID-' + Array.from({ length: 12 }, () => c[Math.floor(Math.random() * c.length)]).join(''))
  }
  function resetForm() {
    setSellerId(''); setDescription(''); setWeight(''); setLength(''); setWidth(''); setHeight('');
    setDeclaredValue(''); setRfid(''); setOrigin(''); setDestination('');
    setXrayFile(null); setPackingFile(null); setXrayPreview(null); setPackingPreview(null)
  }
  async function handleSubmit(e) {
    e.preventDefault()
    if (!sellerId || !weight || !length || !width || !height) { setError('Please fill all required fields.'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('seller_id', sellerId); fd.append('item_description', description)
      fd.append('declared_weight_kg', weight)
      fd.append('declared_length_cm', length)
      fd.append('declared_width_cm', width)
      fd.append('declared_height_cm', height)
      fd.append('declared_value_usd', declaredValue || 0)
      fd.append('rfid_tag', rfid)
      fd.append('origin_city', origin)
      fd.append('origin_country', 'IN')
      fd.append('destination_city', destination)
      fd.append('destination_country', 'IN')
      fd.append('declared_value', declaredValue || 0); fd.append('rfid_tag', rfid)
      fd.append('origin_city', origin); fd.append('destination_city', destination)
      if (xrayFile) fd.append('xray_image', xrayFile)
      if (packingFile) fd.append('packing_image', packingFile)
      if (productFile) fd.append('product_image', productFile)
      const res = await parcelsApi.create(fd)
      setSuccess(res); resetForm(); loadParcels()
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create parcel.') }
    finally { setLoading(false) }
  }
  async function handleAnalyze(id) { try { await parcelsApi.analyze(id); loadParcels() } catch {} }

  const selectedSeller = sellers.find(s => s.id === sellerId)
  const filteredParcels = search ? parcels.filter(p => p.tracking_number?.toLowerCase().includes(search.toLowerCase()) || p.item_description?.toLowerCase().includes(search.toLowerCase())) : parcels
  const checklist = [
    { label: 'Seller selected', ok: !!sellerId }, { label: 'Weight entered', ok: !!weight },
    { label: 'Dimensions entered', ok: !!(length && width && height) }, { label: 'RFID tag assigned', ok: !!rfid },
    { label: 'Packing photo uploaded', ok: !!packingFile }, { label: 'X-Ray uploaded', ok: !!xrayFile }, { label: 'Product photo uploaded', ok: !!productFile },
  ]
  const allReady = checklist.every(c => c.ok)

  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.8rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Packing Portal</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--tx3)' }}>Warehouse intake · Log new parcels · Upload X-ray & packing images</p>
        </div>
        <Badge color="blue">{parcels.length} parcels in system</Badge>
      </div>

      {/* Success banner */}
      {success && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 12, padding: '1.1rem 1.4rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'slideIn .3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--green)' }}>Parcel logged successfully!</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--tx2)', marginTop: '0.15rem' }}>Tracking: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--tx)' }}>{success.tracking_number}</strong></div>
            </div>
          </div>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px', width: 'fit-content' }}>
        {[['new','+ New Parcel'],['list','≡ View All']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '0.5rem 1.1rem', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .12s', background: tab===key ? 'var(--accent)' : 'transparent', color: tab===key ? '#fff' : 'var(--tx2)' }}>{label}</button>
        ))}
      </div>

      {/* New Parcel Form */}
      {tab === 'new' && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.2rem', alignItems: 'start' }}>

            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={S.card}>
                <SecHead icon="🏪" title="Seller Information" />
                <Label required>Select Seller</Label>
                <Sel value={sellerId} onChange={e => setSellerId(e.target.value)} required>
                  <option value="">— Choose a seller —</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Sel>
                {selectedSeller && (
                  <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx)' }}>{selectedSeller.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--tx3)', marginTop: '0.1rem' }}>{selectedSeller.fraud_count || 0} fraud events</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--tx3)', marginBottom: '0.2rem' }}>Trust Score</div>
                      <Badge color={selectedSeller.trust_score >= 70 ? 'green' : selectedSeller.trust_score >= 40 ? 'amber' : 'red'}>{selectedSeller.trust_score?.toFixed(1) || '—'}</Badge>
                    </div>
                  </div>
                )}
              </div>

              <div style={S.card}>
                <SecHead icon="📐" title="Parcel Specifications" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><Label>Item Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Electronics — Smartphone" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><Label required>Weight (kg)</Label><Input type="number" min="0.01" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 1999" required /></div>
                    <div><Label>Declared Value (₹ INR)</Label><Input type="number" min="0" step="0.01" value={declaredValue} onChange={e => setDeclaredValue(e.target.value)} placeholder="e.g. 1999" /></div>
                  </div>
                  <div>
                    <Label required>Dimensions (cm) — L × W × H</Label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.7rem' }}>
                      <Input type="number" min="1" value={length} onChange={e => setLength(e.target.value)} placeholder="Length" required />
                      <Input type="number" min="1" value={width} onChange={e => setWidth(e.target.value)} placeholder="Width" required />
                      <Input type="number" min="1" value={height} onChange={e => setHeight(e.target.value)} placeholder="Height" required />
                    </div>
                  </div>
                </div>
              </div>

              <div style={S.card}>
                <SecHead icon="📡" title="RFID & Route" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <Label>RFID Tag ID</Label>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <Input value={rfid} onChange={e => setRfid(e.target.value)} placeholder="RFID-ABC123XYZ456" style={{ flex: 1 }} />
                      <button type="button" onClick={generateRFID} style={{ padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, background: 'var(--surface3)', border: '1px solid var(--border2)', color: 'var(--tx2)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}
                        onMouseEnter={e => { e.target.style.borderColor='var(--accent)'; e.target.style.color='var(--accent-l)' }}
                        onMouseLeave={e => { e.target.style.borderColor='var(--border2)'; e.target.style.color='var(--tx2)' }}>
                        ⚡ Generate
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><Label>Origin City</Label><Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Mumbai, Maharashtra" /></div>
                    <div><Label>Destination City</Label><Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Bengaluru, Karnataka" /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={S.card}>
                <SecHead icon="📸" title="Photo Upload" subtitle="Used by AI for fraud detection comparison" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <DropZone label="X-Ray Scan Image" subtitle="Security scan of parcel contents" icon="🔬" onFile={f => handleFileWithPreview(f, setXrayFile, setXrayPreview)} preview={xrayPreview} />
                  <DropZone label="Packing Photo" subtitle="Baseline used at every checkpoint" icon="📦" onFile={f => handleFileWithPreview(f, setPackingFile, setPackingPreview)} preview={packingPreview} />
                  <DropZone label="Product Photo" subtitle="Clear photo of the actual product" icon="🛍️" onFile={f => handleFileWithPreview(f, setProductFile, setProductPreview)} preview={productPreview} />
                  <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 8, padding: '0.75rem 0.9rem', fontSize: '0.72rem', color: 'var(--amber)', lineHeight: 1.6 }}>
                    <strong>⚠ Important:</strong> The packing photo is the AI baseline compared against courier checkpoint scans and the customer's received-item photo.
                  </div>
                </div>
              </div>

              <div style={S.card}>
                <SecHead icon="✅" title="Submit Parcel" />
                {error && <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 8, padding: '0.7rem', fontSize: '0.78rem', color: 'var(--red)', marginBottom: '1rem' }}>✗ {error}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.2rem' }}>
                  {checklist.map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', background: item.ok ? 'var(--green-bg)' : 'var(--surface3)', border: `1px solid ${item.ok ? 'var(--green-bd)' : 'var(--border)'}`, color: item.ok ? 'var(--green)' : 'var(--tx3)' }}>{item.ok ? '✓' : ''}</div>
                      <span style={{ fontSize: '0.75rem', color: item.ok ? 'var(--tx)' : 'var(--tx3)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.85rem', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', background: loading ? 'var(--surface3)' : allReady ? 'var(--accent)' : 'var(--surface3)', color: loading ? 'var(--tx3)' : allReady ? '#fff' : 'var(--tx3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: allReady && !loading ? '0 4px 14px rgba(99,102,241,.4)' : 'none' }}>
                  {loading ? (<><span style={{ width: 16, height: 16, border: '2px solid var(--border2)', borderTopColor: 'var(--accent-l)', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />Logging parcel...</>) : '📦 Log Parcel to System'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <StatCard label="Total Parcels" value={parcels.length} icon="📦" />
                <StatCard label="High Risk" value={parcels.filter(p => p.fraud_risk === 'high').length} color="var(--red)" icon="⚠️" />
                <StatCard label="Investigating" value={parcels.filter(p => p.status === 'investigation').length} color="var(--amber)" icon="🔍" />
                <StatCard label="Clean" value={parcels.filter(p => p.fraud_risk === 'low').length} color="var(--green)" icon="✅" />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* List tab */}
      {tab === 'list' && (
        <div style={S.card}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem' }}>
            <Input value={search} onChange={e => { setSearch(e.target.value); loadParcels(e.target.value) }} placeholder="Search tracking number or item..." style={{ maxWidth: 340 }} />
            <button onClick={() => loadParcels(search)} style={{ padding: '0.65rem 1.1rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--tx2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>↻ Refresh</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 120px 80px 70px 90px', gap: '0.75rem', padding: '0.6rem 1rem', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--tx3)', borderBottom: '2px solid var(--border)' }}>
            <span>Parcel / Description</span><span>Weight</span><span>Status</span><span>Risk</span><span>Score</span><span>Action</span>
          </div>
          {loadingParcels ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--tx3)' }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 0.8rem' }} />Loading parcels...
            </div>
          ) : filteredParcels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--tx3)' }}><div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>📭</div>No parcels found</div>
          ) : filteredParcels.map(p => <ParcelRow key={p.id} parcel={p} onAnalyze={handleAnalyze} />)}
        </div>
      )}
    </div>
  )
}