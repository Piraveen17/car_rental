import mongoose, { Schema, Document } from "mongoose";
import { ICar } from "./Car";
import { IUser } from "./User";

export type PaymentStatus = "pending" | "paid" | "failed";
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface IBooking extends Document {
  bookingId: string;
  userId: string;
  carId: string;
  car?: ICar;
  user?: IUser;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    bookingId: { type: String, required: true },
    userId: { type: String, required: true },
    carId: { type: String, required: true },
    car: { type: Schema.Types.ObjectId, ref: "Car" },
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
