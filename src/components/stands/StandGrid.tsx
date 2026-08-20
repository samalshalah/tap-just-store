import Link from "next/link";
import { StandCard } from "./StandCard";
import type { ShopResult } from "@/lib/shop-filter";

export function StandGrid({ results }: { results: ShopResult[] }) {
  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="font-semibold text-foreground">
          No stand matches that combination.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Clear a filter, or{" "}
          <Link
            href="/custom-stands"
            className="font-semibold text-accent hover:underline"
          >
            ask us for a custom stand
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {results.map((result) => (
        <StandCard
          key={result.item.stand.id}
          item={result.item}
          fromCents={result.fromCents}
          monthlyCents={result.monthlyCents}
        />
      ))}
    </div>
  );
}
