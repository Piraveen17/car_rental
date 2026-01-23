"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, User } from "lucide-react"
import { motion } from "framer-motion"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, updateProfile } = useAuthStore()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [nicPassport, setNicPassport] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone || "")
      setNicPassport(user.nicPassport || "")
    }
  }, [user])

  if (!isAuthenticated || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      updateProfile({ name, phone, nicPassport })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch {
      toast({
        title: "Update failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-10 max-w-2xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Card className="shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <CardHeader className="bg-primary/5 dark:bg-primary/20 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center group relative overflow-hidden">
                    <User className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                    <motion.div
                      className="absolute inset-0 bg-primary/5 dark:bg-primary/20 opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl">Profile Settings</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} disabled className="bg-muted dark:bg-gray-800" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="nicPassport">NIC / Passport Number</Label>
                    <Input
                      id="nicPassport"
                      placeholder="Enter your ID number"
                      value={nicPassport}
                      onChange={(e) => setNicPassport(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Required for car pickup verification</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white transition-all duration-300"
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
