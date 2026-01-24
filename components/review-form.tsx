"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

interface ReviewFormProps {
  carId: string;
  bookingId: string; // The completed booking ID
  onSuccess: () => void;
}

export function ReviewForm({ carId, bookingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
        toast({ title: "Please enter a comment", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        const res = await apiClient.post("/reviews", {
            carId,
            bookingId,
            rating,
            comment
        });

        if (res.ok) {
            toast({ title: "Review submitted!" });
            setOpen(false);
            onSuccess();
        } else {
            const err = await res.json();
            toast({ title: "Error", description: err.error, variant: "destructive" });
        }
    } catch (e) {
        toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button variant="outline">Write a Review</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rate your experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star} 
                            onClick={() => setRating(star)}
                            className={`p-1 transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                            <Star className={`h-8 w-8 ${rating >= star ? 'fill-current' : ''}`} />
                        </button>
                    ))}
                </div>
                <Textarea 
                    placeholder="Share your experience..." 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                />
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
  );
}
