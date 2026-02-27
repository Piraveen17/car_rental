"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Mail, Phone, MapPin, Clock, Loader2, ExternalLink } from "lucide-react"

type FormData = {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const validate = (data: FormData) => {
    const e: Partial<FormData> = {}
    if (!data.name.trim()) e.name = "Please enter your name."
    if (!data.email.trim()) e.email = "Please enter an email."
    else if (!/^\S+@\S+\.\S+$/.test(data.email)) e.email = "Enter a valid email."
    if (!data.subject.trim()) e.subject = "Please tell us the subject."
    if (!data.message.trim() || data.message.trim().length < 10)
      e.message = "Message should be at least 10 characters."
    return e
  }

  const handleChange = (k: keyof FormData, v: string) => {
    setFormData((s) => ({ ...s, [k]: v }))
    if (touched[k]) {
      setErrors(validate({ ...formData, [k]: v }))
    }
  }

  const handleBlur = (k: keyof FormData) => {
    setTouched((t) => ({ ...t, [k]: true }))
    setErrors(validate(formData))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validate(formData)
    setErrors(validation)
    setTouched({ name: true, email: true, subject: true, message: true })

    if (Object.keys(validation).length > 0) {
      toast({
        title: "Validation error",
        description: "Please correct the highlighted fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Simulate an API request — replace with real API call
      await new Promise((res) => setTimeout(res, 900))

      toast({
        title: "Message sent",
        description: "Thank you — we'll respond within 24 hours.",
      })

      setFormData({ name: "", email: "", subject: "", message: "" })
      setTouched({})
      setErrors({})
    } catch (err) {
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
      <Navbar />

      <main className="flex-1">
        <section className="py-20">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white"
              >
                Contact DriveEase
              </motion.h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Questions, feedback, or partnership inquiries — we&apos;re here to help. Fill the form or use the quick
                contact options on the right.
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_420px] gap-8 items-start">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-white/90 dark:bg-slate-800/80 shadow-lg border border-border/40">
                  <CardHeader className="p-6">
                    <CardTitle className="text-lg">Send us a message</CardTitle>
                    <CardDescription className="text-sm">
                      We aim to reply within 24 hours. Provide as much detail as you can.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-sm">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            onBlur={() => handleBlur("name")}
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? "name-error" : undefined}
                            className={`mt-2 ${errors.name ? "border-destructive" : ""}`}
                            placeholder="Your full name"
                          />
                          {errors.name && (
                            <p id="name-error" className="mt-1 text-sm text-destructive">
                              {errors.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-sm">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            onBlur={() => handleBlur("email")}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "email-error" : undefined}
                            className={`mt-2 ${errors.email ? "border-destructive" : ""}`}
                            placeholder="you@company.com"
                          />
                          {errors.email && (
                            <p id="email-error" className="mt-1 text-sm text-destructive">
                              {errors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subject" className="text-sm">
                          Subject
                        </Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => handleChange("subject", e.target.value)}
                          onBlur={() => handleBlur("subject")}
                          aria-invalid={!!errors.subject}
                          aria-describedby={errors.subject ? "subject-error" : undefined}
                          className={`mt-2 ${errors.subject ? "border-destructive" : ""}`}
                          placeholder="What is this about?"
                        />
                        {errors.subject && (
                          <p id="subject-error" className="mt-1 text-sm text-destructive">
                            {errors.subject}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="message" className="text-sm">
                          Message
                        </Label>
                        <Textarea
                          id="message"
                          rows={6}
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          onBlur={() => handleBlur("message")}
                          aria-invalid={!!errors.message}
                          aria-describedby={errors.message ? "message-error" : undefined}
                          className={`mt-2 resize-y ${errors.message ? "border-destructive" : ""}`}
                          placeholder="Tell us the details..."
                        />
                        {errors.message && (
                          <p id="message-error" className="mt-1 text-sm text-destructive">
                            {errors.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="inline-flex items-center gap-2"
                          aria-disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          <span>{isLoading ? "Sending..." : "Send Message"}</span>
                        </Button>

                        <div className="text-sm text-muted-foreground">
                          <div>Prefer a faster response?</div>
                          <a
                            href="mailto:support@driveease.com"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            aria-label="Email support"
                          >
                            support@driveease.com <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact Info / Map */}
              <motion.aside
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <Card className="bg-gradient-to-tr from-white/60 to-primary/5 dark:from-slate-800/60 dark:to-slate-800/30 border border-border/40 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">Quick Contact</h3>
                        <p className="text-sm text-muted-foreground">Available Mon — Sun</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">Response</p>
                        <p className="text-muted-foreground">Within 24 hrs</p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Head Office</p>
                          <p className="text-sm text-muted-foreground">
                            1234 Rental Street<br />
                            New York, NY 10001
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Phone</p>
                          <a href="tel:+15551234567" className="text-sm text-muted-foreground hover:underline">
                            +1 (555) 123-4567
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Email</p>
                          <a href="mailto:support@driveease.com" className="text-sm text-muted-foreground hover:underline">
                            support@driveease.com
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Hours</p>
                          <p className="text-sm text-muted-foreground">
                            Mon - Fri: 8:00 — 20:00<br />
                            Sat - Sun: 09:00 — 18:00
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Map placeholder — replace with embed or Map component */}
                <Card className="overflow-hidden">
                  <div className="relative h-56 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900">
                    <div className="absolute inset-0 p-4 flex flex-col justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Our main hub</p>
                        <p className="text-xs text-muted-foreground">New York, NY</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <a
                          href="https://maps.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          Open in Maps <ExternalLink className="h-4 w-4" />
                        </a>
                        <div className="text-xs text-muted-foreground">Map preview</div>
                      </div>
                    </div>

                    {/* Simple visual placeholder — swap this for <iframe> or map component */}
                    <div className="absolute inset-0 opacity-40">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="g" x1="0" x2="1">
                            <stop offset="0" stopColor="#e2e8f0" />
                            <stop offset="1" stopColor="#f8fafc" />
                          </linearGradient>
                        </defs>
                        <rect width="800" height="400" fill="url(#g)"></rect>
                        <g fill="#cbd5e1" opacity="0.6">
                          <circle cx="120" cy="80" r="18" />
                          <circle cx="300" cy="150" r="12" />
                          <circle cx="420" cy="220" r="10" />
                          <circle cx="680" cy="120" r="16" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </Card>
              </motion.aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
