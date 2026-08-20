"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Option {
  slug: string;
  name: string;
  count: number;
}

function Rail({
  title,
  param,
  options,
  active,
}: {
  title: string;
  param: "type" | "use";
  options: Option[];
  active: string | null;
}) {
  const pathname = usePathname();
  const search = useSearchParams();

  const href = (slug: string | null) => {
    const next = new URLSearchParams(search.toString());
    // The two doors are independent: picking one clears the other.
    next.delete("type");
    next.delete("use");
    if (slug) next.set(param, slug);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        <Link
          href={href(null)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            active === null
              ? "border-accent bg-accent/10 font-semibold text-accent"
              : "border-border text-foreground/80 hover:border-accent/50"
          }`}
        >
          All
        </Link>
        {options.map((o) => (
          <Link
            key={o.slug}
            href={href(o.slug)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              active === o.slug
                ? "border-accent bg-accent/10 font-semibold text-accent"
                : "border-border text-foreground/80 hover:border-accent/50"
            }`}
          >
            {o.name}
            <span className="ml-1.5 text-xs text-muted-foreground">{o.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ShopFilters({
  standTypes,
  businessUses,
  activeType,
  activeUse,
}: {
  standTypes: Option[];
  businessUses: Option[];
  activeType: string | null;
  activeUse: string | null;
}) {
  return (
    <div className="space-y-7">
      <Rail title="Shop by stand type" param="type" options={standTypes} active={activeType} />
      <Rail title="Shop by business use" param="use" options={businessUses} active={activeUse} />
    </div>
  );
}
