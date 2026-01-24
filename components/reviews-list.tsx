"use client";

import { Star, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  users: {
    name: string;
  };
}

interface ReviewsListProps {
  reviews: Review[];
  stats: {
    count: number;
    average: number;
  };
}

export function ReviewsList({ reviews, stats }: ReviewsListProps) {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-[200px_1fr] gap-8">
        {/* Stats Column */}
        <div className="text-center md:text-left space-y-4">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-5xl font-bold">{stats.average}</span>
            <div className="flex gap-1 my-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${
                    s <= Math.round(stats.average)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              Based on {stats.count} reviews
            </p>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
            {reviews.length === 0 && (
                <p className="text-muted-foreground italic">No reviews yet.</p>
            )}
            
            {reviews.map((review) => (
                <Card key={review.id}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{review.users?.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">{review.users?.name || "Anonymous"}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                        </div>
                        <p className="text-sm mt-2">{review.comment}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
