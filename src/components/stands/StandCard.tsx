import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/money";
import type { StandListItem } from "@/lib/stands-data";
import { standCopy } from "@/lib/stand-copy";

export function StandCard({
  item,
  fromCents: fromCentsOverride,
  monthlyCents = 0,
}: {
  item: StandListItem;
  /** Price for the shopper's active size and finish, when the grid is filtered. */
  fromCents?: number;
  monthlyCents?: number;
}) {
  const { stand, standType } = item;
  const fromCents = fromCentsOverride ?? item.fromCents;
  const copy = standCopy(stand);

  return (
    <Link
      href={`/stands/${stand.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        {stand.mainImageUrl && (
          <Image
            src={stand.mainImageUrl}
            alt={stand.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-2.5 py-1 text-[10px] font-bold tracking-wider text-background">
          {copy.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-base font-bold leading-snug text-foreground">
          {stand.name}
        </h3>
        {standType && (
          <p className="text-xs text-muted-foreground">{standType.name}</p>
        )}
        <p className="mt-auto pt-3 text-sm font-bold text-foreground">
          From {formatMoney(fromCents)}
          {monthlyCents > 0 && (
            <span className="ml-1 font-medium text-muted-foreground">
              + {formatMoney(monthlyCents)}/mo
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
