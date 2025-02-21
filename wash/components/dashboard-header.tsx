import { Button } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2 font-bold">
          <GraduationCap className="h-5 w-5" />
          <span>WASH</span>
        </div>
        <nav className="flex items-center space-x-6 ml-6">
          <Button variant="link">Course Planner</Button>
          <Button variant="link">Requirements</Button>
          <Button variant="link">Schedule</Button>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="outline">Sign In</Button>
          <Button>Get Started</Button>
        </div>
      </div>
    </header>
  )
}

