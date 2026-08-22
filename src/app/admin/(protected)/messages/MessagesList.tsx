"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Mail, MailOpen } from "lucide-react";
import type { ContactMessage } from "@/lib/schema/contactMessages";
import {
  exportSubscribers,
  markMessageRead,
  setMessageHandled,
} from "@/lib/messages-admin";

/**
 * The contact inbox.
 *
 * Opening a message marks it read, so the unread count reflects what has
 * actually been looked at rather than what has arrived. "Handled" is a
 * separate, deliberate click — reading an enquiry and dealing with it are not
 * the same thing, and conflating them is how one gets forgotten.
 */
export function MessagesList({
  messages,
  subscribers,
}: {
  messages: ContactMessage[];
  subscribers: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(m: ContactMessage) {
    const next = open === m.id ? null : m.id;
    setOpen(next);
    if (next !== null && !m.readAt) {
      startTransition(async () => {
        await markMessageRead(m.id);
        router.refresh();
      });
    }
  }

  async function download() {
    const csv = await exportSubscribers();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {messages.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
          No messages.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              <button
                type="button"
                onClick={() => toggle(m)}
                aria-expanded={open === m.id}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-zinc-50"
              >
                {m.readAt ? (
                  <MailOpen className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                ) : (
                  <Mail className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate ${m.readAt ? "text-zinc-700" : "font-semibold text-zinc-900"}`}
                  >
                    {m.name}
                  </p>
                  <p className="truncate text-sm text-zinc-500">{m.email}</p>
                </div>
                <span
                  className="hidden whitespace-nowrap text-sm text-zinc-500 md:block"
                  suppressHydrationWarning
                >
                  {new Date(m.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {m.handledAt && (
                  <span className="whitespace-nowrap rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-800">
                    Handled
                  </span>
                )}
              </button>

              {open === m.id && (
                <div className="border-t border-zinc-200 bg-zinc-50 p-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-800">
                    {m.message}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(
                        "Re: your message to Tap Rater"
                      )}`}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                      Reply by email
                    </a>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await setMessageHandled(m.id, !m.handledAt);
                          router.refresh();
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-white disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {m.handledAt ? "Mark unhandled" : "Mark handled"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-bold text-zinc-900">Newsletter</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {subscribers} {subscribers === 1 ? "person has" : "people have"} signed
          up. No email platform is connected, so the list lives here — export it
          when you are ready to send something.
        </p>
        <button
          type="button"
          onClick={download}
          disabled={subscribers === 0}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> Download CSV
        </button>
      </div>
    </div>
  );
}
