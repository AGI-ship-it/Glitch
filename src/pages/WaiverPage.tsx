import { useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ExternalChrome from '../components/ExternalChrome'
import { useStore } from '../store/StoreProvider'
import type { Participant } from '../store/types'

/**
 * The venue's real waiver, as hosted on the form service: one document with four
 * participant rows, the guardian's details, the undertaking in full, a date and a
 * drawn signature. The wording is the operator's own and is reproduced verbatim
 * apart from the company name.
 */
const COMPANY = 'GLITCH SPORTS'

/**
 * Prefilled so the walkthrough is not held up by a date picker. The two DOB fields
 * still carry the form's asterisk, matching the operator's document, but they are
 * not enforced on submit — a demo should never dead-end on a date.
 */
const DEMO_DOB = '1994-03-12'

/** Whole years between a date of birth and today; -1 when nothing is entered yet. */
function ageOn(dob: string) {
  if (!dob) return -1
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return -1
  const now = new Date()
  const age = now.getFullYear() - born.getFullYear()
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  return beforeBirthday ? age - 1 : age
}

const isMinor = (dob: string) => {
  const age = ageOn(dob)
  return age >= 0 && age < 18
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="text-[13px] uppercase tracking-[0.01em] text-[#3f4145]">
        {label} {required && <span className="text-[#d93025]">*</span>}
      </p>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[12px] text-[#6e7175]">{hint}</p>}
    </div>
  )
}

const inputClass =
  'h-[34px] w-full rounded-[3px] border border-[#d4d6da] bg-white px-2.5 text-[14px] text-ink ' +
  'outline-none focus:border-[#8a8d93]'

function SignaturePad({ onChange }: { onChange: (signed: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const mark = () => {
    if (!empty) return
    setEmpty(false)
    onChange(true)
  }

  const start = (e: PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    const ctx = ref.current!.getContext('2d')!
    const p = point(e)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1b1b1b'
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x + 0.1, p.y)
    ctx.stroke()
    try {
      ref.current!.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture is unavailable for synthesised events; drawing still works.
    }
    mark()
  }

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = ref.current!.getContext('2d')!
    const p = point(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    mark()
  }

  const end = () => {
    drawing.current = false
  }

  const clear = () => {
    const canvas = ref.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setEmpty(true)
    onChange(false)
  }

  return (
    <div>
      <div className="relative rounded-[3px] border border-dashed border-[#c9ccd1] bg-white">
        <canvas
          ref={ref}
          width={1280}
          height={340}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-[160px] w-full touch-none"
          aria-label="Consent signature"
        />
        <span className="pointer-events-none absolute bottom-2 right-3 text-[12px] text-[#6e7175]">
          ✒ Sign
        </span>
      </div>
      <button type="button" onClick={clear} className="mt-2 text-[13px] text-[#3f4145] underline">
        Clear signature
      </button>
    </div>
  )
}

type Row = { name: string; dob: string }

export default function WaiverPage() {
  const navigate = useNavigate()
  const { state, signWaiver } = useStore()
  const details = state.checkout.details

  const [rows, setRows] = useState<Row[]>(() => [
    { name: details ? `${details.firstName} ${details.lastName}`.trim() : '', dob: DEMO_DOB },
    { name: '', dob: '' },
    { name: '', dob: '' },
    { name: '', dob: '' },
  ])
  const [guardianName, setGuardianName] = useState(
    details ? `${details.firstName} ${details.lastName}`.trim() : '',
  )
  const [guardianPhone, setGuardianPhone] = useState(details?.phone ?? '')
  const [email, setEmail] = useState(details?.email ?? '')
  const [guardianDob, setGuardianDob] = useState(DEMO_DOB)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [signed, setSigned] = useState(false)

  if (!state.cart.length) return <Navigate to="/cart" replace />
  if (!details) return <Navigate to="/checkout" replace />

  const editRow = (i: number, field: keyof Row, value: string) =>
    setRows((list) => list.map((r, n) => (n === i ? { ...r, [field]: value } : r)))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const participants: Participant[] = rows
      .filter((r) => r.name.trim())
      .map((r, i) => ({
        id: `participant-${i + 1}`,
        name: r.name.trim(),
        dob: r.dob,
        phone: guardianPhone,
        // The undertaking is signed by the guardian on behalf of any under-18.
        ...(isMinor(r.dob) ? { guardian: guardianName } : {}),
      }))
    signWaiver(participants)
    navigate('/payment')
  }

  const clause = 'mt-4 text-[13px] leading-[1.55] text-[#3f4145]'

  return (
    <ExternalChrome url="near.tl/sm/W6b8RMID3" contained={false}>
      <div className="bg-[#eef9f2]">
        {/* The form service's own bar, above the document. */}
        <div className="flex items-center gap-3 border-b border-[#dfe4e0] bg-white px-5 py-3">
          <img src="/brand/logo.png" alt="Glitch" className="h-4 w-auto" />
          <p className="text-[13px] uppercase tracking-[0.01em] text-[#3f4145]">
            Waiver of liability undertaking
          </p>
        </div>

        <div className="mx-auto w-full max-w-[560px] bg-white px-8 py-10 sm:px-10">
          <form onSubmit={submit}>
            <img
              src="/brand/logo.png"
              alt="Glitch Sports"
              className="mx-auto mb-5 h-[70px] w-auto"
            />

            <h1 className="text-[19px] font-medium leading-snug text-ink">
              WAIVER OF LIABILITY UNDERTAKING ({COMPANY} L.L.C)
            </h1>

            <div className="mt-7 space-y-5">
              {rows.map((row, i) => (
                <div key={i} className="grid gap-4 sm:grid-cols-2">
                  <Field label={`Participant's / kids name ${i + 1}`} required={i === 0}>
                    <input
                      required={i === 0}
                      value={row.name}
                      onChange={(e) => editRow(i, 'name', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={`Participant's / kids DOB ${i + 1}`} required={i === 0}>
                    <input
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={row.dob}
                      onChange={(e) => editRow(i, 'dob', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              ))}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Parents/guardian name:" required>
                  <input
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Parents/guardian phone no:" required hint="+971">
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="DOB" required>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={guardianDob}
                    onChange={(e) => setGuardianDob(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <h2 className="mt-10 text-[19px] font-medium leading-snug text-ink">
              WAIVER OF LIABILITY UNDERTAKING ({COMPANY} L.L.C)
            </h2>

            <div className="mt-6">
              <p className={clause}>
                I hereby agree to participate in the activities provided by {COMPANY}, which
                include but are not limited to arcades (VR), laser tag, bowling, cloud climbing,
                wall climbing, zip line, soft play and toddler areas, slides, and upper/lower rope
                courses (collectively referred to as “Activities”). I understand that participation
                in these Activities involves inherent risks, including but not limited to physical
                injury, property damage, or even death. By signing this agreement, I voluntarily
                accept and assume all such risks associated with my participation. If I am under
                the age of 18, I understand that I must be accompanied by my legal guardian, who
                will always be responsible for my supervision during my participation in the
                Activities. In consideration for being allowed to participate in the Activities, I
                agree to the following:
              </p>
              <p className={clause}>
                1. I confirm that I am physically fit and able to participate in the Activities. I
                will inform a {COMPANY} staff member if I am injured, unwell, or otherwise unfit to
                take part. I agree to comply with all rules and regulations set by {COMPANY},
                including the proper use of safety equipment, and I will follow all instructions
                given by staff. I certify that I meet the minimum height and weight requirements for
                each activity and understand that failure to meet these requirements may result in
                injury, damage, or death.
              </p>
              <p className={clause}>
                2. I hereby release, waive, and discharge {COMPANY}, its owners, employees, agents,
                and representatives from any and all liability, expenses, costs, causes of action,
                and damages of any kind or nature whatsoever. This includes any suits, claims, or
                demands—whether or not litigation is pursued—and covers legal fees and related
                expenses arising from or connected to my participation in the Activities. This
                waiver applies to all claims, including but not limited to those based on
                negligence, breach of contract, or any other legal theory, and covers physical
                injury, property damage, or death.
              </p>
              <p className={clause}>
                3. I understand and acknowledge the risks associated with my participation in the
                Activities, including the risk of exposure to viruses such as COVID-19. I recognize
                that my participation is entirely voluntary. I hereby assume full responsibility for
                any illness, injury, or damage that may occur, whether caused by the negligence of{' '}
                {COMPANY} or otherwise.
              </p>
              <p className={clause}>
                4. I hereby give my consent to {COMPANY} to use my image, including any photos or
                videos of myself, for promotional and advertising purposes and I will not make any
                claims in the future.
              </p>
              <p className={clause}>
                5. I agree that this Waiver of Liability Undertaking is legally binding on me, my
                heirs, assigns, and legal representatives.
              </p>
              <p className={clause}>
                6. This Waiver of Liability Undertaking shall be governed by and construed in
                accordance with the laws of Dubai, UAE. In the event of any dispute, the parties
                agree to submit to the exclusive jurisdiction of the Dubai Courts.
              </p>
              <p className={clause}>
                7. {COMPANY} may host birthday parties and school events (“Events”), during which
                food and beverages may be provided for children, as requested by parents or
                teachers. These services are included as part of {COMPANY}’s sales packages.
                However, {COMPANY} assumes no liability or responsibility for the quality, safety,
                or preparation of any food or beverages supplied by third-party vendors at such
                Events. I acknowledge and agree that {COMPANY} shall not be held responsible for any
                issues arising from the consumption or quality of the food provided at any Event. I
                understand that by participating in these Events and consuming the provided food and
                beverages, I accept full responsibility for all associated risks, including
                foodborne illness, allergic reactions, or even death.
              </p>
              <p className={clause}>
                I confirm that I have read and understood the terms of this Undertaking. I am aware
                that by signing it, I am waiving certain legal rights that I or my heirs, legal
                representatives, or assigns may have against {COMPANY}. I voluntarily agree to the
                terms and conditions outlined above.
              </p>
              <p className={clause}>
                I signed this Undertaking freely and voluntarily, and without inducement or
                coercion.
              </p>
              <p className={clause}>
                If the Participant is under 18 years of age, I declare that I am the parent or
                guardian of the minor Participant or Participants and I am authorized to sign this
                Undertaking on behalf of the minor Participant/Participants. I have voluntarily
                agreed to the terms and conditions stated above and signed this Undertaking of my
                own free will and without any coercion or undue influence.
              </p>
            </div>

            <div className="mt-9 sm:w-1/2 sm:pr-2">
              <Field label="Date" required>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-8">
              <p className="text-[13px] uppercase tracking-[0.01em] text-[#3f4145]">
                Consent signature <span className="text-[#d93025]">*</span>
              </p>
              <div className="mt-1.5">
                <SignaturePad onChange={setSigned} />
              </div>
            </div>

            <button
              type="submit"
              disabled={!signed}
              className="mt-8 inline-flex h-10 items-center gap-2 rounded-[3px] bg-[#1e5136] px-5 text-[13px] font-semibold uppercase tracking-[0.03em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span aria-hidden="true">➤</span> Submit
            </button>

            <p className="mt-4 text-[13px] text-[#6e7175]">
              Your slot is still held while you complete this step.
            </p>
          </form>
        </div>

        <div className="py-10 text-center">
          <img
            src="/brand/logo.png"
            alt="Glitch"
            className="mx-auto h-3 w-auto opacity-60"
          />
          <p className="mt-3 text-[13px] uppercase tracking-[0.01em] text-[#3f4145]">
            Waiver of liability undertaking
          </p>
          <p className="mt-2 text-[12px] text-[#6e7175]">
            Prototype — this stands in for the third-party form. Nothing is sent or stored.
          </p>
        </div>
      </div>
    </ExternalChrome>
  )
}
