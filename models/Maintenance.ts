import mongoose, { Schema, Document } from "mongoose";
import { ICar } from "@/models/Car";

export type MaintenanceStatus = "pending" | "fixed";
export interface IMaintenance extends Document {
  recordId: string;
  carId: string;
  car?: ICar;
  issue: string;
  cost: number;
  date: Date;
  status: MaintenanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema: Schema<IMaintenance> = new Schema(
  {
    recordId: { type: String, required: true },
    carId: { type: String, required: true },
    car: { type: Schema.Types.ObjectId, ref: "Car" },
    issue: String,
    cost: Number,
    date: Date,
    status: { type: String, enum: ["pending", "fixed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Maintenance ||
  mongoose.model<IMaintenance>("Maintenance", MaintenanceSchema);
