"use client";

import { useMemo, useState } from "react";
import { StandGallery } from "./StandGallery";
import { StandBuyBox, type VariantLite } from "./StandBuyBox";
import { StandSpecs } from "./StandSpecs";
import { StandSetup, type SetupTarget } from "./StandSetup";
import type { VolumeTierRule } from "@/lib/pricing";

export type StandOptionCode = "standard_direct" | "branded_qr_direct";

/**
 * Owns the two choices a stand page makes — size and finish — so the picture
 * and the buy box cannot disagree.
 *
 * They used to be separate: the buy box held the selection and the gallery was
 * a server-rendered image that never changed, so picking Branded + QR appended
 * a second picture underneath instead of showing the branded stand in the main
 * frame. State lives here now and both halves read it.
 */
export function StandDetail({
  standName,
  standSlug,
  variants,
  mainImageUrl,
  brandedImageUrl,
  destinationLabel,
  badge,
  printedHeadline,
  urlLabel,
  urlPlaceholder,
  urlHelp,
  tiers,
  children,
}: {
  standName: string;
  standSlug: string;
  variants: VariantLite[];
  mainImageUrl: string | null;
  brandedImageUrl: string | null;
  destinationLabel: string;
  /** The platform word printed large on the face. */
  badge: string;
  printedHeadline: string;
  /** Per-stand field copy, so the setup form speaks the platform's language. */
  urlLabel: string;
  urlPlaceholder: string;
  urlHelp: string;
  tiers: VolumeTierRule[];
  /** The static copy — title, badge, description — rendered above the buy box. */
  children: React.ReactNode;
}) {
  const sizes = useMemo(
    () =>
      Array.from(new Set(variants.filter((v) => v.active).map((v) => v.size)))
        .sort()
        .reverse(),
    [variants]
  );

  const [size, setSize] = useState(sizes[0] ?? "a5");
  const [option, setOption] = useState<StandOptionCode>("standard_direct");
  const [setup, setSetup] = useState<SetupTarget | null>(null);

  const views = useMemo(() => {
    const list: { option: StandOptionCode; label: string; url: string }[] = [];
    if (mainImageUrl)
      list.push({ option: "standard_direct", label: "Standard", url: mainImageUrl });
    if (brandedImageUrl)
      list.push({
        option: "branded_qr_direct",
        label: "Branded + QR",
        url: brandedImageUrl,
      });
    return list;
  }, [mainImageUrl, brandedImageUrl]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <StandGallery
        standName={standName}
        views={views}
        option={option}
        onOption={setOption}
      />

      <div>
        {children}
        <StandBuyBox
          variants={variants}
          sizes={sizes}
          size={size}
          onSize={setSize}
          option={option}
          onOption={setOption}
          tiers={tiers}
          onContinue={(variant) =>
            setSetup({
              standVariantId: variant.id,
              standSlug,
              standName,
              size: variant.size,
              optionCode: variant.optionCode,
              priceCents: variant.priceCents,
              monthlyCents: variant.monthlyCents,
              // `||`, not `??`: these columns default to an empty string
              // rather than NULL, and an empty string is not nullish — so
              // `??` happily passed "" through and the cart rendered a blank
              // square for every stand without a branded render.
              imageUrl:
                (variant.optionCode === "standard_direct"
                  ? mainImageUrl
                  : brandedImageUrl || mainImageUrl) || null,
              destinationLabel,
              badge,
              printedHeadline,
              urlLabel,
              urlPlaceholder,
              urlHelp,
            })
          }
        />
        {setup && (
          <StandSetup target={setup} onCancel={() => setSetup(null)} />
        )}
        <StandSpecs />
      </div>
    </div>
  );
}
