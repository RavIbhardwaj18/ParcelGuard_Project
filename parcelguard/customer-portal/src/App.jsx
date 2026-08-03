import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CustomerHome from './pages/CustomerHome'
import ClaimStatus from './pages/ClaimStatus'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/claim/:claimId" element={<ClaimStatus />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
