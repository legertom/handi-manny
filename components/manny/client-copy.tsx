"use client";

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

export function ClientCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available — fallback to selection prompt.
      window.prompt("Copy this:", value);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex h-12 items-center justify-center gap-1.5 rounded-[10px] border border-rule bg-paper text-sm font-medium text-ink active:translate-y-px"
    >
      {copied ? (
        <>
          <CheckCircle2 className="size-4 text-trust" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copy address
        </>
      )}
    </button>
  );
}
