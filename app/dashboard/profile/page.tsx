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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileSchema, type ProfileFormValues } from "@/lib/schemas/auth-schema"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, updateProfile } = useAuthStore()
  const { toast } = useToast()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      nicPassport: "",
    },
  })

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        phone: user.phone || "",
        nicPassport: user.nicPassport || "",
      })
    }
  }, [user, form])

  const { isSubmitting } = form.formState

  if (!isAuthenticated || !user) return null

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      updateProfile({ 
        name: data.name, 
        phone: data.phone, 
        nicPassport: data.nicPassport 
      })

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
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user.email} disabled className="bg-muted dark:bg-gray-800" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.55 }}
                    >
                      <FormField
                        control={form.control}
                        name="nicPassport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NIC / Passport Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your ID number" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-2">Required for car pickup verification</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white transition-all duration-300"
                      >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
