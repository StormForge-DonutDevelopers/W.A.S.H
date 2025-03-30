"use client";

import { RequirementCard } from "./RequirementCard";
import type { CourseList } from "@/lib/store";
import { DEGREE_REQUIREMENTS } from "@/lib/degreeRequirements";

interface RequirementsViewProps {
  courses: CourseList;
}

export function RequirementsView({ courses }: RequirementsViewProps) {
  // Convert completed courses into an array of course codes
  const completedCourses = courses.completed.map((course) => course.code);

  // Process each requirement dynamically
  const requirements = DEGREE_REQUIREMENTS.map((req) => {
    const completed = completedCourses.filter((code) => req.courses.includes(code));
    const remaining = req.courses.filter((code) => !completed.includes(code));

    return {
      name: req.name,
      required: req.required,
      completed: completed.length,
      completedCourses: completed,
      remainingCourses: remaining,
    };
  });

  return (
    <div className="space-y-4">
      {requirements.map((req) => (
        <RequirementCard key={req.name} {...req} />
      ))}
    </div>
  );
}
