import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        // 16px font prevents iOS Safari zoom-on-focus; sm: dials it back.
        "flex h-11 w-full rounded-[10px] border border-rule-strong bg-paper px-3.5 py-2 text-base text-ink shadow-[0_1px_0_rgba(15,23,42,0.04)_inset] transition-colors sm:text-[15px]",
        "placeholder:text-muted-soft",
        "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-[10px] border border-rule-strong bg-paper px-3.5 py-2.5 text-base text-ink shadow-[0_1px_0_rgba(15,23,42,0.04)_inset] transition-colors sm:text-[15px]",
        "placeholder:text-muted-soft",
        "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
