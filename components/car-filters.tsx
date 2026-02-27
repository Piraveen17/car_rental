"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";

type Props = {
  makes: string[];
  locations: string[];
  types?: string[];
  /** If true, only render the mobile Sheet trigger button (no desktop sidebar) */
  mobileOnly?: boolean;
};

function updateQuery(
  pathname: string,
  current: URLSearchParams,
  patch: Record<string, string | undefined | null>,
  router: ReturnType<typeof useRouter>
) {
  const next = new URLSearchParams(current);
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null || v === "" || v === "all" || v === "any") {
      next.delete(k);
    } else {
      next.set(k, v);
    }
  }
  // Any filter change should reset pagination
  if (Object.keys(patch).some((k) => k !== "page")) next.delete("page");
  const qs = next.toString();
  router.push(qs ? `${pathname}?${qs}` : pathname);
}

export function CarFiltersComponent({ makes, locations, types, mobileOnly }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const brand = sp.get("brand") || "all";
  const location = sp.get("location") || "all";
  const transmission = sp.get("transmission") || "all";
  const seats = sp.get("seats") || "any";
  const type = sp.get("type") || "all";
  const priceMin = sp.get("price_min") || "";
  const priceMax = sp.get("price_max") || "";
  const yearMin = sp.get("year_min") || "";
  const yearMax = sp.get("year_max") || "";

  const safeMakes = useMemo(
    () => Array.from(new Set((makes || []).filter(Boolean))).sort(),
    [makes]
  );
  const safeLocations = useMemo(
    () => Array.from(new Set((locations || []).filter(Boolean))).sort(),
    [locations]
  );
  const safeTypes = useMemo(
    () => Array.from(new Set((types || []).filter(Boolean))).sort(),
    [types]
  );

  const reset = () => {
    const next = new URLSearchParams(sp);
    [
      "brand",
      "type",
      "location",
      "transmission",
      "seats",
      "price_min",
      "price_max",
      "year_min",
      "year_max",
      "page",
    ].forEach((k) => next.delete(k));
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Brand</Label>
        <Select
          value={brand}
          onValueChange={(value) =>
            updateQuery(pathname, new URLSearchParams(sp), { brand: value }, router)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {safeMakes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {safeTypes.length > 0 && (
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(value) =>
              updateQuery(pathname, new URLSearchParams(sp), { type: value }, router)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any type</SelectItem>
              {safeTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Location</Label>
        <Select
          value={location}
          onValueChange={(value) =>
            updateQuery(
              pathname,
              new URLSearchParams(sp),
              { location: value },
              router
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {safeLocations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Transmission</Label>
        <Select
          value={transmission}
          onValueChange={(value) =>
            updateQuery(
              pathname,
              new URLSearchParams(sp),
              { transmission: value },
              router
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any transmission</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Seats</Label>
        <Select
          value={seats}
          onValueChange={(value) =>
            updateQuery(pathname, new URLSearchParams(sp), { seats: value }, router)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
            <SelectItem value="7">7+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price Range (per day)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) =>
              updateQuery(
                pathname,
                new URLSearchParams(sp),
                { price_min: e.target.value },
                router
              )
            }
            className="w-24"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) =>
              updateQuery(
                pathname,
                new URLSearchParams(sp),
                { price_max: e.target.value },
                router
              )
            }
            className="w-24"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Year Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={yearMin}
            onChange={(e) =>
              updateQuery(
                pathname,
                new URLSearchParams(sp),
                { year_min: e.target.value },
                router
              )
            }
            className="w-24"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={yearMax}
            onChange={(e) =>
              updateQuery(
                pathname,
                new URLSearchParams(sp),
                { year_max: e.target.value },
                router
              )
            }
            className="w-24"
          />
        </div>
      </div>

      <Button variant="outline" onClick={reset} className="w-full bg-transparent">
        <X className="mr-2 h-4 w-4" />
        Reset Filters
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Sheet */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Cars</SheetTitle>
              <SheetDescription>Narrow down your search</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar Filters */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
          </div>
          <FilterContent />
        </div>
      </div>
    </>
  );
}
