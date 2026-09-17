import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import HoldTimer from '../components/HoldTimer'
import ProgressSteps from '../components/ProgressSteps'
import CheckoutSteps, { type StepId } from '../components/CheckoutSteps'
import { useStore } from '../store/StoreProvider'

/**
 * The same three steps the header panel runs, given a page of their own for a
 * direct link, a wide screen, or anyone who would rather not work inside a
 * dropdown.
 */
export default function CheckoutPage() {
  const { state, cartCount } = useStore()
  const [step, setStep] = useState<StepId>(1)
  const many = state.cart.length > 1

  // An empty cart after payment means the flow finished; CheckoutSteps shows the
  // reference. Empty before it means there is nothing to check out.
  const paid = state.checkout.lastReferences.length > 0
  if (!cartCount && !paid) return <Navigate to="/cart" replace />

  return (
    <>
      <ProgressSteps current={step} />
      <div className="shell pb-16">
        <div className="mx-auto max-w-[800px]">
          <div className="pb-8 pt-7">
            <HoldTimer
              size="sm"
              title={many ? 'Both slots held until the timer runs out' : 'Slot held until the timer runs out'}
              sub="Finish before it expires or the court goes back on sale"
            />
          </div>
          <CheckoutSteps step={step} setStep={setStep} />
        </div>
      </div>
    </>
  )
}
