"use client"

import { useState } from "react"
import { users } from "@/lib/data"
import { useBookingsStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Search, UserCheck, UserX } from "lucide-react"

export default function AdminCustomersPage() {
  const { bookings } = useBookingsStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")

  const customers = users.filter((u) => u.role === "customer")

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase()
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    )
  })

  const getCustomerStats = (userId: string) => {
    const customerBookings = bookings.filter((b) => b.userId === userId)
    const totalSpent = customerBookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0)
    return {
      totalBookings: customerBookings.length,
      totalSpent,
    }
  }

  const toggleCustomerStatus = (userId: string, currentStatus: boolean) => {
    const userIndex = users.findIndex((u) => u.id === userId)
    if (userIndex !== -1) {
      users[userIndex].isActive = !currentStatus
      toast({
        title: currentStatus ? "Customer disabled" : "Customer enabled",
        description: `Account has been ${currentStatus ? "disabled" : "enabled"}.`,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground">View and manage customer accounts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle>All Customers</CardTitle>
              <CardDescription>{filteredCustomers.length} customers</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const stats = getCustomerStats(customer.id)
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>{format(new Date(customer.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>{stats.totalBookings}</TableCell>
                      <TableCell className="font-semibold">${stats.totalSpent}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            customer.isActive
                              ? "bg-success text-success-foreground"
                              : "bg-destructive text-destructive-foreground"
                          }
                        >
                          {customer.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCustomerStatus(customer.id, customer.isActive)}
                        >
                          {customer.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Disable
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Enable
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
