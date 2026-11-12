import { contact } from '../data'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <p className="site-footer__mark" aria-hidden="true">The T-Shirt Guy</p>
      </div>
      <div className="site-footer__cols">
        <div>
          <h2 className="kicker">Visit</h2>
          <address>
            The T-Shirt Guy<br />
            {contact.address.map((l) => <span key={l}>{l}<br /></span>)}
          </address>
        </div>
        <div>
          <h2 className="kicker">Call</h2>
          <p><a href={contact.phoneHref}>{contact.phone}</a></p>
        </div>
        <div>
          <h2 className="kicker">Policies</h2>
          <ul>
            {contact.policies.map((p) => (
              <li key={p.href}><a href={p.href} target="_blank" rel="noopener">{p.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="kicker">Explore</h2>
          <ul>
            <li><a href="#services">Services</a></li>
            <li><a href="#studies">Finish studies</a></li>
            <li><a href="#process">About</a></li>
            <li><a href="#enquiry">Start a project</a></li>
          </ul>
        </div>
      </div>
      <div className="site-footer__base">
        <p>© {YEAR} The T-Shirt Guy</p>
        <p>Garment printing and manufacturing, Leicester</p>
      </div>
    </footer>
  )
}
