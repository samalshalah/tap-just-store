"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  SIZES,
  OPTIONS,
  OPTION_LABELS,
  SORTS,
  SORT_LABELS,
  type ShopQuery,
} from "@/lib/shop-filter";
import { sizeLabel } from "@/lib/sizes";

interface Option {
  slug: string;
  name: string;
  count: number;
}

/** Builds the next URL from the current one, so filters stack instead of resetting. */
function useHrefBuilder() {
  const pathname = usePathname();
  const search = useSearchParams();

  return (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(search.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-accent bg-accent/10 font-semibold text-accent"
          : "border-border text-foreground/80 hover:border-accent/50"
      }`}
    >
      {children}
    </Link>
  );
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
  const build = useHrefBuilder();
  // The two doors are independent: picking one clears the other.
  const href = (slug: string | null) =>
    build({ type: null, use: null, [param]: slug });

  if (options.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        <Chip href={href(null)} active={active === null}>
          All
        </Chip>
        {options.map((o) => (
          <Chip key={o.slug} href={href(o.slug)} active={active === o.slug}>
            {o.name}
            <span className="ml-1.5 text-xs text-muted-foreground">{o.count}</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}

function SearchBox({ value }: { value: string }) {
  const router = useRouter();
  const build = useHrefBuilder();
  const [text, setText] = useState(value);
  const first = useRef(true);

  // Keep the box in step when the URL changes from a chip or the back button.
  useEffect(() => {
    setText(value);
  }, [value]);

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (text === value) return;
    const id = setTimeout(() => {
      router.replace(build({ q: text.trim() || null }), { scroll: false });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search stands"
        aria-label="Search stands"
        className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
      />
    </div>
  );
}

function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const build = useHrefBuilder();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="hidden sm:inline">Sort</span>
      <select
        value={value}
        onChange={(e) =>
          router.replace(
            build({ sort: e.target.value === "featured" ? null : e.target.value }),
            { scroll: false }
          )
        }
        aria-label="Sort stands"
        className="rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none transition-colors focus:border-accent"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ShopFilters({
  standTypes,
  businessUses,
  query,
  showRails = true,
  resultCount,
}: {
  standTypes: Option[];
  businessUses: Option[];
  query: ShopQuery;
  /** Landing pages already state the category, so they hide the rails. */
  showRails?: boolean;
  resultCount: number;
}) {
  const build = useHrefBuilder();

  const active: { label: string; href: string }[] = [];
  if (query.q) active.push({ label: `"${query.q}"`, href: build({ q: null }) });
  if (query.type) {
    const name = standTypes.find((t) => t.slug === query.type)?.name ?? query.type;
    active.push({ label: name, href: build({ type: null }) });
  }
  if (query.use) {
    const name = businessUses.find((u) => u.slug === query.use)?.name ?? query.use;
    active.push({ label: name, href: build({ use: null }) });
  }
  if (query.size)
    active.push({ label: sizeLabel(query.size), href: build({ size: null }) });
  if (query.option)
    active.push({
      label: OPTION_LABELS[query.option],
      href: build({ option: null }),
    });

  return (
    <div className="space-y-7">
      {showRails && (
        <>
          <Rail
            title="Shop by stand type"
            param="type"
            options={standTypes}
            active={query.type}
          />
          <Rail
            title="Shop by business use"
            param="use"
            options={businessUses}
            active={query.use}
          />
        </>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox value={query.q} />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Size
            </span>
            <Chip href={build({ size: null })} active={query.size === null}>
              All
            </Chip>
            {SIZES.map((s) => (
              <Chip key={s} href={build({ size: s })} active={query.size === s}>
                {sizeLabel(s)}
              </Chip>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Finish
            </span>
            <Chip href={build({ option: null })} active={query.option === null}>
              All
            </Chip>
            {OPTIONS.filter((o) => o !== "hosted_multilink").map((o) => (
              <Chip
                key={o}
                href={build({ option: o })}
                active={query.option === o}
              >
                {OPTION_LABELS[o]}
              </Chip>
            ))}
          </div>

          <SortSelect value={query.sort} />
        </div>
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {resultCount} {resultCount === 1 ? "stand" : "stands"} ·
          </span>
          {active.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              scroll={false}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ))}
          <Link
            href={build({
              q: null,
              type: null,
              use: null,
              size: null,
              option: null,
            })}
            scroll={false}
            className="text-muted-foreground underline underline-offset-4 hover:text-accent"
          >
            Clear all
          </Link>
        </div>
      )}
    </div>
  );
}
