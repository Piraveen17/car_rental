import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  userId: string;
  carId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  paymentStatus: "pending" | "paid";
  bookingStatus: "pending_payment" | "confirmed" | "completed" | "cancelled";
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    userId: { type: String, required: true },
    carId: { type: String, required: true },
    startDate: Date,
    endDate: Date,
    totalAmount: Number,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    bookingStatus: {
      type: String,
      enum: ["pending_payment", "confirmed", "completed", "cancelled"],
      default: "pending_payment",
    },
    invoiceUrl: String,
  },
  { timestamps: true }
);

export default mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
