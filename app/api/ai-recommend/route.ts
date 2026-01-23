import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { GATEWAY_URL } from "@/lib/config";

const recommendationSchema = z.object({
  recommendations: z
    .array(
      z.object({
        carId: z.string(),
        score: z.number().min(0).max(100),
        reasons: z.array(z.string()),
        bestFor: z.string(),
      }),
    )
    .max(3),
  personalizedTip: z.string(),
})

export async function POST(req: Request) {
  const { userId, preferences } = await req.json()

  let cars: any[] = [];
  let bookings: any[] = [];

  try {
      const [carsRes, bookingsRes] = await Promise.all([
        fetch(`${GATEWAY_URL}/cars`, { cache: 'no-store' }),
        fetch(`${GATEWAY_URL}/bookings`, { cache: 'no-store' })
      ]);
      if (carsRes.ok) cars = await carsRes.json();
      if (bookingsRes.ok) bookings = await bookingsRes.json();
  } catch (err) {
      console.error("Failed to fetch data for recommendations", err);
  }

  // Get user's booking history
  const userBookings = bookings.filter((b: any) => b.userId === userId)
  const previousCarIds = userBookings.map((b: any) => b.carId)
  // cars might use carId or _id. normalize.
  const previousCars = cars.filter((c: any) => previousCarIds.includes(c.carId || c._id || c.id))

  const activeCars = cars.filter((c: any) => (c.status || "active") === "active")

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: recommendationSchema,
    prompt: `You are an AI car recommendation engine for a rental service.

User Preferences: ${JSON.stringify(preferences || {})}

User's Previous Rentals:
${previousCars.map((c: any) => `- ${c.year} ${c.make} ${c.model} ($${c.pricePerDay}/day)`).join("\n") || "No previous rentals"}

Available Cars:
${activeCars.map((c: any) => `ID: ${c.carId || c._id || c.id}, ${c.year} ${c.make} ${c.model}, $${c.pricePerDay}/day, ${c.seats} seats, ${c.transmission}, ${c.fuelType}, Location: ${c.location}`).join("\n")}

Generate personalized car recommendations based on:
1. User's stated preferences (if any)
2. Previous rental patterns (car types, price range)
3. Value for money
4. Popularity and features

Provide top 3 recommendations with scores and reasons.`,
    maxOutputTokens: 800,
  })

  return Response.json(object)
}
