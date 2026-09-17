import { VENUE } from '../data/catalog'
import { PageHeading } from '../components/ui'

const CONTENT = {
  terms: {
    title: 'Terms and conditions',
    intro: 'The terms that apply when you book a court at Glitch Sports.',
    sections: [
      {
        h: 'Booking and payment',
        p: 'A booking is created only after your card payment is authorised. Prices are shown per hour and include VAT at 5%. Off-peak rates apply before 17:00 from Monday to Thursday; weekend and public holiday rates are higher.',
      },
      {
        h: 'Holds',
        p: `Slots you add to your cart are held for ${10} minutes while you sign the waiver and pay. If the hold lapses, the slot returns to sale and the price may change.`,
      },
      {
        h: 'Waiver',
        p: 'Every participant must complete and sign the Glitch Sports participant waiver before play. Under-18s need a parent or guardian to sign on their behalf.',
      },
      {
        h: 'Changes and cancellation',
        p: 'You can move or cancel a booking free of charge up to 24 hours before your slot. Inside 24 hours the booking is fixed. Refunds are returned to the original card within 5 to 7 working days.',
      },
      {
        h: 'At the venue',
        p: `Show your booking reference or QR code at reception, ${VENUE.address}. Closed shoes and comfortable clothing are required. Balls and bibs are provided.`,
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'What we collect when you book, and why.',
    sections: [
      {
        h: 'What we collect',
        p: 'Your name, email address and phone number, the details of your bookings, and the record of your signed waiver. We collect only what the booking and the waiver require.',
      },
      {
        h: 'Why we collect it',
        p: 'To confirm your booking, to find you at reception — reception searches by phone number — and to contact you if a court becomes unavailable.',
      },
      {
        h: 'Payments',
        p: 'Card details are entered on CCAvenue’s secure payment page and are never stored by Glitch Sports.',
      },
      {
        h: 'Marketing',
        p: 'Offers by email or WhatsApp are optional and off by default. You can change your preferences at any time from your account.',
      },
      {
        h: 'Your rights',
        p: 'You can ask for a copy of your data or ask us to delete it by contacting the venue. We handle personal data in line with UAE data-protection law.',
      },
    ],
  },
} as const

export function LegalPage({ kind }: { kind: keyof typeof CONTENT }) {
  const doc = CONTENT[kind]
  return (
    <div className="shell pb-16">
      <PageHeading title={doc.title} intro={doc.intro} />
      <div className="mt-10 max-w-[80ch] space-y-4">
        {doc.sections.map((s) => (
          <section key={s.h} className="card px-7 py-6">
            <h2 className="text-[19px] font-bold">{s.h}</h2>
            <p className="mt-2.5 max-w-[70ch] text-[16px] leading-relaxed text-muted">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
