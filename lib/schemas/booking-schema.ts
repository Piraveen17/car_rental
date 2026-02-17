import { z } from "zod";

export const manualBookingSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  carId: z.string().min(1, "Please select a car"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
  totalAmount: z.coerce.number().min(0, "Total amount must be a positive number"),
  paymentStatus: z.enum(["pending", "paid", "failed"]).default("pending"),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type ManualBookingFormValues = z.infer<typeof manualBookingSchema>;
