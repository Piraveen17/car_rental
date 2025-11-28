import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Award, Clock, Shield, ChevronRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">About DriveEase</h1>
              <p className="text-lg text-muted-foreground">
                We&apos;re on a mission to make car rental simple, affordable, and enjoyable for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Founded in 2020, DriveEase started with a simple idea: car rental should be as easy as booking a hotel
                room. We noticed that traditional car rental companies made the process complicated, with hidden fees
                and confusing policies.
              </p>
              <p className="text-muted-foreground mb-4">
                Today, we serve thousands of customers across the country, offering a diverse fleet of vehicles from
                economy cars to luxury SUVs. Our commitment to transparency, quality, and customer service has made us
                one of the fastest-growing car rental companies in the industry.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Users, title: "Customer First", description: "Your satisfaction is our top priority" },
                { icon: Award, title: "Quality Fleet", description: "Well-maintained, modern vehicles" },
                { icon: Clock, title: "Reliability", description: "24/7 support when you need it" },
                { icon: Shield, title: "Transparency", description: "No hidden fees, ever" },
              ].map((value, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Hit the Road?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Browse our fleet and find the perfect vehicle for your next adventure.
            </p>
            <Button asChild>
              <Link href="/cars">
                Browse Cars
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
