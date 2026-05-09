import { cn } from "@/lib/utils";

/**
 * Wordmark fallback. To use the actual logo image, save the file as
 * `public/logo.png` and switch to the <LogoImage /> variant below.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-[20px] tracking-tight",
        className
      )}
    >
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-[8px] bg-ink text-paper"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 7l-1.5 1.5 4 4L18 11l3-3-4-4-3 3z" />
          <path d="M12.5 8.5L4 17v3h3l8.5-8.5" />
        </svg>
      </span>
      <span className="font-extrabold tracking-tight">
        <span className="text-ink">HANDI</span>
        <span className="text-brand">·</span>
        <span className="text-brand">MANNY</span>
      </span>
    </span>
  );
}

// Once you save the PNG to public/logo.png, swap the import in site-header.tsx
// to use this component instead of <Logo />.
//
// import Image from "next/image";
// export function LogoImage({ className }: { className?: string }) {
//   return (
//     <Image
//       src="/logo.png"
//       alt="Handi-Manny"
//       width={140}
//       height={42}
//       priority
//       className={cn("h-9 w-auto", className)}
//     />
//   );
// }
