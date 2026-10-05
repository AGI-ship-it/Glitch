import { useId, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { useSemnox } from './store'

/** Form pieces shared by the checkout page and My account. */

export function Field({
  label,
  error,
  hint,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId()
  return (
    <div className={`text-left ${className}`}>
      <label htmlFor={id} className="mb-sx-xs block text-sx-caption font-bold uppercase tracking-[0.12em] text-sx-muted">
        {label}
        {rest.required && (
          <span aria-hidden="true" className="ml-sx-xs text-sx-cta-dark">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={`h-12 w-full rounded-sx-field border bg-sx-bg px-sx-md text-sx-body-md text-sx-text placeholder:text-sx-muted focus:border-sx-cta-dark focus:outline-none ${
          error ? 'border-sx-cta-dark' : 'border-sx-border-strong'
        }`}
        {...rest}
      />
      {(error || hint) && (
        <p id={`${id}-msg`} className={`mt-sx-xs text-sx-caption ${error ? 'font-bold text-sx-cta-dark' : 'text-sx-muted'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

const linkClass = 'font-bold text-sx-muted underline underline-offset-4 transition hover:text-sx-text'

/** Prefilled so a demo click-through doesn't stop to type. */
const DEMO_ACCOUNT = {
  firstName: 'Omar',
  lastName: 'Al Rashid',
  email: 'omar@example.com',
  phone: '050 123 4567',
  password: 'glitch123',
}

const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim())

/** Email and password, with sign-up a link away — Semnox's account login. */
export function SignIn({ onDone, intro }: { onDone: () => void; intro?: string }) {
  const { signIn } = useSemnox()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [form, setForm] = useState(DEMO_ACCOUNT)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [resetSent, setResetSent] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const switchTo = (m: typeof mode) => {
    setMode(m)
    setErrors({})
    setResetSent(false)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!isEmail(form.email)) next.email = 'Enter a valid email address.'
    if (mode !== 'forgot' && form.password.length < 6) next.password = 'Use at least 6 characters.'
    if (mode === 'signup' && !form.firstName.trim()) next.firstName = 'Enter your first name.'
    setErrors(next)
    if (Object.keys(next).length) return

    if (mode === 'forgot') return setResetSent(true)

    const fromEmail = form.email.split('@')[0]
    signIn({
      firstName: form.firstName.trim() || fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1),
      lastName: form.lastName.trim() || undefined,
      contact: form.email.trim(),
      phone: form.phone.trim() || undefined,
    })
    onDone()
  }

  const title = { login: 'Sign in', signup: 'Create an account', forgot: 'Reset your password' }[mode]

  return (
    <div className="max-w-[440px]">
      <h2 className="sx-display text-sx-display-lg">{title}</h2>
      {mode === 'login' && intro && <p className="mt-sx-sm text-sx-body-md text-sx-muted">{intro}</p>}
      {mode === 'forgot' && (
        <p className="mt-sx-sm text-sx-body-md text-sx-muted">We'll email you a link to set a new one.</p>
      )}

      <form onSubmit={submit} className="mt-sx-lg flex flex-col gap-sx-md" noValidate>
        {mode === 'signup' && (
          <div className="grid gap-sx-md sm:grid-cols-2">
            <Field label="First name" required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
            <Field label="Last name" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
          </div>
        )}
        <Field
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        {mode === 'signup' && <Field label="Mobile" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />}
        {mode !== 'forgot' && (
          <div>
            <Field
              label="Password"
              type="password"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />
            {mode === 'login' && (
              <button type="button" onClick={() => switchTo('forgot')} className={`mt-sx-sm text-sx-body-sm ${linkClass}`}>
                Forgot password?
              </button>
            )}
          </div>
        )}

        <p className="text-sx-caption text-sx-muted">Demo details are filled in for this prototype.</p>

        {resetSent ? (
          <p role="status" className="rounded-sx-field bg-sx-raised p-sx-md text-sx-body-sm">
            If <strong>{form.email}</strong> has an account, a reset link is on its way.
          </p>
        ) : (
          <button type="submit" className="sx-btn sx-btn-primary sx-btn-lg mt-sx-sm w-full">
            {{ login: 'Log in', signup: 'Create account', forgot: 'Send reset link' }[mode]}
          </button>
        )}
      </form>

      <p className="mt-sx-lg text-center text-sx-body-sm text-sx-muted">
        {mode === 'login' ? (
          <>
            New here?{' '}
            <button type="button" onClick={() => switchTo('signup')} className={linkClass}>
              Create an account
            </button>
          </>
        ) : (
          <>
            {mode === 'signup' ? 'Already have an account? ' : ''}
            <button type="button" onClick={() => switchTo('login')} className={linkClass}>
              {mode === 'signup' ? 'Sign in' : 'Back to sign in'}
            </button>
          </>
        )}
      </p>
    </div>
  )
}
