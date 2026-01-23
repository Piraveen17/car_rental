"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // const supabase = createClient() // Removed

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads")
      if (!res.ok) throw new Error("Failed to fetch leads")
      const data = await res.json()
      setLeads(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
     try {
       const res = await fetch(`/api/leads/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status })
       })
       if (!res.ok) throw new Error("Failed to update status")
       fetchLeads()
     } catch (error) {
       alert("Error updating status")
     }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Leads Management</h1>

       <div className="border rounded-lg">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Car Interest</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {leads.map(lead => (
                  <TableRow key={lead.id}>
                     <TableCell>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                        <div className="text-sm text-muted-foreground">{lead.phone}</div>
                     </TableCell>
                     <TableCell>
                        {lead.sale_cars ? (
                           <span>{lead.sale_cars.year} {lead.sale_cars.make} {lead.sale_cars.model}</span>
                        ) : "Unknown Car"}
                     </TableCell>
                     <TableCell className="max-w-xs truncate">
                        {lead.message}
                     </TableCell>
                     <TableCell>
                        <Select 
                           defaultValue={lead.status} 
                           onValueChange={(val) => updateStatus(lead.id, val)}
                        >
                           <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                           </SelectContent>
                        </Select>
                     </TableCell>
                     <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                     </TableCell>
                  </TableRow>
               ))}
               {leads.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center h-24">
                        No leads found.
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
         </Table>
      </div>
    </div>
  )
}
