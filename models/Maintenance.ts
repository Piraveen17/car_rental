import mongoose, { Schema, Document } from "mongoose";

export interface IMaintenance extends Document {
  carId: string;
  issue: string;
  cost: number;
  date: Date;
  status: "pending" | "fixed";
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema: Schema<IMaintenance> = new Schema(
  {
    carId: { type: String, required: true },
    issue: String,
    cost: Number,
    date: Date,
    status: { type: String, enum: ["pending", "fixed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Maintenance ||
  mongoose.model<IMaintenance>("Maintenance", MaintenanceSchema);
