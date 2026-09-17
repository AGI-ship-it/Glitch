import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { goToBooking } from '../config'
import { formatCountdown, useStore } from '../store/StoreProvider'

export default function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { logIn, cartCount, secondsLeft } = useStore()
  const [email, setEmail] = useState('omar@example.com')
  // Prefilled alongside the email so the prototype can be walked without typing.
  const [password, setPassword] = useState('glitch1234')
  const next = params.get('next') ?? '/account/bookings'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    logIn(email)
    goToBooking(next, navigate)
  }

  return (
    <div className="shell flex justify-center py-16">
      <div className="card w-full max-w-[500px] p-8 sm:p-10">
        <h1 className="text-[28px] font-extrabold">Sign in to continue</h1>
        <p className="mt-2 text-[15px] text-muted">
          {cartCount > 0
            ? 'You need an account to complete this booking.'
            : 'Sign in to see your bookings, references and QR codes.'}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-0 rounded-full border border-line-strong p-1">
          <span className="grid h-11 place-items-center rounded-full bg-ink text-[15px] font-semibold text-white">
            Log in
          </span>
          <Link
            to={`/signup?next=${encodeURIComponent(next)}`}
            className="grid h-11 place-items-center rounded-full text-[15px] font-semibold hover:bg-wash"
          >
            Sign up
          </Link>
        </div>

        <form className="mt-8 space-y-6" onSubmit={submit}>
          <div>
            <label className="label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              autoComplete="current-password"
            />
          </div>

          <button type="button" className="text-[15px] underline">
            Forgot your password?
          </button>

          <button type="submit" className="btn btn-lg btn-cta w-full">
            Log in and continue
          </button>
        </form>

        {cartCount > 0 && (
          <p className="mt-6 text-[14px] text-muted">
            Your slot is held while you do this
            {secondsLeft > 0 ? ` — ${formatCountdown(secondsLeft)} left.` : '.'}
          </p>
        )}
      </div>
    </div>
  )
}
