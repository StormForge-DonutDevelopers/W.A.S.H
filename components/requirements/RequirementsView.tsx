"use client"

import { RequirementCard } from "./RequirementCard"
import type { CourseList } from "@/lib/store"
import { DEGREE_REQUIREMENTS } from "@/lib/degreeRequirements"

interface RequirementsViewProps {
  courses: CourseList
}

export function RequirementsView({ courses }: RequirementsViewProps) {
  // Convert completed courses into an array of course codes (e.g., "CMPT 120")
  const completedCourses = courses.completed.map((course) => course.code)

  // Process each requirement dynamically
  const requirements = DEGREE_REQUIREMENTS.map((req) => {
    // Match completed courses by title
    const completed = req.courses.filter((course) =>
      completedCourses.includes(course.title)
    )

    const remaining = req.courses.filter((course) =>
      !completedCourses.includes(course.title)
    )

    return {
      name: req.name,
      required: req.required,
      completed: completed.length,
      completedCourses: completed.map((c) => c.title),
      remainingCourses: remaining.map((c) => c.title),
    }
  })

  return (
    <div className="space-y-4">
      {requirements.map((req) => (
        <RequirementCard key={req.name} {...req} />
      ))}
    </div>
  )
}
