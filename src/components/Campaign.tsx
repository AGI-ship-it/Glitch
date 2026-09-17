import { useEffect, useState } from 'react'
import { HERO_SLIDES } from '../data/catalog'
import { HERO_SCRIM, PATTERN_COOL } from '../lib/pattern'

/** How long a slide holds before the next one takes over. */
const SLIDE_MS = 7000

/**
 * Below this the hero is a single fixed statement: the tabs are the only thing
 * that shows a slider is there at all, and they have nowhere to sit on a phone.
 */
const SLIDER_AT = '(min-width: 640px)'

function useSliderEnabled() {
  const [enabled, setEnabled] = useState(() => window.matchMedia(SLIDER_AT).matches)

  useEffect(() => {
    const mq = window.matchMedia(SLIDER_AT)
    const onChange = () => setEnabled(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return enabled
}

export type Carousel = ReturnType<typeof useCampaignCarousel>

/**
 * The hero slider's clock. Held here rather than inside the backdrop because the
 * backdrop, the headline and the tabs all read the same index — one owner, three
 * views. Advancing is a timeout per slide rather than one interval, so tapping a tab
 * restarts the hold instead of leaving a half-spent tick running.
 */
export function useCampaignCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const sliding = useSliderEnabled()

  // Rotating to a phone mid-slide would otherwise strand the hero on slide three.
  useEffect(() => {
    if (!sliding) setIndex(0)
  }, [sliding])

  useEffect(() => {
    if (!sliding || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % HERO_SLIDES.length),
      SLIDE_MS,
    )
    return () => window.clearTimeout(id)
  }, [index, paused, sliding])

  return {
    index,
    /** Tapping a tab both moves the slider and restarts its hold. */
    goTo: (next: number) => setIndex(next),
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    paused,
  }
}

/** Where the artwork sits, per fit. A cutout stands on the ground; a frame floats. */
function slideMedia(slide: (typeof HERO_SLIDES)[number]) {
  const { fit, slot, grounded, align } = slide.media
  if (fit === 'cutout') {
    return {
      box: `absolute inset-y-0 flex items-end ${
        align === 'center' ? 'inset-x-0 mx-auto justify-center' : 'right-0 justify-end'
      } ${slot ?? 'w-[52%] max-w-[620px]'}`,
      // `object-bottom` is what pins the artwork to the foot of its box, so a
      // grounded cutout only has to take the whole height to meet the edge.
      img: `${grounded ? 'h-full' : 'h-[88%]'} w-full object-contain object-bottom`,
      // A cutout has no edges to hide — the transparency does that work already.
      mask: undefined,
    }
  }
  if (fit === 'contain') {
    return {
      box: `absolute inset-y-0 right-0 flex items-center justify-end ${slot ?? 'w-[52%]'}`,
      img: 'h-[86%] w-full object-contain',
      mask:
        'linear-gradient(90deg, transparent 0%, #000 22%), linear-gradient(180deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
    }
  }
  return {
    box: `absolute inset-y-0 right-0 ${slot ?? 'w-[62%]'}`,
    img: 'h-full w-full object-cover',
    mask: 'linear-gradient(90deg, transparent 0%, #000 30%)',
  }
}

/**
 * The full-bleed half of a slide: the brand ground, the slide's own accent wash and
 * its artwork, cross-faded. Only the active slide is exposed to a screen reader —
 * the words are set live in `CampaignOffer`, so the picture is decoration.
 */
export function CampaignBackdrop({ index }: { index: number }) {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0" style={{ background: PATTERN_COOL }} />

      {HERO_SLIDES.map((slide, i) => {
        const media = slideMedia(slide)
        const active = i === index
        return (
          <div
            key={slide.id}
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
              active ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(115% 85% at 84% 45%, ${slide.accent}66 0%, transparent 62%)`,
              }}
            />
            <div className={media.box}>
              <picture className="block h-full w-full">
                <source
                  type="image/webp"
                  srcSet={slide.media.webp}
                  sizes="(min-width: 768px) 55vw, 92vw"
                />
                <img
                  src={slide.media.fallback}
                  srcSet={slide.media.jpeg}
                  sizes="(min-width: 768px) 55vw, 92vw"
                  alt=""
                  // The first slide is the largest thing in the first fold.
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  className={`${media.img} transition-transform duration-[1200ms] ease-out ${
                    active ? 'scale-100' : 'scale-105'
                  }`}
                  style={{
                    objectPosition: slide.media.focal,
                    ...(media.mask
                      ? {
                          maskImage: media.mask,
                          WebkitMaskImage: media.mask,
                          // Two fades on one edge each: they have to intersect, or
                          // the default 'add' unions them and nothing fades at all.
                          maskComposite: 'intersect',
                          WebkitMaskComposite: 'source-in',
                        }
                      : {}),
                  }}
                />
              </picture>
            </div>
          </div>
        )
      })}

      <div aria-hidden="true" className="absolute inset-0" style={{ background: HERO_SCRIM }} />
    </>
  )
}

/**
 * The slide's words, set live in the site's own type. Every slide says the same
 * thing in the end — book a court — so the CTA under this block never changes with
 * the slide.
 */
export function CampaignOffer({ index }: { index: number }) {
  const slide = HERO_SLIDES[index]
  return (
    <div key={slide.id} className="relative max-w-[42ch] animate-fade-up">
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-yellow">
        {slide.eyebrow}
      </p>
      <p className="mt-3 text-[40px] font-extrabold uppercase italic leading-[0.88] tracking-tight sm:text-[54px] lg:text-[62px]">
        {slide.headline}
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-white/75 sm:text-[19px]">{slide.note}</p>
    </div>
  )
}

/**
 * The slide tabs. Each carries its own headline rather than a dot, so the row reads
 * as a contents list of the hero; the rule under the active one runs out over the
 * hold, which is the only thing on the page that shows the slider is moving.
 */
export function CampaignTabs({ index, goTo, pause, resume, paused }: Carousel) {
  return (
    <div
      className="relative z-10 mt-12 hidden flex-wrap gap-x-8 gap-y-3 sm:flex"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      {HERO_SLIDES.map((slide, i) => {
        const active = i === index
        return (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(i)}
            aria-current={active}
            className={`group max-w-[210px] pb-2 text-left text-[13px] font-bold uppercase tracking-[0.08em] transition ${
              active ? 'text-white' : 'text-white/45 hover:text-white/80'
            }`}
          >
            {slide.headline}
            <span aria-hidden="true" className="mt-2 block h-[3px] w-full rounded-full bg-white/15">
              <span
                className="block h-full rounded-full bg-brand-magenta-bright"
                style={{
                  width: active ? '100%' : '0%',
                  // Animating width over the hold is what makes it a progress bar;
                  // a paused slider simply stops where it stands.
                  transition: active && !paused ? `width ${SLIDE_MS}ms linear` : 'none',
                }}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}
