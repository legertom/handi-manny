import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/estimate", label: "Instant estimate" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#reviews", label: "Reviews" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-rule/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center focus-ring">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-soft hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <a href="tel:+19175550199" className="gap-1.5">
              <Phone className="size-4" />
              <span className="hidden lg:inline">(917) 555-0199</span>
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/book">Book a job</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
