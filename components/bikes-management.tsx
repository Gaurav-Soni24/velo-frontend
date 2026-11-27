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
import { Plus, Pencil, Trash2, Search, Circle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL, apiFetch } from "@/lib/api"

const bikeStatuses = [
  { value: "available", label: "Available", color: "bg-[#6B9A00]/10 text-[#3F5A00] dark:bg-[#6B9A00]/20 dark:text-[#5fd6c8]" },
  { value: "rented", label: "Rented", color: "bg-[#2440F0]/10 text-[#1A2FB8] dark:bg-[#2440F0]/20 dark:text-[#6fb8ee]" },
  { value: "maintenance", label: "Maintenance", color: "bg-[#C77700]/12 text-[#8A5A00] dark:bg-[#C77700]/20 dark:text-[#f5a06b]" },
  { value: "missing", label: "Missing", color: "bg-[#E5401F]/10 text-[#B3301A] dark:bg-[#E5401F]/20 dark:text-[#f2866c]" },
]

interface Bike {
  _id: string
  bikeId: number
  bikeName: string
  status: string
  lastSeenCameraTime?: string
  lastSeenLocation?: string
  assignedRFID?: string
  currentRentedBy?: {
    _id: string
    name: string
    rollNumber: string
    branch: string
    semester: number
  }
}

export function BikesManagement() {
  const [bikes, setBikes] = useState<Bike[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBike, setEditingBike] = useState<Bike | null>(null)
  const [formData, setFormData] = useState({
    bikeId: "",
    bikeName: "",
    status: "available",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchBikes()
  }, [])

  const fetchBikes = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`${API_BASE_URL}/api/admin/bikes`)
      if (!response.ok) throw new Error("Failed to fetch bikes")
      const data = await response.json()
      setBikes(data.data)
    } catch (error) {
      console.error("[v0] Error fetching bikes:", error)
      toast({
        title: "Error",
        description: "Failed to load bikes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingBike ? `${API_BASE_URL}/api/admin/bikes/${editingBike._id}` : `${API_BASE_URL}/api/admin/bikes`

      const payload = editingBike
        ? { bikeName: formData.bikeName, status: formData.status }
        : { bikeId: Number.parseInt(formData.bikeId), bikeName: formData.bikeName }

      const response = await apiFetch(url, {
        method: editingBike ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save bike")

      toast({
        title: "Success",
        description: `Bike ${editingBike ? "updated" : "created"} successfully`,
      })

      setDialogOpen(false)
      resetForm()
      fetchBikes()
    } catch (error) {
      console.error("[v0] Error saving bike:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingBike ? "update" : "create"} bike`,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bike?")) return

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/bikes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete bike")

      toast({
        title: "Success",
        description: "Bike deleted successfully",
      })

      fetchBikes()
    } catch (error) {
      console.error("[v0] Error deleting bike:", error)
      toast({
        title: "Error",
        description: "Failed to delete bike",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (bike: Bike) => {
    setEditingBike(bike)
    setFormData({
      bikeId: bike.bikeId.toString(),
      bikeName: bike.bikeName,
      status: bike.status,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingBike(null)
    setFormData({
      bikeId: "",
      bikeName: "",
      status: "available",
    })
  }

  const filteredBikes = bikes.filter(
    (bike) =>
      bike.bikeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bike.bikeId.toString().includes(searchQuery) ||
      bike.status.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const statusObj = bikeStatuses.find((s) => s.value === status)
    if (!statusObj) return null

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusObj.color}`}
      >
        <Circle className="w-2 h-2 fill-current" />
        {statusObj.label}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Bikes Management</CardTitle>
              <CardDescription>Manage bike inventory and track availability</CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm()
                setDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bike
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search bikes by ID, name, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bike ID</TableHead>
                    <TableHead>Bike Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rented By</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBikes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No bikes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBikes.map((bike) => (
                      <TableRow key={bike._id}>
                        <TableCell className="font-medium">#{bike.bikeId}</TableCell>
                        <TableCell>{bike.bikeName}</TableCell>
                        <TableCell>{getStatusBadge(bike.status)}</TableCell>
                        <TableCell>
                          {bike.currentRentedBy ? (
                            <div>
                              <div className="font-medium text-sm">{bike.currentRentedBy.name}</div>
                              <div className="text-xs text-muted-foreground">{bike.currentRentedBy.rollNumber}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {bike.lastSeenCameraTime ? (
                            <div>
                              <div className="text-sm">{new Date(bike.lastSeenCameraTime).toLocaleTimeString()}</div>
                              <div className="text-xs text-muted-foreground">{bike.lastSeenLocation || "Unknown"}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(bike)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(bike._id)}
                              disabled={bike.status === "rented"}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
              <DialogTitle>{editingBike ? "Edit Bike" : "Add New Bike"}</DialogTitle>
              <DialogDescription>
                {editingBike ? "Update bike information" : "Register a new bike in the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bikeId">Bike ID</Label>
                <Input
                  id="bikeId"
                  type="number"
                  placeholder="101"
                  value={formData.bikeId}
                  onChange={(e) => setFormData({ ...formData, bikeId: e.target.value })}
                  required
                  disabled={!!editingBike}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bikeName">Bike Name</Label>
                <Input
                  id="bikeName"
                  placeholder="Mountain Bike 1"
                  value={formData.bikeName}
                  onChange={(e) => setFormData({ ...formData, bikeName: e.target.value })}
                  required
                />
              </div>
              {editingBike && (
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bikeStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              <Button type="submit">{editingBike ? "Update" : "Create"} Bike</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
