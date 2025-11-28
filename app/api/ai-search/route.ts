import { generateObject } from "ai"
import { z } from "zod"
import { cars } from "@/lib/data"

const searchResultSchema = z.object({
  matchingCarIds: z.array(z.string()).describe("IDs of cars that match the search criteria"),
  explanation: z.string().describe("Brief explanation of why these cars were selected"),
  suggestions: z.array(z.string()).describe("Additional suggestions for the user"),
})

export async function POST(req: Request) {
  const { query } = await req.json()

  const carsList = cars.map((car) => ({
    id: car.id,
    name: `${car.year} ${car.make} ${car.model}`,
    price: car.pricePerDay,
    seats: car.seats,
    transmission: car.transmission,
    fuelType: car.fuelType,
    location: car.location,
    features: car.features,
    status: car.status,
  }))

  const { object } = await generateObject({
    model: "openai/gpt-4o-mini",
    schema: searchResultSchema,
    prompt: `You are a car rental search assistant. Based on the user's natural language query, find the most relevant cars from our fleet.

User Query: "${query}"

Available Cars:
${JSON.stringify(carsList, null, 2)}

Instructions:
- Only return cars with status "active"
- Match based on the user's intent (budget, size, type, features, location, etc.)
- If the query mentions "cheap" or "affordable", prioritize lower-priced cars
- If the query mentions "luxury" or "premium", prioritize higher-priced cars
- If the query mentions family or groups, prioritize cars with more seats
- If the query mentions "electric" or "eco", prioritize electric/hybrid vehicles
- Return up to 5 most relevant car IDs
- Provide a brief, friendly explanation`,
    maxOutputTokens: 500,
  })

  return Response.json(object)
}
