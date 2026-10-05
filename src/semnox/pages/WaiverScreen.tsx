import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ExternalChrome from '../../components/ExternalChrome'
import SignaturePad from '../../components/SignaturePad'
import { useSemnox } from '../store'

const TERMS = [
  'Every player listed is medically fit to take part.',
  'Sport carries a risk of injury, accepted on each player’s behalf.',
  'Players follow the court rules and staff instructions.',
  'Glitch Sports may refuse entry to anyone without a signed waiver.',
]

/**
 * Semnox Waivers is its own site, outside the booking chrome. Checkout sends
 * the customer here after sign-in and takes them back to pay once it's signed.
 */
export default function WaiverScreen() {
  const { account, waiverSigned, signWaiver } = useSemnox()
  const navigate = useNavigate()
  const [players, setPlayers] = useState('Omar Al Rashid\nYousef Khan')
  const [agreed, setAgreed] = useState(false)
  const [signed, setSigned] = useState(false)
  const [tried, setTried] = useState(false)
  const ids = { players: useId(), agree: useId() }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!agreed || !signed) return
    signWaiver()
    navigate('/semnox/checkout')
  }

  return (
    <ExternalChrome url="waivers.semnox.com/glitch-sports" note="Semnox Waivers">
      <div className="mx-auto max-w-[640px] py-10">
        <p className="eyebrow">Glitch Sports · Al Ghurair Centre</p>
        <h1 className="mt-2 text-[30px] font-extrabold italic uppercase leading-tight">Sign the waiver</h1>

        {!account ? (
          <p className="mt-4 text-[16px] text-muted">
            Sign in on the booking site first.{' '}
            <Link to="/semnox/checkout" className="font-bold text-ink underline underline-offset-4">
              Back to checkout
            </Link>
          </p>
        ) : waiverSigned ? (
          <div className="mt-6 rounded-[18px] border border-line bg-white p-5">
            <p className="text-[16px] font-bold">Waiver signed for {account.contact}.</p>
            <Link to="/semnox/checkout" className="btn btn-cta btn-md mt-4">
              Back to checkout
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-6 rounded-[22px] border border-line bg-white p-6">
            <p className="text-[15px] text-muted">
              Signing as <strong className="text-ink">{account.contact}</strong>. Anyone under 18 needs a parent or guardian to
              sign for them.
            </p>

            <div>
              <label htmlFor={ids.players} className="label">
                Who is playing
              </label>
              <textarea
                id={ids.players}
                rows={3}
                value={players}
                onChange={(e) => setPlayers(e.target.value)}
                placeholder="One name per line"
                className="w-full rounded-[18px] border border-line-strong px-4 py-3 text-[15px] focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-[13px] text-muted">Leave blank and the waiver covers you alone.</p>
            </div>

            <ol className="list-decimal space-y-2 pl-5 text-[15px] text-ink-soft">
              {TERMS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>

            <label htmlFor={ids.agree} className="flex cursor-pointer items-start gap-3 text-[15px]">
              <input
                id={ids.agree}
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-[#d1148c]"
              />
              I agree to the terms on behalf of everyone listed.
            </label>

            <div>
              <p className="label">Signature</p>
              <SignaturePad onSign={setSigned} />
            </div>

            {tried && (!agreed || !signed) && (
              <p role="alert" className="text-[14px] font-bold text-brand-magenta">
                {!agreed ? 'Tick the box to agree.' : 'Sign in the box to continue.'}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link to="/semnox/checkout" className="text-[15px] font-semibold text-muted underline underline-offset-4 hover:text-ink">
                Back to checkout
              </Link>
              <button type="submit" className="btn btn-cta btn-lg">
                Sign and return to checkout
              </button>
            </div>
          </form>
        )}
      </div>
    </ExternalChrome>
  )
}
