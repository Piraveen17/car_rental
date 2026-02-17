import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="p-4 bg-gray-100 dark:bg-gray-800 border-none shadow-lg">
        <CardContent className="flex space-x-2">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-bounce`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
