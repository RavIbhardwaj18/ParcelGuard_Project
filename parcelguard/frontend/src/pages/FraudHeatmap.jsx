// frontend/src/pages/FraudHeatmap.jsx
// Uses react-leaflet (already in package.json) with a dark CartoDB tile layer
import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'

// ─── Tokens ────────────────────────────────────────────────────────────────────
const S = {
  bg: '#04060a', s1: '#080c12', s2: '#0c1018', bd: '#0f1c2a', bd2: '#162538',
  red: '#ff3333', redGlow: 'rgba(255,51,51,.6)',
  orange: '#ff8c00', orangeGlow: 'rgba(255,140,0,.5)',
  yellow: '#ffcc00', yellowGlow: 'rgba(255,204,0,.4)',
  green: '#00ff88', greenGlow: 'rgba(0,255,136,.4)',
  cyan: '#00d4ff',
  tx: '#c8dce8', tx2: '#6a8898', tx3: '#2a4050',
  font: "'Share Tech Mono', monospace",
  title: "'Black Ops One', cursive",
}

// ─── Mock hotspot data (lat, lng, city, fraud_count, severity) ─────────────────
const HOTSPOTS = [
  { id:1,  city:'Mumbai, Maharashtra',    lat:19.076,  lng:72.877,  count:14, risk:'critical' },
  { id:2,  city:'Delhi, NCT',             lat:28.613,  lng:77.209,  count:11, risk:'critical' },
  { id:3,  city:'Bengaluru, Karnataka',   lat:12.971,  lng:77.594,  count:9,  risk:'high' },
  { id:4,  city:'Kolkata, West Bengal',   lat:22.572,  lng:88.363,  count:8,  risk:'high' },
  { id:5,  city:'Hyderabad, Telangana',   lat:17.385,  lng:78.486,  count:7,  risk:'high' },
  { id:6,  city:'Chennai, Tamil Nadu',    lat:13.082,  lng:80.270,  count:6,  risk:'high' },
  { id:7,  city:'Jaipur, Rajasthan',      lat:26.912,  lng:75.787,  count:5,  risk:'medium' },
  { id:8,  city:'Pune, Maharashtra',      lat:18.520,  lng:73.856,  count:4,  risk:'medium' },
  { id:9,  city:'Ahmedabad, Gujarat',     lat:23.022,  lng:72.571,  count:4,  risk:'medium' },
  { id:10, city:'Surat, Gujarat',         lat:21.170,  lng:72.831,  count:3,  risk:'medium' },
  { id:11, city:'Lucknow, Uttar Pradesh', lat:26.846,  lng:80.946,  count:3,  risk:'medium' },
  { id:12, city:'Kochi, Kerala',          lat:9.931,   lng:76.267,  count:2,  risk:'low' },
  { id:13, city:'Nagpur, Maharashtra',    lat:21.145,  lng:79.081,  count:2,  risk:'low' },
  { id:14, city:'Indore, Madhya Pradesh', lat:22.719,  lng:75.857,  count:1,  risk:'low' },
  { id:15, city:'Bhopal, Madhya Pradesh', lat:23.259,  lng:77.412,  count:1,  risk:'low' },
]

const RISK_COLORS = {
  critical: { fill: '#ff3333', border: '#ff6666', glow: 'rgba(255,51,51,.5)',   label: 'CRITICAL' },
  high:     { fill: '#ff8c00', border: '#ffaa44', glow: 'rgba(255,140,0,.45)',  label: 'HIGH' },
  medium:   { fill: '#ffcc00', border: '#ffe066', glow: 'rgba(255,204,0,.4)',   label: 'MEDIUM' },
  low:      { fill: '#00ff88', border: '#66ffbb', glow: 'rgba(0,255,136,.35)',  label: 'LOW' },
}

const FRAUD_TYPES_DIST = [
  ['Courier Fraud',    38, '#ff3333'],
  ['Multi-Signal',     25, '#ff8c00'],
  ['RFID Mismatch',    18, '#ffcc00'],
  ['Weight Fraud',     12, '#00d4ff'],
  ['Seller Fraud',     7,  '#00ff88'],
]

function riskRadius(count) {
  return Math.max(10, Math.min(40, 8 + count * 2.5))
}

// Auto-fit map to hotspot bounds
function MapFitter() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(
      HOTSPOTS.map(h => [h.lat, h.lng]),
      { padding: [40, 40] }
    )
  }, [map])
  return null
}

// ─── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 20, zIndex: 1000,
      background: 'rgba(4,6,10,.88)', backdropFilter: 'blur(8px)',
      border: `1px solid ${S.bd2}`, borderRadius: 8, padding: '.8rem 1rem',
    }}>
      <div style={{ fontSize: '.52rem', color: S.tx2, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '.55rem', fontFamily: S.font }}>
        Risk Level
      </div>
      {Object.entries(RISK_COLORS).map(([key, val]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.fill, boxShadow: `0 0 6px ${val.glow}`, flexShrink: 0 }} />
          <span style={{ fontSize: '.6rem', color: S.tx2, fontFamily: S.font }}>{val.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Sidebar panels ────────────────────────────────────────────────────────────
function HotspotRank({ hotspots, selected, onSelect }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {[...hotspots].sort((a, b) => b.count - a.count).map((h, i) => {
        const rc = RISK_COLORS[h.risk]
        const isSelected = selected?.id === h.id
        return (
          <div key={h.id} onClick={() => onSelect(h)}
            style={{
              display: 'flex', alignItems: 'center', gap: '.6rem',
              padding: '.55rem .9rem', cursor: 'pointer', borderBottom: `1px solid ${S.bd}`,
              borderLeft: `2px solid ${isSelected ? rc.fill : 'transparent'}`,
              background: isSelected ? `${rc.fill}10` : 'transparent',
              transition: 'all .12s',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.02)' }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ fontFamily: S.title, fontSize: '.85rem', color: i < 3 ? rc.fill : S.tx3, width: 18, textAlign: 'center', flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.68rem', color: S.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.city}</div>
              <div style={{ fontSize: '.55rem', color: S.tx3, marginTop: '.1rem' }}>
                <span style={{ color: rc.fill }}>{rc.label}</span> · {h.count} events
              </div>
            </div>
            <div style={{
              fontFamily: S.title, fontSize: '1.1rem', color: rc.fill,
              textShadow: `0 0 8px ${rc.glow}`, flexShrink: 0,
            }}>{h.count}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FraudHeatmap() {
  const [selected, setSelected] = useState(null)
  const [filterRisk, setFilterRisk] = useState('all')
  const [mapRef, setMapRef] = useState(null)

  const totalEvents = HOTSPOTS.reduce((s, h) => s + h.count, 0)
  const criticalCount = HOTSPOTS.filter(h => h.risk === 'critical').length

  const filtered = filterRisk === 'all' ? HOTSPOTS : HOTSPOTS.filter(h => h.risk === filterRisk)

  function flyTo(h) {
    setSelected(h)
    if (mapRef) mapRef.flyTo([h.lat, h.lng], 8, { duration: 1 })
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: S.bg, color: S.tx, fontFamily: S.font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Black+Ops+One&display=swap');
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.15)}}
        @keyframes sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:${S.bd2};border-radius:2px;}
        .leaflet-container{background:#04060a !important;}
        .leaflet-tile{filter:brightness(.55) saturate(.4) hue-rotate(200deg);}
        select option{background:${S.s1};}
      `}</style>

      {/* Header */}
      <div style={{ padding: '.85rem 2rem', borderBottom: `1px solid ${S.bd}`, background: S.s1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: S.title, fontSize: '1.7rem', color: S.tx, margin: 0, letterSpacing: '.06em' }}>🗺️ FRAUD THREAT MAP</h1>
          <p style={{ fontSize: '.55rem', color: S.tx3, margin: '.1rem 0 0', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Geographic Intelligence · Fraud Event Distribution · Risk Zones
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.7rem' }}>
          {[['TOTAL EVENTS', totalEvents, S.red], ['CRITICAL ZONES', criticalCount, S.orange], ['CITIES AFFECTED', HOTSPOTS.length, S.cyan]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: '.38rem .8rem', background: S.s2, border: `1px solid ${S.bd2}`, borderRadius: 7, minWidth: 75 }}>
              <div style={{ fontFamily: S.title, fontSize: '1.2rem', color: c, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: '.48rem', color: S.tx3, letterSpacing: '.07em', marginTop: '.08rem' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: 0 }}>

        {/* Map */}
        <div style={{ position: 'relative' }}>
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            ref={setMapRef}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <MapFitter />
            {filtered.map(h => {
              const rc = RISK_COLORS[h.risk]
              const r = riskRadius(h.count)
              return (
                <CircleMarker key={h.id} center={[h.lat, h.lng]}
                  radius={r}
                  pathOptions={{
                    color: rc.border, fillColor: rc.fill, fillOpacity: 0.35,
                    weight: 1.5, opacity: 0.8,
                  }}
                  eventHandlers={{ click: () => flyTo(h) }}
                >
                  <Tooltip direction="top" offset={[0, -r]} opacity={0.95}
                    className="fraud-tooltip"
                  >
                    <div style={{ fontFamily: S.font, background: S.s1, border: `1px solid ${rc.fill}40`, borderRadius: 6, padding: '.5rem .7rem', fontSize: '.65rem', color: S.tx, minWidth: 140 }}>
                      <div style={{ fontFamily: S.title, fontSize: '.9rem', color: rc.fill, marginBottom: '.2rem' }}>{h.city}</div>
                      <div style={{ color: S.tx2 }}>{h.count} fraud events</div>
                      <div style={{ color: rc.fill, fontSize: '.55rem', marginTop: '.15rem', letterSpacing: '.06em' }}>{rc.label} RISK</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              )
            })}
          </MapContainer>
          <Legend />
        </div>

        {/* Sidebar */}
        <div style={{ background: S.s1, borderLeft: `1px solid ${S.bd}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Filter */}
          <div style={{ padding: '.65rem .9rem', borderBottom: `1px solid ${S.bd}`, flexShrink: 0 }}>
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
              style={{ width: '100%', background: S.s2, border: `1px solid ${S.bd2}`, borderRadius: 5, padding: '.35rem .55rem', color: S.tx2, fontSize: '.6rem', fontFamily: S.font, outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>

          {/* List header */}
          <div style={{ padding: '.5rem .9rem', borderBottom: `1px solid ${S.bd}`, fontSize: '.52rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', flexShrink: 0 }}>
            🔥 Hotspot Rankings
          </div>

          <HotspotRank hotspots={filtered} selected={selected} onSelect={flyTo} />

          {/* Fraud type breakdown */}
          <div style={{ padding: '.8rem .9rem', borderTop: `1px solid ${S.bd}`, flexShrink: 0 }}>
            <div style={{ fontSize: '.52rem', color: S.tx3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.6rem' }}>
              📊 By Fraud Type
            </div>
            {FRAUD_TYPES_DIST.map(([label, pct, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
                <div style={{ width: 72, fontSize: '.57rem', color: S.tx2, flexShrink: 0 }}>{label}</div>
                <div style={{ flex: 1, height: 4, background: S.bd2, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: '.57rem', color, width: 22, textAlign: 'right', flexShrink: 0 }}>{pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}