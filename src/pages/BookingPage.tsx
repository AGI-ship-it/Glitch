import { Link, useParams, useSearchParams } from 'react-router-dom'
import { COURTS, courtById } from '../data/catalog'
import BookingPicker from '../components/BookingPicker'
import { Chevron } from '../components/ui'

export default function BookingPage() {
  const { courtId = '' } = useParams()
  const [params] = useSearchParams()
  const court = courtById(courtId) ?? COURTS[0]

  // Arriving from a court card can preselect an exact date and hour.
  const hourParam = params.get('hour')
  const hour = hourParam !== null && Number.isFinite(Number(hourParam)) ? Number(hourParam) : undefined

  return (
    <div className="pb-10">
      {/* Full-bleed banner, kept thin so the date and slot pickers land in the first fold. */}
      <div className="relative h-[104px] w-full overflow-hidden bg-ink sm:h-[120px]">
        {court.image ? (
          <img src={court.image} alt={court.name} className="h-full w-full object-cover object-center" />
        ) : (
          <div className="h-full w-full bg-wash-strong" />
        )}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-ink/60 to-transparent" />
        <nav className="absolute left-5 top-3 text-[14px] text-white sm:left-8">
          <Link to="/courts" className="inline-flex items-center gap-1 hover:underline">
            <Chevron dir="left" className="h-3.5 w-3.5" />
            Sports and courts
          </Link>
        </nav>
      </div>

      <div className="shell">
        <div className="mx-auto max-w-[800px]">
          {/* The sport pill sits over the foot of the court image. */}
          <div className="-mt-6">
            <BookingPicker request={{ courtId: court.id, dateKey: params.get('date') ?? undefined, hour }} />
          </div>
        </div>
      </div>
    </div>
  )
}
