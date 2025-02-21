import { DashboardHeader } from "@/components/dashboard-header"
import { CoursePlanner } from "@/components/course-planner"
import { ChatbotWindow } from "@/components/chatbot-window"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">WASH: Weekly Academic Schedule Helper</h1>
          <p className="text-lg text-muted-foreground">Finally, something clean in the CS department</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <CoursePlanner />
          </div>
          <div className="col-span-3">
            <ChatbotWindow />
          </div>
        </div>
      </main>
    </div>
  )
}

