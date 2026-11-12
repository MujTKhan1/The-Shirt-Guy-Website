import { useEffect, useRef, useState, type FormEvent } from 'react'
import { services, supporting, contact } from '../data'
import { Arrow } from './Arrow'

type Fields = {
  name: string
  email: string
  company: string
  service: string
  quantity: string
  date: string
  details: string
}

const empty: Fields = { name: '', email: '', company: '', service: '', quantity: '', date: '', details: '' }

const quantities = ['Under 50', '50 to 249', '250 to 999', '1,000 to 4,999', '5,000 or more', 'Not sure yet']

const labels: Record<keyof Fields, string> = {
  name: 'Name',
  email: 'Email',
  company: 'Company or brand',
  service: 'Garment or service required',
  quantity: 'Approximate quantity',
  date: 'Target date',
  details: 'Project details',
}

/**
 * No submission service is configured, so this form validates and then states plainly that
 * nothing was sent. Wire `submitBrief` to a real endpoint (see README) to make it live.
 */
const FORM_ENDPOINT: string | null = null

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {}
  if (!f.name.trim()) e.name = 'Enter your name.'
  if (!f.email.trim()) e.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter an email address in the format name@example.com.'
  if (!f.service) e.service = 'Choose the garment or service you need.'
  if (!f.quantity) e.quantity = 'Choose an approximate quantity.'
  if (f.date) {
    const d = new Date(f.date + 'T00:00:00')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (Number.isNaN(d.getTime())) e.date = 'Enter a valid date.'
    else if (d < today) e.date = 'Choose a target date in the future.'
  }
  if (f.details.trim().length < 20) e.details = 'Tell us a little more about the project (at least 20 characters).'
  return e
}

export function Enquiry() {
  const [f, setF] = useState<Fields>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [status, setStatus] = useState<'idle' | 'invalid' | 'demo'>('idle')
  const [touched, setTouched] = useState(false)
  const summary = useRef<HTMLDivElement>(null)
  const result = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)

  // move focus to the outcome so keyboard and screen reader users hear it
  useEffect(() => {
    if (!attempt) return
    if (status === 'invalid') summary.current?.focus()
    if (status === 'demo') result.current?.focus()
  }, [attempt, status])

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    const next = { ...f, [k]: e.target.value }
    setF(next)
    if (touched) setErrors(validate(next))
    if (status === 'demo') setStatus('idle')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const errs = validate(f)
    setErrors(errs)
    if (Object.keys(errs).length) {
      setStatus('invalid')
      setAttempt((n) => n + 1)
      return
    }
    if (!FORM_ENDPOINT) {
      setStatus('demo')
      setAttempt((n) => n + 1)
    }
  }

  const err = (k: keyof Fields) => errors[k]
  const field = (k: keyof Fields) => ({
    id: `f-${k}`,
    name: k,
    value: f[k],
    onChange: set(k),
    'aria-invalid': err(k) ? true : undefined,
    'aria-describedby': err(k) ? `f-${k}-err` : undefined,
  })
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const errorList = Object.entries(errors) as [keyof Fields, string][]

  return (
    <section id="enquiry" className="enquiry" aria-labelledby="enquiry-title">
      <div className="enquiry__head">
        <p className="kicker">Project enquiry</p>
        <h2 id="enquiry-title" className="display enquiry__title">Let's make your next drop.</h2>
        <p className="enquiry__lede">
          Tell us what you're making, roughly how many and when you need it. Prefer to talk it
          through? Call <a href={contact.phoneHref}>{contact.phone}</a>.
        </p>
      </div>

      <form className="brief" noValidate onSubmit={onSubmit} aria-describedby="demo-note">
        <p id="demo-note" className="brief__demo">
          <strong>Demo form.</strong> This form isn't connected to a submission service yet, so briefs entered here are not sent.
        </p>

        {status === 'invalid' && errorList.length > 0 && (
          <div className="brief__summary" role="alert" tabIndex={-1} ref={summary}>
            <p>Check {errorList.length === 1 ? 'this field' : `these ${errorList.length} fields`}:</p>
            <ul>
              {errorList.map(([k, m]) => (
                <li key={k}><a href={`#f-${k}`}>{labels[k]}: {m}</a></li>
              ))}
            </ul>
          </div>
        )}

        <div className="brief__grid">
          <div className={`fld ${err('name') ? 'has-err' : ''}`}>
            <label htmlFor="f-name">Name <span className="req">(required)</span></label>
            <input type="text" autoComplete="name" {...field('name')} />
            {err('name') && <p className="fld__err" id="f-name-err">{err('name')}</p>}
          </div>
          <div className={`fld ${err('email') ? 'has-err' : ''}`}>
            <label htmlFor="f-email">Email <span className="req">(required)</span></label>
            <input type="email" autoComplete="email" inputMode="email" {...field('email')} />
            {err('email') && <p className="fld__err" id="f-email-err">{err('email')}</p>}
          </div>
          <div className="fld">
            <label htmlFor="f-company">Company or brand</label>
            <input type="text" autoComplete="organization" {...field('company')} />
          </div>
          <div className={`fld ${err('service') ? 'has-err' : ''}`}>
            <label htmlFor="f-service">Garment or service required <span className="req">(required)</span></label>
            <select {...field('service')}>
              <option value="">Choose one</option>
              {services.map((s) => <option key={s.num} value={s.name}>{s.name}</option>)}
              {supporting.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="Several / not sure">Several, or not sure yet</option>
            </select>
            {err('service') && <p className="fld__err" id="f-service-err">{err('service')}</p>}
          </div>
          <div className={`fld ${err('quantity') ? 'has-err' : ''}`}>
            <label htmlFor="f-quantity">Approximate quantity <span className="req">(required)</span></label>
            <select {...field('quantity')}>
              <option value="">Choose a range</option>
              {quantities.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
            {err('quantity') && <p className="fld__err" id="f-quantity-err">{err('quantity')}</p>}
          </div>
          <div className={`fld ${err('date') ? 'has-err' : ''}`}>
            <label htmlFor="f-date">Target date</label>
            <input type="date" min={today} {...field('date')} />
            {err('date') && <p className="fld__err" id="f-date-err">{err('date')}</p>}
          </div>
          <div className={`fld fld--full ${err('details') ? 'has-err' : ''}`}>
            <label htmlFor="f-details">Project details <span className="req">(required)</span></label>
            <textarea rows={5} placeholder="Garment type, colours, print positions, artwork status…" {...field('details')} />
            {err('details') && <p className="fld__err" id="f-details-err">{err('details')}</p>}
          </div>
        </div>

        <div className="brief__actions">
          <button type="submit" className="btn btn--ink btn--lg">Send brief <Arrow /></button>
          <p className="brief__privacy">We only use these details to reply to your enquiry.</p>
        </div>

        <div className="brief__result" aria-live="polite">
          {status === 'demo' && (
            <div className="brief__demo-result" tabIndex={-1} ref={result}>
              <p><strong>Your brief has not been sent.</strong></p>
              <p>
                Everything checks out, but this is a demo form with no submission service connected yet.
                To get your project moving today, call <a href={contact.phoneHref}>{contact.phone}</a>.
              </p>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}
