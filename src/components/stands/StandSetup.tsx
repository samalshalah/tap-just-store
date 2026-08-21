"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, Check, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/CartContext";
import { validateDestination, urlFitsOnChip } from "@/lib/destination";
import { formatMoney } from "@/lib/money";
import { sizeLabel } from "@/lib/sizes";
import { StandProof } from "./StandProof";

/**
 * Configuring a stand before it goes in the cart.
 *
 * The rule this whole component exists to serve: nothing reaches the cart
 * without the details needed to make it. No "we will email you for your logo
 * later" — that strands the order in the production queue and the customer
 * never replies. By the time a line is in the cart it is a manufacturable
 * thing.
 *
 * Standard: link -> confirm.
 * Branded:  link -> branding -> proof.
 *
 * Branding accepts a logo *or* just a business name. A barber, a food truck
 * and a window cleaner often have no logo file anywhere, and refusing them the
 * upgrade over a missing PNG is refusing the sale.
 */

type Step = "link" | "branding" | "confirm";

export interface SetupTarget {
  standVariantId: number;
  standSlug: string;
  standName: string;
  size: string;
  optionCode: string;
  priceCents: number;
  monthlyCents: number;
  imageUrl: string | null;
  /** "Google review", "menu" — drives the sanity warning on the link. */
  destinationLabel: string;
  /** The platform word printed large on the face, e.g. "GOOGLE REVIEW". */
  badge: string;
  /** The line printed under it, e.g. "Review us on Google". */
  printedHeadline: string;
  /** Per-stand field copy from stand-copy.ts, so the form speaks the platform. */
  urlLabel: string;
  urlPlaceholder: string;
  urlHelp: string;
}

export function StandSetup({
  target,
  onCancel,
}: {
  target: SetupTarget;
  onCancel: () => void;
}) {
  const branded = target.optionCode !== "standard_direct";
  const { addItem } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<Step>("link");
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const check = validateDestination(raw, target.destinationLabel);
  const url = check.ok ? check.url! : "";
  const tooLong = Boolean(url) && !urlFitsOnChip(url);

  // Move focus to the panel when it opens, so a keyboard user is not left
  // behind on the button that is now hidden.
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, []);

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/setup/logo", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as {
        logoPath?: string;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.logoPath) {
        throw new Error(data.error || "That file could not be uploaded.");
      }
      setLogoPath(data.logoPath);
      setLogoUrl(data.url ?? null);
    } catch (err) {
      toast.error("Logo upload failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addToCart() {
    addItem({
      standVariantId: target.standVariantId,
      standSlug: target.standSlug,
      standName: target.standName,
      size: target.size,
      optionCode: target.optionCode,
      priceCents: target.priceCents,
      monthlyCents: target.monthlyCents,
      imageUrl: target.imageUrl,
      setup: branded
        ? {
            destinationUrl: url,
            businessName: businessName.trim(),
            logoPath,
          }
        : { destinationUrl: url },
    });
    toast.success("Added to your cart", {
      description: `${target.standName} — ${sizeLabel(target.size)}`,
    });
    router.push("/cart");
  }

  // Branded stands need a name on the face. Without a logo it is the only
  // thing distinguishing the stand from the standard one the customer would
  // otherwise be paying less for.
  const brandingReady = businessName.trim().length >= 2;

  return (
    <div
      ref={panel}
      tabIndex={-1}
      className="mt-8 space-y-5 rounded-2xl border border-accent/40 bg-card p-5 outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Set up your stand
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {target.standName} · {sizeLabel(target.size)} ·{" "}
            {formatMoney(target.priceCents)}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel setup"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Steps step={step} branded={branded} />

      {step === "link" && (
        <div className="space-y-3">
          <label
            htmlFor="destination"
            className="block text-sm font-bold text-foreground"
          >
            {target.urlLabel}
          </label>
          <input
            id="destination"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={target.urlPlaceholder}
            aria-invalid={touched && !check.ok}
            aria-describedby="destination-help"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent"
          />

          <p id="destination-help" className="text-xs text-muted-foreground">
            {target.urlHelp} We print and program exactly what you give us, so
            it is worth opening it once to check.
          </p>

          {touched && check.error && <Problem>{check.error}</Problem>}
          {check.warning && <Caution>{check.warning}</Caution>}
          {tooLong && (
            <Problem>
              That link is too long to fit on the chip. Use a shorter link, or
              choose a multi-link stand and we will host a short one for you.
            </Problem>
          )}

          {check.ok && !tooLong && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-accent hover:underline"
            >
              Open this link in a new tab to test it →
            </a>
          )}

          <button
            type="button"
            disabled={!check.ok || tooLong}
            onClick={() => setStep(branded ? "branding" : "confirm")}
            className="w-full rounded-full bg-accent px-6 py-3.5 font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === "branding" && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-bold text-foreground"
            >
              Business name to print
            </label>
            <input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={40}
              placeholder="Bella's Barbershop"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {businessName.length}/40 characters. This is printed on the face,
              so spelling and capitals are copied exactly.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-foreground">Logo (optional)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG or JPG, up to 5 MB. No logo? Leave this — we will set your
              business name in type, and it looks good.
            </p>

            {logoUrl ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-white">
                  <Image
                    src={logoUrl}
                    alt="Your uploaded logo"
                    fill
                    className="object-contain"
                    sizes="48px"
                    unoptimized
                  />
                </div>
                <p className="flex-1 text-sm text-foreground">Logo uploaded</p>
                <button
                  type="button"
                  onClick={() => {
                    setLogoPath(null);
                    setLogoUrl(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadLogo(f);
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3.5 text-sm font-semibold text-foreground hover:border-accent/60 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Upload your logo
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Back onClick={() => setStep("link")} />
            <button
              type="button"
              disabled={!brandingReady}
              onClick={() => setStep("confirm")}
              className="flex-1 rounded-full bg-accent px-6 py-3.5 font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              See your proof
            </button>
          </div>
          {!brandingReady && (
            <p className="text-center text-xs text-muted-foreground">
              Add your business name to continue.
            </p>
          )}
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          {branded ? (
            <>
              <p className="text-sm text-muted-foreground">
                This is your proof. Point your phone at the QR code — it is
                real, and it should open your page.
              </p>
              <StandProof
                badge={target.badge}
                headline={target.printedHeadline}
                businessName={businessName.trim()}
                logoUrl={logoUrl}
                destinationUrl={url}
                showQr
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your stand ships with our standard artwork and the chip programmed
              to your link. Nothing is printed with your details on a Standard
              stand.
            </p>
          )}

          <dl className="space-y-1.5 rounded-xl border border-border bg-background p-4 text-sm">
            <Row label="Stand">
              {target.standName} · {sizeLabel(target.size)}
            </Row>
            <Row label="Taps to">
              <span className="break-all">{url}</span>
            </Row>
            {branded && <Row label="Printed name">{businessName.trim()}</Row>}
            {branded && (
              <Row label="Logo">{logoPath ? "Uploaded" : "Text only"}</Row>
            )}
            <Row label="Price">
              {formatMoney(target.priceCents)}
              {target.monthlyCents > 0 &&
                ` then ${formatMoney(target.monthlyCents)}/mo`}
            </Row>
          </dl>

          {branded && (
            <p className="text-xs text-muted-foreground">
              Once printed, a branded stand cannot be returned — check the
              spelling and the link above.
            </p>
          )}

          <div className="flex gap-3">
            <Back onClick={() => setStep(branded ? "branding" : "link")} />
            <button
              type="button"
              onClick={addToCart}
              className="flex-1 rounded-full bg-accent px-6 py-3.5 font-bold text-background transition-opacity hover:opacity-90"
            >
              Looks right — add to cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Steps({ step, branded }: { step: Step; branded: boolean }) {
  const steps: { id: Step; label: string }[] = branded
    ? [
        { id: "link", label: "Link" },
        { id: "branding", label: "Branding" },
        { id: "confirm", label: "Proof" },
      ]
    : [
        { id: "link", label: "Link" },
        { id: "confirm", label: "Confirm" },
      ];
  const current = steps.findIndex((s) => s.id === step);

  return (
    <ol className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
              i < current
                ? "bg-accent/15 text-accent"
                : i === current
                  ? "bg-accent text-background"
                  : "bg-foreground/5 text-muted-foreground"
            }`}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current && <Check className="h-3 w-3" />}
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="h-px w-4 bg-border" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-3.5 text-sm font-semibold text-foreground hover:border-accent/50"
    >
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{children}</dd>
    </div>
  );
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex gap-2 rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function Caution({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
