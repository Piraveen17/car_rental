import mongoose, { Schema, Document, Model } from "mongoose";

export type DemoPaymentStatus = "pending" | "paid" | "failed";

export interface IDemoPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  paymentId: string;
  amount: number;
  status: DemoPaymentStatus;
  createdAt: Date;
}

const DemoPaymentSchema: Schema<IDemoPayment> = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const DemoPayment: Model<IDemoPayment> =
  mongoose.models.DemoPayment ||
  mongoose.model<IDemoPayment>("DemoPayment", DemoPaymentSchema);
