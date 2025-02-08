"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"
import type { CourseList } from "@/lib/store"

interface CalendarViewProps {
  courses: CourseList
}

export function CalendarView({ courses }: CalendarViewProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const times = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM to 8 PM

  // Combine all courses from different lists
  const allCourses = Object.values(courses).flat()

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-2">
          {/* Time column */}
          <div className="font-medium">Time</div>
          {/* Days row */}
          {days.map((day) => (
            <div key={day} className="font-medium text-center">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {times.map((time) => (
            <>
              <div key={time} className="py-4 text-sm text-muted-foreground">
                {time}:00
              </div>
              {days.map((day) => (
                <Card key={`${day}-${time}`} className="p-2 h-16">
                  <CardContent className="p-0">
                    {allCourses.map((course) =>
                      // This is a placeholder - you'll need to add actual course scheduling logic
                      course.id === "cmpt120" && time === 10 && day === "Monday" ? (
                        <div key={course.id} className="bg-primary/10 text-primary p-1 rounded text-xs">
                          <div className="font-medium">{course.code}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            10:00 - 11:20
                          </div>
                        </div>
                      ) : null,
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

