"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore, useBookingsStore, useCarsStore } from "@/lib/store"
import { format, formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Car,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ChevronRight,
} from "lucide-react"

const statusConfig = {
  pending_payment: { label: "Pending Payment", color: "bg-warning text-warning-foreground", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-success text-success-foreground", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive text-destructive-foreground", icon: XCircle },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground", icon: CheckCircle2 },
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { bookings } = useBookingsStore()
  const { cars } = useCarsStore()

  const [activityFeed, setActivityFeed] = useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated) router.push("/login")
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user) return
    const feed = bookings
      .filter((b) => b.userId === user.userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((b) => {
        const car = cars.find((c) => c.carId === b.carId)
        return {
          id: b.bookingId,
          message: `${car?.make} ${car?.model} is ${statusConfig[b.bookingStatus].label}`,
          time: new Date(b.updatedAt),
          status: b.bookingStatus,
        }
      })
    setActivityFeed(feed)
  }, [bookings, cars, user])

  if (!isAuthenticated || !user) return null

  const userBookings = bookings
    .filter((b) => b.userId === user.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const upcomingBookings = userBookings.filter(
    (b) => b.bookingStatus === "confirmed" && new Date(b.startDate) > new Date(),
  )

  const pastBookings = userBookings.filter(
    (b) => b.bookingStatus === "completed" || new Date(b.endDate) < new Date(),
  )

  const pendingBookings = userBookings.filter((b) => b.bookingStatus === "pending_payment")

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-10 space-y-8">

          {/* Welcome */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground">Manage your bookings, profile, and activity</p>
          </div>

          {/* Quick Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userBookings.length}</p>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pendingBookings.length}</p>
                      <p className="text-sm text-muted-foreground">Pending Payment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pastBookings.length}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Pending Payments Alert */}
          {pendingBookings.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Card className="border-warning hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-warning flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Pending Payments</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You have {pendingBookings.length} booking(s) awaiting payment.
                      </p>
                      <div className="space-y-2">
                        {pendingBookings.map((booking) => {
                          const car = cars.find((c) => c.carId === booking.carId)
                          return (
                            <div
                              key={booking.bookingId}
                              className="flex items-center justify-between bg-muted/20 p-3 rounded-lg hover:shadow transition-shadow"
                            >
                              <div>
                                <p className="font-medium">
                                  {car?.make} {car?.carModel}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(booking.startDate), "MMM d")} -{" "}
                                  {format(new Date(booking.endDate), "MMM d, yyyy")}
                                </p>
                              </div>
                              <Button size="sm" asChild>
                                <Link href={`/payment/${booking.bookingId}`}>Pay ${booking.totalAmount}</Link>
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Bookings List */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>View and manage all your car rentals</CardDescription>
              </CardHeader>
              <CardContent>
                {userBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No bookings yet</p>
                    <p className="text-muted-foreground mb-4">Start your journey by booking a car</p>
                    <Button asChild>
                      <Link href="/cars">Browse Cars</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {userBookings.map((booking) => {
                        const car = cars.find((c) => c.carId === booking.carId)
                        const status = statusConfig[booking.bookingStatus]
                        const StatusIcon = status.icon

                        return (
                          <motion.div
                            key={booking.bookingId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Car className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  {car?.make} {car?.carModel}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(booking.startDate), "MMM d")} -{" "}
                                  {format(new Date(booking.endDate), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 sm:flex-shrink-0">
                              <Badge className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                              <span className="font-semibold">${booking.totalAmount}</span>
                              {booking.invoiceUrl && (
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={booking.invoiceUrl} target="_blank">
                                    <FileText className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                              {booking.bookingStatus === "pending_payment" && (
                                <Button size="sm" asChild>
                                  <Link href={`/payment/${booking.bookingId}`}>
                                    Pay Now
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>Track your bookings and status updates in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence initial={false}>
                    {activityFeed.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center justify-between p-3 bg-muted/10 dark:bg-muted/20 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <Car className="h-6 w-6 text-primary" />
                          <div>
                            <p className="text-sm">{item.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(item.time, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge className={statusConfig[item.status].color}>{statusConfig[item.status].label}</Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div> */}

        </div>
      </main>

      <Footer />
    </div>
  )
}
