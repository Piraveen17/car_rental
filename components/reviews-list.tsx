"use client";

import { Star, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewRow {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  users?: { name: string } | null;
}

interface ReviewsListProps {
  reviews: ReviewRow[];
  stats: {
    count: number;
    averageRating: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewsList({ reviews, stats }: ReviewsListProps) {
  return (
    <div className="space-y-8">

      {/* Summary */}
      <div className="flex items-center gap-4">
        <span className="text-5xl font-bold">{(stats.averageRating || 0).toFixed(1)}</span>
        <div>
          <StarRating value={stats.averageRating || 0} />
          <p className="text-sm text-muted-foreground mt-1">
            Based on {stats.count} review{stats.count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {reviews.length === 0 && (
          <p className="text-muted-foreground italic">No reviews yet.</p>
        )}

        {reviews.map((review) => {
          const initials = review.users?.name?.charAt(0)?.toUpperCase() ?? "U";
          return (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{review.users?.name ?? "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating value={review.rating} />
                </div>

                {review.comment && (
                  <p className="text-sm text-foreground/80">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
