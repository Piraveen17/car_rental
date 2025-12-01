"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarCard } from "@/components/car-card";
import {
  Car,
  Shield,
  Clock,
  CreditCard,
  MapPin,
  Star,
  ChevronRight,
  Sparkles,
  Bot,
  Zap,
} from "lucide-react";
import { ThreeBackground } from "@/components/three-background";
import { AISearchBar } from "@/components/ai-search-bar";
import { FeaturedCars } from "@/components/featured-cars";
import { motion } from "framer-motion";

export default function HomePage() {
  const features = [
    { icon: Car, title: "Wide Selection", desc: "100+ premium vehicles" },
    { icon: Shield, title: "Fully Insured", desc: "Comprehensive coverage" },
    { icon: Clock, title: "24/7 Support", desc: "Always here for you" },
    { icon: CreditCard, title: "Easy Payment", desc: "Secure & flexible" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      rating: 5,
      comment:
        "The AI assistant found me the perfect car in seconds — booking was seamless.",
    },
    {
      name: "Michael Chen",
      rating: 5,
      comment: "Fast, friendly and reliable. Great selection for family trips.",
    },
    {
      name: "Emily Davis",
      rating: 5,
      comment: "Clear pricing and excellent support. Will use again.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ThreeBackground />

      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-36 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {/* soft gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 backdrop-blur-sm text-primary text-sm font-medium border border-primary/20">
                  <Sparkles className="h-4 w-4" />
                  AI-Powered Car Matching
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-white"
                >
                  Find your perfect <span className="text-primary">ride</span> —
                  faster.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                  className="text-lg text-muted-foreground max-w-xl"
                >
                  DriveEase blends AI-driven recommendations with a curated
                  fleet so you get the ideal car for your trip — no guesswork,
                  no hassle.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                >
                  <div className="bg-background/70 backdrop-blur-md rounded-xl p-4 border border-border/40 shadow-sm">
                    <AISearchBar />
                  </div>
                </motion.div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <Button size="lg" asChild>
                    <Link
                      href="/cars"
                      className="inline-flex items-center gap-2"
                    >
                      Browse Cars <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="backdrop-blur-sm bg-background/40"
                  >
                    <Link href="/about">Learn More</Link>
                  </Button>

                  <div className="ml-auto hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>Instant matches</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span>AI assistant</span>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-full rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br from-white/60 to-primary/5"
              >
                <div className="relative aspect-[4/3] lg:aspect-square w-full">
                  <Image
                    src="/luxury-sports-car-3d-render.jpg"
                    alt="Premium rental car"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* floating stats card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="absolute left-6 bottom-6 rounded-lg bg-white/90 dark:bg-gray-900/80 border border-border/40 p-4 shadow-lg w-64 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">
                        Avg. rating
                      </p>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span className="font-semibold">4.9</span>
                        <span className="text-sm text-muted-foreground">
                          /5 (3.2k)
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Fastest pickup
                      </p>
                      <p className="font-semibold">Under 15 min</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* QUICK FEATURES */}
        <section className="py-14 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Zap className="h-4 w-4" />
                Powered by AI
              </div>
              <h2 className="text-3xl font-bold">
                Smart Car Rental Experience
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
                AI recommendations, instant booking, and exceptional support —
                all in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-primary/20 bg-background/80 backdrop-blur-sm hover:shadow-xl transition">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">AI Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Tell the AI what you need — it delivers filtered, relevant
                    results.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-background/80 backdrop-blur-sm hover:shadow-xl transition">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">24/7 Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant help and personalized recommendations whenever you
                    need.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-background/80 backdrop-blur-sm hover:shadow-xl transition">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Personalized Picks</h3>
                  <p className="text-sm text-muted-foreground">
                    Suggestions that learn from your preferences and booking
                    history.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose DriveEase?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We make car rental simple, affordable, and hassle-free.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, idx) => (
                <Card
                  key={idx}
                  className="text-center hover:scale-[1.02] transition-transform"
                >
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED CARS (reusable) */}
        <section>
          <FeaturedCars />
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Rent in three simple steps.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Tell AI What You Need",
                  desc: "Describe your ideal car or use filters to browse.",
                },
                {
                  step: "2",
                  title: "Book & Pay",
                  desc: "Select dates and complete secure payment.",
                },
                {
                  step: "3",
                  title: "Hit the Road",
                  desc: "Pick up your car and enjoy your journey.",
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* LOCATIONS */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Our Locations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Pick up and drop off at convenient spots across the country.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                "New York",
                "Los Angeles",
                "Chicago",
                "Miami",
                "San Francisco",
                "Las Vegas",
              ].map((city) => (
                <Card
                  key={city}
                  className="text-center hover:border-primary transition-colors cursor-pointer"
                >
                  <CardContent className="p-4">
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">{city}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                What Our Customers Say
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * idx }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4">
                        “{t.comment}”
                      </p>
                      <p className="font-semibold">{t.name}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands who trust DriveEase for fast, transparent rentals.
            </p>

            <Button size="lg" variant="secondary" asChild>
              <Link href="/cars" className="inline-flex items-center gap-2">
                Book Your Car Now <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
