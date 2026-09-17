import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CourtsPage from './pages/CourtsPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import WaiverPage from './pages/WaiverPage'
import PaymentPage from './pages/PaymentPage'
import ConfirmationPage from './pages/ConfirmationPage'
import MyBookingsPage from './pages/account/MyBookingsPage'
import BookingDetailPage from './pages/account/BookingDetailPage'
import ReschedulePage from './pages/account/ReschedulePage'
import CancelPage from './pages/account/CancelPage'
import CancelledPage from './pages/account/CancelledPage'
import PersonalInfoPage from './pages/account/PersonalInfoPage'
import { LegalPage } from './pages/LegalPage'

export default function App() {
  return (
    <Routes>
      {/* near.tl and CCAvenue sit outside the product — no Glitch chrome. */}
      <Route path="/waiver" element={<WaiverPage />} />
      <Route path="/payment" element={<PaymentPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courts" element={<CourtsPage />} />
        <Route path="/book/:courtId" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />

        <Route path="/account" element={<Navigate to="/account/bookings" replace />} />
        <Route path="/account/bookings" element={<MyBookingsPage tab="upcoming" />} />
        <Route path="/account/bookings/past" element={<MyBookingsPage tab="past" />} />
        <Route path="/account/bookings/:reference" element={<BookingDetailPage />} />
        <Route path="/account/bookings/:reference/reschedule" element={<ReschedulePage />} />
        <Route path="/account/bookings/:reference/cancel" element={<CancelPage />} />
        <Route path="/account/bookings/:reference/cancelled" element={<CancelledPage />} />
        <Route path="/account/personal" element={<PersonalInfoPage />} />

        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
