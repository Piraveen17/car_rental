import mongoose, { Schema, Document, Model } from "mongoose";

export type TransmissionType = "manual" | "automatic";
export type CarStatus = "active" | "inactive" | "maintenance";

export interface ICar extends Document {
  carId: string;
  make: string;
  carModel: string;
  year: number;
  pricePerDay: number;
  transmission: TransmissionType;
  seats: number;
  fuelType: string;
  images: string[];
  features: string[];
  location: string;
  status: CarStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CarPayload = {
  make: string;
  carModel: string;
  year: number;
  pricePerDay: number;
  transmission: TransmissionType;
  seats: number;
  fuelType: string;
  location: string;
  status: CarStatus;
  description?: string;
  features: string[];
  images: string[];
};

const CarSchema: Schema<ICar> = new Schema(
  {
    carId: { type: String, required: true },
    make: { type: String, required: true },
    carModel: { type: String, required: true },
    year: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    transmission: {
      type: String,
      enum: ["manual", "automatic"],
      required: true,
    },
    seats: { type: Number, required: true },
    fuelType: { type: String, required: true },
    images: { type: [String], default: [] },
    features: { type: [String], default: [] },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    description: { type: String },
  },
  { timestamps: true }
);

export const Car: Model<ICar> =
  mongoose.models.Car || mongoose.model<ICar>("Car", CarSchema);
