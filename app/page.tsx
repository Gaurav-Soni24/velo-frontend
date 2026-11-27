import { AuthGate } from "@/components/auth-gate"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function HomePage() {
  return (
    <AuthGate>
      <DashboardLayout />
    </AuthGate>
  )
}
