"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"
import type { CourseList } from "@/lib/store"

interface RequirementsViewProps {
  courses: CourseList
}

export function RequirementsView({ courses }: RequirementsViewProps) {
  // Get completed courses
  const completedCourses = courses.completed.map((course) => course.code)

  // Example requirements - replace with actual degree requirements
  const requirements = [
    {
      name: "Lower Division Requirements",
      required: 10,
      completed: completedCourses.filter(
        (code) => code.match(/\d+/)?.[0]?.substring(0, 1) === "1" || code.match(/\d+/)?.[0]?.substring(0, 1) === "2",
      ).length,
      courses: completedCourses.filter(
        (code) => code.match(/\d+/)?.[0]?.substring(0, 1) === "1" || code.match(/\d+/)?.[0]?.substring(0, 1) === "2",
      ),
      remaining: ["MATH 152", "MACM 201", "CMPT 295", "CMPT 276"],
    },
    {
      name: "Upper Division Requirements",
      required: 8,
      completed: completedCourses.filter((code) => code.match(/\d+/)?.[0]?.substring(0, 1) === "3").length,
      courses: completedCourses.filter((code) => code.match(/\d+/)?.[0]?.substring(0, 1) === "3"),
      remaining: ["CMPT 307", "CMPT 363", "CMPT 379", "CMPT 383"],
    },
    {
      name: "Breadth Requirements",
      required: 6,
      completed: completedCourses.filter((code) => !code.match(/\d+/)?.[0]?.substring(0, 1)?.match(/[1-3]/)).length,
      courses: completedCourses.filter((code) => !code.match(/\d+/)?.[0]?.substring(0, 1)?.match(/[1-3]/)),
      remaining: ["ARCH 131", "CA 149", "HIST 102"],
    },
  ]

  return (
    <div className="space-y-4">
      {requirements.map((req) => (
        <Card key={req.name}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{req.name}</span>
              <Badge variant={req.completed >= req.required ? "default" : "secondary"}>
                {req.completed}/{req.required} Completed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(req.completed / req.required) * 100} className="mb-4" />
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-2">Completed Courses</h4>
                <div className="flex flex-wrap gap-2">
                  {req.courses.map((course) => (
                    <Badge key={course} variant="outline" className="bg-primary/10">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Remaining Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {req.remaining.map((course) => (
                    <Badge key={course} variant="outline" className="bg-muted">
                      <XCircle className="mr-1 h-3 w-3" />
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

