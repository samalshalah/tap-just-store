"use client";

import { useMemo, useState } from "react";
import { StandGallery } from "./StandGallery";
import { StandBuyBox, type VariantLite } from "./StandBuyBox";
import { StandSpecs } from "./StandSpecs";
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
  variants,
  mainImageUrl,
  brandedImageUrl,
  tiers,
  children,
}: {
  standName: string;
  variants: VariantLite[];
  mainImageUrl: string | null;
  brandedImageUrl: string | null;
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
        />
        <StandSpecs />
      </div>
    </div>
  );
}
