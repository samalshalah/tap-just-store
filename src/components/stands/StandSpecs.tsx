import Link from "next/link";
import { Droplets, Printer, ShieldCheck, Smartphone } from "lucide-react";
import { LEGAL } from "@/lib/legal";

/**
 * What the stand is, under the buy box.
 *
 * Every line here is a claim we can stand behind, and each one heads off a
 * specific support email:
 *
 *  - The tap distance stops "I held my phone near it and nothing happened".
 *    The read range really is a couple of centimetres, so the copy says tap,
 *    never "hold near".
 *  - The QR line stops an older-phone customer thinking the product is broken.
 *  - "Water-resistant", not waterproof: the supplier claims waterproof but
 *    supplies no IP rating, and an unsubstantiated objective claim is exactly
 *    what the FTC's substantiation rule is about. It also stops someone
 *    soaking one and asking for a refund.
 *  - The warranty link is here because the FTC's pre-sale availability rule
 *    requires warranty terms on a product over $15 to be readable before the
 *    customer buys, not only after.
 */
export function StandSpecs() {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        What you get
      </h2>

      <ul className="mt-4 space-y-3.5">
        <Spec icon={Printer} title={LEGAL.printClaim}>
          {LEGAL.material.charAt(0).toUpperCase() + LEGAL.material.slice(1)}, printed
          directly. Nothing to peel, curl or lift at the corners.
        </Spec>

        <Spec icon={Smartphone} title="Tap the phone against the stand">
          {LEGAL.chip} chip at {LEGAL.chipFrequency}, no app and no battery. Works on{" "}
          {LEGAL.minIphone} and newer and on NFC Android phones. Older phones use the
          printed QR code, so nobody is locked out.
        </Spec>

        <Spec icon={Droplets} title={LEGAL.waterClaim}>
          Spills, splashes and a damp cloth are no problem. Do not soak it, and keep
          bleach and abrasive cleaners off the printed face.
        </Spec>

        <Spec icon={ShieldCheck} title={LEGAL.warrantyName}>
          We cover defects in materials and workmanship {LEGAL.warrantyTerm}.{" "}
          <Link href="/warranty" className="font-semibold text-accent hover:underline">
            Read the warranty
          </Link>
          .
        </Spec>
      </ul>
    </section>
  );
}

function Spec({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Printer;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
    </li>
  );
}
