// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import PackingPortal from './pages/PackingPortal'
import DeliveryVerification from './pages/DeliveryVerification'
import AdminDashboard from './pages/AdminDashboard'
import FraudHeatmap from './pages/FraudHeatmap'
import TrustScores from './pages/TrustScores'
import InquirySystem from './pages/InquirySystem'

const NAV = [
  { to: '/packing',   icon: '\u{1F3ED}', label: 'Packing Portal' },
  { to: '/delivery',  icon: '\u{1F69A}', label: 'Delivery' },
  { to: '/admin',     icon: '\u{1F6E1}', label: 'Admin' },
  { to: '/inquiries', icon: '\u{1F50D}', label: 'Inquiries' },
  { to: '/trust',     icon: '\u{2B50}',  label: 'Trust Scores' },
  { to: '/heatmap',   icon: '\u{1F5FA}', label: 'Fraud Map' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <aside style={{
          width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ padding: '1.4rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)',
                border: '1px solid var(--accent-bd)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
              }}>📦</div>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: '1.05rem', color: 'var(--tx)', fontWeight: 700, lineHeight: 1.1 }}>
                  Parcel<span style={{ color: 'var(--accent-l)' }}>Guard</span>
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--tx3)', letterSpacing: '0.06em', marginTop: '0.12rem' }}>Supply Chain · Fraud Detection</div>
              </div>
            </div>
          </div>
          <nav style={{ padding: '0.8rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--tx3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 0.7rem 0.5rem' }}>Operations</div>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.6rem 0.8rem', borderRadius: 8, fontSize: '0.83rem',
                  fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                  color: isActive ? 'var(--accent-l)' : 'var(--tx2)',
                  background: isActive ? 'var(--accent-bg)' : 'transparent',
                  transition: 'all .12s',
                })}
              >
                <span style={{ fontSize: '0.95rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '1rem 1.4rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite', boxShadow: '0 0 8px var(--green)' }} />
              <span style={{ fontSize: '0.63rem', color: 'var(--tx2)', fontFamily: 'var(--mono)' }}>API :8000 online</span>
            </div>
          </div>
        </aside>
        <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/packing" replace />} />
            <Route path="/packing"   element={<PackingPortal />} />
            <Route path="/delivery"  element={<DeliveryVerification />} />
            <Route path="/admin"     element={<AdminDashboard />} />
            <Route path="/inquiries" element={<InquirySystem />} />
            <Route path="/trust"     element={<TrustScores />} />
            <Route path="/heatmap"   element={<FraudHeatmap />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}