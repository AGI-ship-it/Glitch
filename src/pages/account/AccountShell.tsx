import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { PageHeading } from '../../components/ui'
import { useStore } from '../../store/StoreProvider'

const RAIL = [
  { to: '/account/bookings', label: 'My bookings', end: true },
  { to: '/account/bookings/past', label: 'Past bookings', end: true },
  { to: '/account/personal', label: 'Personal information', end: true },
]

export default function AccountShell({
  crumb,
  title,
  intro,
  children,
}: {
  crumb: string
  title: string
  intro?: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  const { logOut } = useStore()

  return (
    <div className="shell pb-16">
      <PageHeading title="My account" crumb={`My account › ${crumb}`} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <nav className="card h-fit p-4">
          {RAIL.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3.5 text-[15px] transition ${
                  isActive ? 'bg-wash font-semibold' : 'hover:bg-wash'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="my-3 h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              logOut()
              navigate('/')
            }}
            className="block w-full rounded-lg px-4 py-3.5 text-left text-[15px] hover:bg-wash"
          >
            Log out
          </button>
        </nav>

        <section>
          <h2 className="text-[26px] font-extrabold">{title}</h2>
          {intro && <p className="mt-2 max-w-[75ch] text-[16px] text-muted">{intro}</p>}
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </div>
  )
}
