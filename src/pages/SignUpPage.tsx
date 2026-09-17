import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { goToBooking } from '../config'
import { formatCountdown, useStore } from '../store/StoreProvider'

export default function SignUpPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signUp, cartCount, secondsLeft } = useStore()
  // Prefilled so the prototype can be walked without typing.
  const [form, setForm] = useState({
    fullName: 'Omar Haddad',
    email: 'omar@example.com',
    phone: '+971 50 123 4567',
    password: 'glitch1234',
  })
  const next = params.get('next') ?? '/account/bookings'

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    signUp({ fullName: form.fullName, email: form.email, phone: form.phone })
    goToBooking(next, navigate)
  }

  return (
    <div className="shell flex justify-center py-16">
      <div className="card w-full max-w-[500px] p-8 sm:p-10">
        <h1 className="text-[28px] font-extrabold">Create your account</h1>
        <p className="mt-2 text-[15px] text-muted">
          Takes about a minute. You will need it to see or change this booking later.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-0 rounded-full border border-line-strong p-1">
          <Link
            to={`/login?next=${encodeURIComponent(next)}`}
            className="grid h-11 place-items-center rounded-full text-[15px] font-semibold hover:bg-wash"
          >
            Log in
          </Link>
          <span className="grid h-11 place-items-center rounded-full bg-ink text-[15px] font-semibold text-white">
            Sign up
          </span>
        </div>

        <form className="mt-8 space-y-6" onSubmit={submit}>
          <div>
            <label className="label" htmlFor="su-name">
              Full name
            </label>
            <input id="su-name" required value={form.fullName} onChange={set('fullName')} className="field" autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="su-email">
              Email address
            </label>
            <input id="su-email" type="email" required value={form.email} onChange={set('email')} className="field" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="su-phone">
              Phone number
            </label>
            <input id="su-phone" type="tel" required value={form.phone} onChange={set('phone')} className="field" autoComplete="tel" />
            <p className="mt-2 text-[13px] text-muted">Reception searches by this number, so keep it current.</p>
          </div>
          <div>
            <label className="label" htmlFor="su-password">
              Choose a password
            </label>
            <input
              id="su-password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set('password')}
              className="field"
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-lg btn-cta w-full">
            Create account and continue
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
