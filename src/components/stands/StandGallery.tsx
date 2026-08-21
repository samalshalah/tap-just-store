"use client";

import Image from "next/image";
import type { StandOptionCode } from "./StandDetail";

interface View {
  option: StandOptionCode;
  label: string;
  url: string;
}

/**
 * The product image on a stand page.
 *
 * There is one frame, not a stack. Choosing Branded + QR swaps what is in it,
 * because a shopper comparing two finishes wants them in the same place at the
 * same size — a second picture further down the page makes them scroll to
 * compare and reads as an extra product rather than the same one.
 *
 * The thumbnails work both ways: they show which finish is on screen and
 * selecting one changes the finish, so the picture and the price never
 * disagree.
 */
export function StandGallery({
  standName,
  views,
  option,
  onOption,
}: {
  standName: string;
  views: View[];
  option: StandOptionCode;
  onOption: (option: StandOptionCode) => void;
}) {
  if (views.length === 0) return null;

  const active = views.find((v) => v.option === option) ?? views[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-white">
        {views.map((view) => (
          // Every view is rendered and cross-faded rather than swapped, so the
          // branded image is already decoded when it is selected and the frame
          // never flashes empty.
          <Image
            key={view.option}
            src={view.url}
            alt={
              view.option === "branded_qr_direct"
                ? `${standName} with your logo, business name and a printed QR code`
                : standName
            }
            fill
            priority={view.option === views[0].option}
            sizes="(max-width: 1024px) 100vw, 560px"
            className={`object-contain transition-opacity duration-300 ${
              view.option === active.option ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {views.length > 1 && (
        <div className="mt-3 flex gap-3">
          {views.map((view) => {
            const isActive = view.option === active.option;
            return (
              <button
                key={view.option}
                type="button"
                onClick={() => onOption(view.option)}
                aria-pressed={isActive}
                className={`group flex-1 overflow-hidden rounded-xl border bg-white p-1 text-left transition-colors ${
                  isActive ? "border-accent" : "border-border hover:border-accent/50"
                }`}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  <Image
                    src={view.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                </div>
                <span
                  className={`block px-1 py-1.5 text-center text-[11px] font-bold ${
                    isActive ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {view.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
