import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import AccountShell from './AccountShell'
import { Checkbox } from '../../components/ui'
import { useStore } from '../../store/StoreProvider'

export default function PersonalInfoPage() {
  const { state, updateAccount } = useStore()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(() => ({
    firstName: state.account?.firstName ?? '',
    lastName: state.account?.lastName ?? '',
    email: state.account?.email ?? '',
    phone: state.account?.phone ?? '',
  }))

  if (!state.account) return <Navigate to="/login?next=/account/personal" replace />
  const account = state.account

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setSaved(false)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    updateAccount(form)
    setSaved(true)
  }

  return (
    <AccountShell
      crumb="Personal information"
      title="Personal information"
      intro="Update the details we use to confirm your booking and find you at reception."
    >
      <form onSubmit={submit}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pi-first">
              First name
            </label>
            <input id="pi-first" required value={form.firstName} onChange={set('firstName')} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="pi-last">
              Last name
            </label>
            <input id="pi-last" value={form.lastName} onChange={set('lastName')} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="pi-email">
              Email address
            </label>
            <input id="pi-email" type="email" required value={form.email} onChange={set('email')} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="pi-phone">
              Phone number
            </label>
            <input id="pi-phone" type="tel" required value={form.phone} onChange={set('phone')} className="field" />
            <p className="mt-2 text-[13px] text-muted">
              Reception searches by this number, so keep it current.
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button type="submit" className="btn btn-lg btn-primary w-[240px]">
            Update details
          </button>
          {saved && <p className="text-[15px] text-muted">Saved.</p>}
        </div>
      </form>

      <h3 className="mt-12 text-[22px] font-bold">Marketing preferences</h3>
      <div className="mt-4 space-y-4">
        <Checkbox
          checked={account.marketingEmail}
          onChange={(marketingEmail) => updateAccount({ marketingEmail })}
        >
          Email me offers and news from Glitch Sports
        </Checkbox>
        <Checkbox
          checked={account.marketingWhatsapp}
          onChange={(marketingWhatsapp) => updateAccount({ marketingWhatsapp })}
        >
          Send me offers on WhatsApp
        </Checkbox>
      </div>

      <p className="mt-8 max-w-[75ch] text-[14px] leading-relaxed text-muted">
        We collect only what the booking and the waiver require. To request a copy of your data or ask
        us to delete your account, contact the venue.
      </p>
    </AccountShell>
  )
}
