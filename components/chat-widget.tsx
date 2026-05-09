"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ChatPanel = dynamic(() => import("./chat-panel").then((m) => m.ChatPanel), {
  ssr: false,
});

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat with Manny's assistant"}
        style={{ bottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}
        className={cn(
          "fixed right-5 z-50 flex h-14 items-center gap-3 rounded-full bg-ink pl-5 pr-6 text-paper shadow-[0_8px_30px_-6px_rgba(15,23,42,0.4)] transition-all hover:bg-ink-soft focus-ring",
          open && "scale-95"
        )}
      >
        <span className="relative flex size-8 items-center justify-center rounded-full bg-brand">
          {open ? (
            <X className="size-4" />
          ) : (
            <MessageCircle className="size-4" />
          )}
          {!open && (
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-trust ring-2 ring-ink animate-pulse" />
          )}
        </span>
        <span className="text-sm font-medium tracking-tight">
          {open ? "Close" : "Ask Manny"}
        </span>
      </button>

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}
