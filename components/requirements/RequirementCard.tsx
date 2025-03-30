"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface RequirementCardProps {
  name: string;
  required: number;
  completed: number;
  completedCourses: string[];
  remainingCourses: string[];
}

export function RequirementCard({ name, required, completed, completedCourses, remainingCourses }: RequirementCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <Badge variant={completed >= required ? "default" : "secondary"}>
            {completed}/{required} Completed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={(completed / required) * 100} className="mb-4" />
        <div className="grid gap-4">
          {/* Completed Courses */}
          <div>
            <h4 className="font-medium mb-2">Completed Courses</h4>
            <div className="flex flex-wrap gap-2">
              {completedCourses.length > 0 ? (
                completedCourses.map((course) => (
                  <Badge key={course} variant="outline" className="bg-primary/10">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {course}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="bg-muted">No courses completed</Badge>
              )}
            </div>
          </div>

          {/* Remaining Courses */}
          <div>
            <h4 className="font-medium mb-2">Remaining Requirements</h4>
            <div className="flex flex-wrap gap-2">
              {remainingCourses.length > 0 ? (
                remainingCourses.map((course) => (
                  <Badge key={course} variant="outline" className="bg-muted">
                    <XCircle className="mr-1 h-3 w-3" />
                    {course}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="bg-primary/10">All requirements met 🎉</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
