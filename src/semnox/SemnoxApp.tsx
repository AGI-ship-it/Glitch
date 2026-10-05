import { Navigate, Route, Routes } from 'react-router-dom'
import SemnoxLayout from './SemnoxLayout'
import HomeScreen from './pages/HomeScreen'
import SlotsScreen from './pages/SlotsScreen'
import CheckoutScreen from './pages/CheckoutScreen'
import WaiverScreen from './pages/WaiverScreen'
import PaymentScreen from './pages/PaymentScreen'
import ConfirmationScreen from './pages/ConfirmationScreen'
import { AccountShell, BookingDetails, MyBookings, PersonalInfo } from './pages/AccountScreens'
import { SemnoxProvider } from './store'

export default function SemnoxApp() {
  return (
    <SemnoxProvider>
      <Routes>
        {/* Semnox Waivers and the payment gateway are separate sites — no booking chrome. */}
        <Route path="waiver" element={<WaiverScreen />} />
        <Route path="payment" element={<PaymentScreen />} />
        <Route element={<SemnoxLayout />}>
          <Route index element={<HomeScreen />} />
          <Route path="slots" element={<SlotsScreen />} />
          <Route path="checkout" element={<CheckoutScreen />} />
          <Route path="confirmation" element={<ConfirmationScreen />} />
          <Route path="account" element={<AccountShell />}>
            <Route index element={<MyBookings />} />
            <Route path="bookings/:reference" element={<BookingDetails />} />
            <Route path="profile" element={<PersonalInfo />} />
          </Route>
          <Route path="*" element={<Navigate to="/semnox" replace />} />
        </Route>
      </Routes>
    </SemnoxProvider>
  )
}
