import { Button } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#515151] rounded-full py-[0.5rem]">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl pb-[0.5rem] font-display text-[#FEFCD1]">WASH</span>
        </div>
        <nav className="flex items-center space-x-6 ml-6">
          <Button variant="link" className="text-base text-[#FEFCD1]">Course Planner</Button>
          <Button variant="link" className="text-base text-[#FEFCD1]">Requirements</Button>
          <Button variant="link" className="text-base text-[#FEFCD1]">Schedule</Button>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="outline" className="border-[#FEFCD1] border-[0.15rem] bg-transparent text-[#FEFCD1]">Sign In</Button>
          <Button className="bg-[#FEFCD1] text-[#515151]">Get Started</Button>
        </div>
      </div>
    </header>
  )
}

