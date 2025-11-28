import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CarCard } from "@/components/car-card"
import { cars } from "@/lib/data"
import { Car, Shield, Clock, CreditCard, MapPin, Star, ChevronRight, Sparkles, Bot, Zap } from "lucide-react"
import { ThreeBackground } from "@/components/three-background"
import { AISearchBar } from "@/components/ai-search-bar"

export default function HomePage() {
  const featuredCars = cars.filter((car) => car.status === "active").slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col">
      <ThreeBackground />

      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
          <div className="container px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 backdrop-blur-sm text-primary text-sm font-medium border border-primary/20">
                  <Sparkles className="h-4 w-4" />
                  AI-Powered Car Matching
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
                  Find Your Perfect
                  <span className="text-primary"> Ride</span> Today
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Experience the freedom of the open road with our premium selection of vehicles. Our AI assistant helps
                  you find the perfect match in seconds.
                </p>

                <div className="bg-background/80 backdrop-blur-md rounded-xl p-4 border border-border/50 shadow-lg">
                  <AISearchBar className="w-full" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <Link href="/cars">
                      Browse Cars
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="backdrop-blur-sm bg-background/50">
                    <Link href="/about">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-[4/3] lg:aspect-square">
                <Image
                  src="/luxury-sports-car-3d-render.jpg"
                  alt="Premium rental car"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Zap className="h-4 w-4" />
                Powered by AI
              </div>
              <h2 className="text-3xl font-bold mb-4">Smart Car Rental Experience</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our AI technology makes finding and booking your perfect car easier than ever
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-primary/20 bg-background/80 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">AI Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Describe your ideal car in plain English and our AI finds the perfect match
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-background/80 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">24/7 AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with our AI assistant anytime for instant help and recommendations
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-background/80 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Smart Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized car suggestions based on your preferences and history
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose DriveEase?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We make car rental simple, affordable, and hassle-free
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Car, title: "Wide Selection", description: "Choose from 100+ premium vehicles" },
                { icon: Shield, title: "Fully Insured", description: "Comprehensive coverage included" },
                { icon: Clock, title: "24/7 Support", description: "Round-the-clock customer service" },
                { icon: CreditCard, title: "Easy Payment", description: "Secure and flexible payment options" },
              ].map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Cars Section */}
        <section className="py-16">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Vehicles</h2>
                <p className="text-muted-foreground">Explore our most popular rental options</p>
              </div>
              <Button variant="outline" asChild className="hidden sm:flex bg-transparent">
                <Link href="/cars">
                  View All
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Button asChild>
                <Link href="/cars">View All Cars</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Rent a car in three simple steps</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Tell AI What You Need",
                  description: "Describe your ideal car or use filters to browse our fleet",
                },
                {
                  step: "2",
                  title: "Book & Pay",
                  description: "Select your dates and complete the secure booking process",
                },
                { step: "3", title: "Hit the Road", description: "Pick up your car and enjoy your journey" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Locations Section */}
        <section className="py-16">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Locations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Pick up and drop off at convenient locations across the country
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {["New York", "Los Angeles", "Chicago", "Miami", "San Francisco", "Las Vegas"].map((city) => (
                <Card key={city} className="text-center hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">{city}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Sarah Johnson",
                  rating: 5,
                  comment:
                    "The AI assistant found me the perfect car in seconds! Amazing service and seamless booking.",
                },
                {
                  name: "Michael Chen",
                  rating: 5,
                  comment: "Best car rental experience ever. The AI recommendations were spot on for my family trip.",
                },
                {
                  name: "Emily Davis",
                  rating: 5,
                  comment: "I love how the AI understands exactly what I need. Consistently excellent service.",
                },
              ].map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">&quot;{testimonial.comment}&quot;</p>
                    <p className="font-semibold">{testimonial.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of satisfied customers and experience the AI-powered car rental service
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/cars">
                Book Your Car Now
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
