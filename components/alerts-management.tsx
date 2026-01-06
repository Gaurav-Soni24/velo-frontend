"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, CheckCircle2, AlertTriangle, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

const alertTypes = [
  { value: "missing_mismatch", label: "Missing Mismatch" },
  { value: "returned_manually", label: "Returned Manually" },
  { value: "camera_issue", label: "Camera Issue" },
  { value: "other", label: "Other" },
]

interface Alert {
  _id: string
  bikeId?: {
    bikeId: number
    bikeName: string
  }
  type: string
  message: string
  timestamp: string
  isResolved: boolean
  videoUrl?: string
  imageUrl?: string
}

export function AlertsManagement() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    bikeId: "",
    type: "other",
    message: "",
  })
  const { toast } = useToast()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/alerts`)
      if (!response.ok) throw new Error("Failed to fetch alerts")
      const data = await response.json()
      setAlerts(data.data)
    } catch (error) {
      console.error("[v0] Error fetching alerts:", error)
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create alert")

      toast({
        title: "Success",
        description: "Alert created successfully",
      })

      setDialogOpen(false)
      resetForm()
      fetchAlerts()
    } catch (error) {
      console.error("[v0] Error creating alert:", error)
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      })
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/alerts/${id}/resolve`, {
        method: "PATCH",
      })

      if (!response.ok) throw new Error("Failed to resolve alert")

      toast({
        title: "Success",
        description: "Alert resolved successfully",
      })

      fetchAlerts()
    } catch (error) {
      console.error("[v0] Error resolving alert:", error)
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      bikeId: "",
      type: "other",
      message: "",
    })
  }

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.bikeId && alert.bikeId.bikeName.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const getAlertTypeBadge = (type: string) => {
    const alertType = alertTypes.find((t) => t.value === type)
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
        {alertType?.label || type}
      </span>
    )
  }

  const unresolvedCount = alerts.filter((a) => !a.isResolved).length

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unresolved Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unresolvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Alerts Management</CardTitle>
              <CardDescription>Monitor and resolve system alerts</CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm()
                setDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bike</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No alerts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlerts.map((alert) => {
                      const alertTime = new Date(alert.timestamp)
                      return (
                        <TableRow key={alert._id}>
                          <TableCell>
                            {alert.bikeId ? (
                              <div>
                                <div className="font-medium">{alert.bikeId.bikeName}</div>
                                <div className="text-xs text-muted-foreground">ID: #{alert.bikeId.bikeId}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">System</span>
                            )}
                          </TableCell>
                          <TableCell>{getAlertTypeBadge(alert.type)}</TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm line-clamp-2">{alert.message}</p>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{alertTime.toLocaleTimeString()}</div>
                              <div className="text-xs text-muted-foreground">{alertTime.toLocaleDateString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {alert.isResolved ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950/30">
                                <CheckCircle2 className="w-2 h-2" />
                                Resolved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30">
                                <AlertTriangle className="w-2 h-2" />
                                Pending
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!alert.isResolved && (
                              <Button variant="outline" size="sm" onClick={() => handleResolve(alert._id)}>
                                Resolve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Alert</DialogTitle>
              <DialogDescription>Create a custom system alert</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bikeId">Bike ID (Optional)</Label>
                <Input
                  id="bikeId"
                  placeholder="Enter bike MongoDB ID"
                  value={formData.bikeId}
                  onChange={(e) => setFormData({ ...formData, bikeId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Alert Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {alertTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe the alert..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Alert</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
