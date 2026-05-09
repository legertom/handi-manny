"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Send,
  Sparkles,
  X,
  Wrench,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatUIMessage } from "@/lib/chat-agent";

const SUGGESTIONS = [
  "Mount a 65\" TV on a brick wall",
  "Install my window AC",
  "Build a PAX wardrobe",
  "I have a punch list — quote it",
];

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, sendMessage, status, stop, error } = useChat<ChatUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isStreaming = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div
      role="dialog"
      aria-label="Chat with Manny's assistant"
      className="fixed inset-x-3 bottom-3 z-50 flex max-h-[88vh] flex-col overflow-hidden rounded-[18px] border border-rule bg-paper shadow-[0_24px_48px_-12px_rgba(15,23,42,0.45)] sm:inset-x-auto sm:bottom-24 sm:right-5 sm:h-[640px] sm:w-[420px] sm:max-h-[80vh]"
    >
      {/* Header */}
      <div className="relative shrink-0 border-b border-rule bg-ink px-5 py-4 text-paper">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand">
              <Wrench className="size-5" />
            </span>
            <div>
              <p className="font-display text-base font-semibold tracking-tight">
                Ask Manny
              </p>
              <p className="flex items-center gap-1.5 text-xs text-paper/70">
                <span className="size-1.5 rounded-full bg-trust animate-pulse" />
                AI assistant · trained on Manny&rsquo;s price book
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-paper/70 hover:bg-paper/10 hover:text-paper focus-ring"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        {isEmpty ? (
          <Welcome onPick={submit} />
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {status === "submitted" && <ThinkingIndicator />}
            {error && (
              <div className="rounded-[10px] border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
                Something went wrong. Try again, or call (917) 555-0199.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-rule bg-paper px-3 pb-3 pt-2">
        {isStreaming && (
          <button
            type="button"
            onClick={() => stop()}
            className="mb-2 w-full rounded-[10px] border border-rule bg-background py-1.5 text-xs text-muted hover:text-ink focus-ring"
          >
            Stop generating
          </button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2 rounded-[12px] border border-rule-strong bg-paper p-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What needs fixing?"
            disabled={isStreaming}
            className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-base text-ink placeholder:text-muted-soft outline-none disabled:opacity-50 sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            aria-label="Send"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-[8px] text-paper transition-colors",
              input.trim() && !isStreaming
                ? "bg-brand hover:bg-brand-hover"
                : "bg-rule-strong cursor-not-allowed"
            )}
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-soft">
          <ShieldCheck className="size-3" />
          Quotes are estimates. Final price set in booking.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Welcome ---------------- */

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="rounded-[14px] border border-rule bg-background/80 p-4">
        <div className="flex items-start gap-2 text-sm text-ink-soft">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
          <div className="leading-relaxed">
            Hey — I&rsquo;m Manny&rsquo;s assistant. Tell me what you need fixed
            and I&rsquo;ll quote it from the price book and check his calendar.
          </div>
        </div>
      </div>
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Try one
        </p>
        <div className="grid gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-[10px] border border-rule bg-paper px-3.5 py-2.5 text-left text-sm text-ink hover:border-rule-strong focus-ring"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Message ---------------- */

function Message({ message }: { message: ChatUIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-[14px] px-3.5 py-2.5 text-[14.5px] leading-relaxed",
          isUser
            ? "bg-ink text-paper"
            : "bg-background border border-rule text-ink"
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <RichText key={i} text={part.text} muted={isUser} />
            );
          }
          if (part.type.startsWith("tool-")) {
            return <ToolPart key={i} part={part} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1 text-sm text-muted">
      <span className="flex gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-soft [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-soft [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-soft" />
      </span>
      Manny&rsquo;s assistant is thinking…
    </div>
  );
}

/* ---------------- Tool pill ---------------- */

function ToolPart({ part }: { part: { type: string; state?: string } }) {
  const labelMap: Record<string, string> = {
    "tool-listServices": "Checking the price book…",
    "tool-getServiceDetails": "Pulling service details…",
    "tool-getAvailability": "Checking Manny's calendar…",
    "tool-refuseSpecialistJob": "Flagging as specialist work…",
  };
  const label = labelMap[part.type] ?? "Working…";
  const done = part.state === "output-available" || part.state === "result";

  return (
    <div className="my-1.5 inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-2.5 py-1 text-[11px] text-muted">
      {done ? (
        <span className="size-1.5 rounded-full bg-trust" />
      ) : (
        <Loader2 className="size-3 animate-spin text-brand" />
      )}
      <span>{label}</span>
    </div>
  );
}

/* ---------------- Tiny markdown-ish renderer ---------------- */

function RichText({ text, muted }: { text: string; muted?: boolean }) {
  // Lightweight: linkify booking URLs and strip markdown bold/italic markers cleanly.
  const nodes: React.ReactNode[] = [];
  const lines = text.split(/\n+/);
  lines.forEach((line, i) => {
    if (i > 0) nodes.push(<br key={`br-${i}`} />);
    // Match /book?service=<id>
    const re = /(\/book(?:\?service=[a-z0-9-]+)?)/g;
    let lastIdx = 0;
    let m: RegExpExecArray | null;
    let segIdx = 0;
    while ((m = re.exec(line))) {
      if (m.index > lastIdx) {
        nodes.push(
          <span key={`t-${i}-${segIdx++}`}>
            {stripMarkers(line.slice(lastIdx, m.index))}
          </span>
        );
      }
      nodes.push(
        <Link
          key={`l-${i}-${segIdx++}`}
          href={m[1]}
          className={cn(
            "underline underline-offset-2 font-medium",
            muted ? "text-paper" : "text-brand"
          )}
        >
          Book it →
        </Link>
      );
      lastIdx = m.index + m[1].length;
    }
    if (lastIdx < line.length) {
      nodes.push(
        <span key={`t-${i}-${segIdx++}`}>
          {stripMarkers(line.slice(lastIdx))}
        </span>
      );
    }
  });
  return <>{nodes}</>;
}

function stripMarkers(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}
