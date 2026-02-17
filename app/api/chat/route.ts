import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { GATEWAY_URL } from "@/lib/config";

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  // Fetch real cars
  let cars = [];
  try {
      const res = await fetch(`${GATEWAY_URL}/cars`, { cache: 'no-store' });
      if (res.ok) {
          cars = await res.json();
      }
  } catch (err) {
      console.error("Failed to fetch cars for Chat", err);
  }

  const systemPrompt = `You are DriveEase AI Assistant, a helpful car rental expert. You help customers find the perfect car for their needs.

Available Cars in Our Fleet:
${cars.map((car: any) => `- ${car.year} ${car.make} ${car.model}: $${car.pricePerDay}/day, ${car.seats} seats, ${car.transmission}, ${car.fuelType}, Location: ${car.location}, Features: ${Array.isArray(car.features) ? car.features.join(", ") : car.features}`).join("\n")}

Your responsibilities:
1. Help customers find cars based on their needs (budget, passengers, trip type, preferences)
2. Provide car recommendations with reasons
3. Answer questions about car features, pricing, and availability
4. Suggest alternatives if a specific car isn't available
5. Help with booking-related questions

Be friendly, concise, and helpful. Always consider the customer's budget, number of passengers, and trip purpose when making recommendations. Format car recommendations clearly with price and key features.`

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    maxOutputTokens: 1000,
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse()
}
