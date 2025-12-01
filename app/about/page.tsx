"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { Users, Award, Clock, Shield, ChevronRight } from "lucide-react"

export default function AboutPage() {
  const values = [
    { icon: Users, title: "Customer First", description: "Your satisfaction is our top priority" },
    { icon: Award, title: "Quality Fleet", description: "Well-maintained, modern vehicles guaranteed" },
    { icon: Clock, title: "Reliability", description: "24/7 support, wherever you are" },
    { icon: Shield, title: "Transparency", description: "Honest pricing with no hidden charges" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />

      <main className="flex-1">

        {/* ----------------------------------------------------- */}
        {/* 🔥 HERO SECTION (Parallax + Floating Icons) */}
        {/* ----------------------------------------------------- */}
        <section className="relative py-32 overflow-hidden">

          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90"></div>

          {/* Parallax circles */}
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl"
          ></motion.div>

          <motion.div
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-16 right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl"
          ></motion.div>

          <div className="container mx-auto px-4 relative z-10 text-center text-white">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg"
            >
              About DriveEase
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-xl max-w-2xl mx-auto"
            >
              Experience the future of car rentals — fast, transparent, and worry-free.
            </motion.p>
          </div>

          {/* Bottom curved separator */}
          <div className="absolute bottom-0 left-0 w-full h-20 bg-white dark:bg-gray-900 rounded-t-[50%]"></div>
        </section>

        {/* ----------------------------------------------------- */}
        {/* 🔥 STORY SECTION (Image + Animated Text) */}
        {/* ----------------------------------------------------- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-14">

            {/* Image */}
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              src="/assets/car-rental.jpg"
              alt="story image"
              className="rounded-xl shadow-xl w-full lg:w-1/2"
            />

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:w-1/2 space-y-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Our Journey
              </h2>

              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                DriveEase was born in 2020 with a mission to modernize and simplify the
                car rental experience. From hidden fees to outdated processes — we set
                out to change it all.
              </p>

              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Today, thousands of travelers trust DriveEase for premium vehicles,
                transparent pricing, and unmatched customer service — nationwide.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ----------------------------------------------------- */}
        {/* 🔥 VALUES SECTION (Hover Animation + 3D Motion) */}
        {/* ----------------------------------------------------- */}
        <section className="py-24">
          <div className="container mx-auto px-4">

            <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">
              What Drives Us
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">

              {values.map((val, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.07, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Card className="p-6 shadow-lg border-0 bg-white dark:bg-gray-800 hover:shadow-2xl transition">
                    <CardContent className="text-center">

                      <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mx-auto mb-4">
                        <val.icon className="h-7 w-7 text-indigo-600 dark:text-indigo-300" />
                      </div>

                      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{val.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{val.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- */}
        {/* 🔥 CTA SECTION */}
        {/* ----------------------------------------------------- */}
        <section className="py-24 text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-4"
          >
            Ready for Your Next Adventure?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl mx-auto mb-8 text-lg opacity-90"
          >
            Explore our fleet and choose the perfect vehicle for your journey.
          </motion.p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Button
              asChild
              className="bg-white text-indigo-600 hover:text-indigo-800 px-6 py-6 text-lg shadow-lg"
            >
              <Link href="/cars">
                Browse Cars <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
