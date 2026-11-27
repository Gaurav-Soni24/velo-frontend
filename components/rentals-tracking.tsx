"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Clock, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL, apiFetch } from "@/lib/api"

interface Rental {
  _id: string
  userId: {
    name: string
    rollNumber: string
    branch: string
    semester: number
  }
  bikeId: {
    bikeId: number
    bikeName: string
  }
  startTime: string
  endTime?: string
  status: string
  duration?: number
}

export function RentalsTracking() {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchRentals()
  }, [])

  const fetchRentals = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`${API_BASE_URL}/api/admin/rentals`)
      if (!response.ok) throw new Error("Failed to fetch rentals")
      const data = await response.json()
      setRentals(data.data)
    } catch (error) {
      console.error("[v0] Error fetching rentals:", error)
      toast({
        title: "Error",
        description: "Failed to load rentals",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredRentals = rentals.filter((rental) => {
    const lowercasedQuery = searchQuery.toLowerCase()
    const matchesSearch =
      rental.userId?.name?.toLowerCase().includes(lowercasedQuery) ||
      rental.userId?.rollNumber?.toLowerCase().includes(lowercasedQuery) ||
      rental.bikeId?.bikeName?.toLowerCase().includes(lowercasedQuery)

    if (activeTab === "ongoing") return matchesSearch && rental.status === "ongoing"
    if (activeTab === "completed") return matchesSearch && rental.status === "completed"
    return !!matchesSearch
  })

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDateTime = (date: string) => {
    const d = new Date(date)
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Rentals Tracking</CardTitle>
          <CardDescription>Monitor ongoing and completed bike rentals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name, roll number, or bike..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">All Rentals</TabsTrigger>
              <TabsTrigger value="ongoing" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Ongoing
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
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
                        <TableHead>User</TableHead>
                        <TableHead>Bike</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRentals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No rentals found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRentals.map((rental) => {
                          const startDT = formatDateTime(rental.startTime)
                          const endDT = rental.endTime ? formatDateTime(rental.endTime) : null

                          return (
                            <TableRow key={rental._id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{rental.userId?.name || "N/A"}</div>
                                  <div className="text-xs text-muted-foreground">{rental.userId?.rollNumber || "N/A"}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{rental.bikeId?.bikeName || "N/A"}</div>
                                  <div className="text-xs text-muted-foreground">ID: #{rental.bikeId?.bikeId || "N/A"}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="text-sm">{startDT.time}</div>
                                  <div className="text-xs text-muted-foreground">{startDT.date}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {endDT ? (
                                  <div>
                                    <div className="text-sm">{endDT.time}</div>
                                    <div className="text-xs text-muted-foreground">{endDT.date}</div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">{formatDuration(rental.duration)}</span>
                              </TableCell>
                              <TableCell>
                                {rental.status === "ongoing" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-[#2440F0]/10 text-[#1A2FB8] dark:bg-[#2440F0]/20 dark:text-[#6fb8ee]">
                                    <Clock className="w-2 h-2" />
                                    Ongoing
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-[#6B9A00]/10 text-[#3F5A00] dark:bg-[#6B9A00]/20 dark:text-[#5fd6c8]">
                                    <CheckCircle2 className="w-2 h-2" />
                                    Completed
                                  </span>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
