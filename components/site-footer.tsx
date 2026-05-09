import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-24 border-t border-rule/70 bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted leading-relaxed">
              The dependable handyman for NYC apartments. Serving all five boroughs,
              7 days a week. Honest pricing, on time, every time.
            </p>
            <p className="mt-4 text-xs text-muted-soft">
              Handi-Manny · Brooklyn, NY
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink">Services</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/services/tv-mounting" className="hover:text-ink">TV mounting</Link></li>
              <li><Link href="/services/ac-installation" className="hover:text-ink">AC installation</Link></li>
              <li><Link href="/services/ikea-medium" className="hover:text-ink">IKEA assembly</Link></li>
              <li><Link href="/services/half-day-block" className="hover:text-ink">Half-day block</Link></li>
              <li><Link href="/services" className="hover:text-ink">All services →</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><a href="tel:+19175550199" className="hover:text-ink">(917) 555-0199</a></li>
              <li><a href="mailto:hello@handimanny.com" className="hover:text-ink">hello@handimanny.com</a></li>
              <li><Link href="/#faq" className="hover:text-ink">FAQ</Link></li>
              <li><Link href="/manny" className="hover:text-ink">Manny&rsquo;s desk</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-rule pt-6 text-xs text-muted-soft sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Handi-Manny. All rights reserved.</span>
          <span>Built in Brooklyn. Same-day booking available.</span>
        </div>
      </div>
    </footer>
  );
}
