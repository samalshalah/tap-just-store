"use client";

import { useState } from "react";

export function CustomStandsForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.name ?? ""),
          email: String(data.email ?? ""),
          phone: String(data.phone ?? ""),
          message: [
            `CUSTOM STAND REQUEST`,
            `Business: ${data.business ?? ""}`,
            `Industry: ${data.industry ?? ""}`,
            `Quantity: ${data.quantity ?? ""}`,
            ``,
            `Goal: ${data.goal ?? ""}`,
          ].join("\n"),
        }),
      });
      if (!res.ok) throw new Error("Something went wrong. Please try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-accent/40 bg-accent/5 p-8 text-center">
        <h2 className="font-display text-xl font-bold text-foreground">Request received</h2>
        <p className="mt-2 text-muted-foreground">
          We will come back to you with a plan and a price. If it is urgent, reply to the
          confirmation and we will move it up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold text-foreground">Tell us about the project</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Your name" name="name" required />
        <Field label="Business name" name="business" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Phone (optional)" name="phone" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Industry</span>
          <select
            name="industry"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground"
          >
            {["Automotive","Restaurant / Food","Hotel / Travel","Healthcare / Dental","Home Services","Legal","Real Estate","Beauty / Salon / Wellness","Ecommerce / Online Brand","Retail / Local Business","Other"].map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Roughly how many stands?</span>
          <select
            name="quantity"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground"
          >
            {["10 – 25","25 – 50","50 – 100","100+","Not sure yet"].map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          What are you trying to achieve?
        </span>
        <textarea
          name="goal"
          rows={4}
          required
          placeholder="e.g. place stands in 50 salons so customers can request a consultation, and track which salons send the most leads"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-full bg-accent px-6 py-3.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send request"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        No payment now. We reply with a plan and a price first.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground"
      />
    </label>
  );
}
