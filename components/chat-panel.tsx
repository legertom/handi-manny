"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  X,
  Wrench,
  Loader2,
  ShieldCheck,
  CalendarCheck,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatUIMessage } from "@/lib/chat-agent";

const SUGGESTIONS = [
  "Mount a 65\" TV on a brick wall",
  "Install my window AC — book me in",
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

  useEffect(() => {
    if (!isStreaming) {
      inputRef.current?.focus();
    }
  }, [isStreaming]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput("");
    inputRef.current?.focus();
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
            : "bg-paper border border-rule text-ink"
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <Markdown key={i} text={part.text} muted={isUser} />;
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

function ToolPart({ part }: { part: { type: string; state?: string; output?: unknown } }) {
  const labelMap: Record<string, string> = {
    "tool-listServices": "Checking the price book…",
    "tool-getServiceDetails": "Pulling service details…",
    "tool-getAvailability": "Checking Manny's calendar…",
    "tool-refuseSpecialistJob": "Flagging as specialist work…",
    "tool-createBooking": "Creating your booking…",
    "tool-analyzePhoto": "Analyzing your photo…",
  };
  const label = labelMap[part.type] ?? "Working…";
  const done = part.state === "output-available";

  const output = part.output as Record<string, unknown> | undefined;
  if (done && part.type === "tool-createBooking" && output?.success) {
    return <BookingConfirmationCard result={output} />;
  }

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

function BookingConfirmationCard({ result }: { result: Record<string, unknown> }) {
  const start = result.scheduledStart as string;
  const when = start
    ? new Date(start).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="my-2 rounded-[12px] border border-trust/30 bg-trust/5 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-trust">
        <CalendarCheck className="size-4" />
        Booking confirmed
      </div>
      <div className="mt-1.5 space-y-0.5 text-xs text-ink-soft">
        <p>{result.serviceName as string} — ${result.priceDollars as number}</p>
        {when && <p>{when}</p>}
      </div>
      <Link
        href={`/book/confirmation/${result.bookingId as string}`}
        className="mt-2 inline-flex items-center gap-1 rounded-[8px] bg-trust px-3 py-1.5 text-xs font-semibold text-paper hover:bg-trust/90"
      >
        View booking
      </Link>
    </div>
  );
}

/* ---------------- Markdown renderer ---------------- */

function Markdown({ text, muted }: { text: string; muted?: boolean }) {
  const linkClass = cn(
    "inline-flex items-center gap-0.5 font-semibold underline-offset-2 hover:underline",
    muted ? "text-paper" : "text-brand"
  );

  return (
    <div
      className={cn(
        "space-y-2 [&>p]:m-0 [&_strong]:font-semibold [&_em]:italic",
        "[&_ul]:list-none [&_ul]:m-0 [&_ul]:p-0 [&_ul]:space-y-1",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1",
        "[&_li]:relative [&_li]:pl-3.5",
        "[&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-2 [&_ul>li]:before:size-1 [&_ul>li]:before:rounded-full",
        muted
          ? "[&_ul>li]:before:bg-paper/60"
          : "[&_ul>li]:before:bg-brand"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Internal app links open in-app via Next Link; external open in new tab.
          a({ href, children, ...props }) {
            const url = String(href ?? "");
            const internal = url.startsWith("/");
            if (internal) {
              return (
                <Link href={url} className={linkClass} {...props}>
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                {...props}
              >
                {children}
              </a>
            );
          },
          // Render tables as stacked key:value pairs so they don't blow out the chat width.
          // (We also tell the model not to use tables, but this is a safety net.)
          table({ children }) {
            return (
              <div className="my-1 rounded-[8px] border border-rule p-2 text-xs">
                {children}
              </div>
            );
          },
          thead() {
            return null;
          },
          tbody({ children }) {
            return <div className="space-y-1">{children}</div>;
          },
          tr({ children }) {
            return <div className="flex flex-wrap gap-x-2">{children}</div>;
          },
          td({ children }) {
            return <span className="text-ink-soft">{children}</span>;
          },
          th({ children }) {
            return (
              <span className="font-semibold text-ink">{children}</span>
            );
          },
          // Code: keep tiny inline, never block-render in the chat.
          code({ children }) {
            return (
              <code className="rounded bg-rule/60 px-1 py-0.5 font-mono text-[12px] text-ink">
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <div className="text-[13px]">{children}</div>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
