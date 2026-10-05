import { useNavigate } from "react-router-dom";
import { addDays, todayKey } from "../../lib/booking";
import {
  BOOKING_WINDOW_DAYS,
  fromPrice,
  SX_COURTS,
} from "../../mocks/semnox";
import { DatePicker } from "../components";
import BookingWidget from "../BookingWidget";
import { useSemnox } from "../store";

/**
 * Basketball court lines (28 × 15 m, FIBA) drawn faintly on the floor of the hero,
 * tipped back in perspective so the players stand on it.
 */
function CourtLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[70%] justify-center [perspective:900px]">
      <svg
        viewBox="0 0 280 150"
        fill="none"
        stroke="var(--sx-color-court-line)"
        strokeWidth="0.8"
        className="h-full w-[min(140vw,1500px)] max-w-none origin-bottom [transform:rotateX(58deg)]"
        preserveAspectRatio="xMidYMax meet"
      >
        <rect x="1" y="1" width="278" height="148" />
        <line x1="140" y1="1" x2="140" y2="149" />
        <circle cx="140" cy="75" r="18" />
        <circle cx="140" cy="75" r="1.2" fill="var(--sx-color-court-line)" />
        {[0, 1].map((side) => (
          <g key={side} transform={side ? 'translate(280 0) scale(-1 1)' : undefined}>
            {/* key, free-throw circle, three-point line, rim */}
            <rect x="1" y="50.5" width="58" height="49" />
            <circle cx="59" cy="75" r="18" />
            <path d="M1 9h29.9a67.5 67.5 0 0 1 0 132H1" />
            <circle cx="16.75" cy="75" r="2.25" />
            <line x1="12" y1="66" x2="12" y2="84" />
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function HomeScreen() {
  const { dateKey, setDateKey, quantity, setQuantity } = useSemnox();
  const navigate = useNavigate();
  const today = todayKey();
  const unit = fromPrice(dateKey);

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden">
      <CourtLines />

      <div className="relative mx-auto flex w-full max-w-[460px] flex-1 flex-col items-center justify-center px-sx-md py-sx-xl text-center md:py-sx-2xl short:py-sx-sm">

        <h1 className="sx-display text-[30px] sm:text-[36px] lg:text-sx-display-lg short:text-[32px]">Book a court</h1>
        <span className="sx-stripe mt-sx-sm sm:mt-sx-md short:mt-sx-sm" aria-hidden="true" />

        {/* Title, date and card sit as one block, centred in the space between header and footer. */}
        <div className="flex w-full flex-col items-center pt-sx-md sm:pt-sx-lg short:pt-sx-md">
          <div>
            <DatePicker
              label="Booking date"
              value={dateKey}
              onChange={setDateKey}
              min={today}
              max={addDays(today, BOOKING_WINDOW_DAYS)}
            />
          </div>

          <div className="mt-sx-md flex w-full justify-center sm:mt-sx-lg short:mt-sx-sm">
            <BookingWidget
              unit={unit}
              quantity={quantity}
              max={SX_COURTS.length}
              onQuantity={setQuantity}
              onAdd={() => navigate("/semnox/slots")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
