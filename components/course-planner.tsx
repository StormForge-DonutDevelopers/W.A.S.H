"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ListFilter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarView } from "./calendar-view"
import { RequirementsView } from "./requirements-view"
import { useCourseStore } from "@/lib/store"

export function CoursePlanner() {
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "requirements">("list")
  const [filters, setFilters] = useState({
    department: "",
    level: "",
    term: "",
  })

  const { courses, moveCourse } = useCourseStore()

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId !== destination.droppableId) {
      moveCourse(source.droppableId, destination.droppableId, draggableId)
    }
  }

  // Filter courses based on selected filters
  const filterCourses = (courseList: any[]) => {
    return courseList.filter((course) => {
      if (filters.department && !course.code.toLowerCase().startsWith(filters.department)) {
        return false
      }
      if (filters.level) {
        const courseLevel = course.code.match(/\d+/)?.[0]?.substring(0, 1) + "00"
        if (courseLevel !== filters.level) {
          return false
        }
      }
      if (filters.term && course.term !== filters.term) {
        return false
      }
      return true
    })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Course Planner
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
              List View
            </Button>
            <Button variant={viewMode === "calendar" ? "default" : "outline"} onClick={() => setViewMode("calendar")}>
              Calendar View
            </Button>
            <Button
              variant={viewMode === "requirements" ? "default" : "outline"}
              onClick={() => setViewMode("requirements")}
            >
              Requirements
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters((f) => ({ ...f, department: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cmpt">Computing Science</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="macm">Mathematics/Computing</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.level} onValueChange={(value) => setFilters((f) => ({ ...f, level: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.term} onValueChange={(value) => setFilters((f) => ({ ...f, term: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fall">Fall 2024</SelectItem>
                  <SelectItem value="spring">Spring 2025</SelectItem>
                  <SelectItem value="summer">Summer 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setFilters({ department: "", level: "", term: "" })}>
              <ListFilter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>

          {viewMode === "list" && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(courses).map(([listId, items]) => (
                  <Droppable key={listId} droppableId={listId}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="rounded-lg border bg-muted p-4"
                      >
                        <h3 className="mb-4 font-semibold capitalize">{listId} Courses</h3>
                        {filterCourses(items).map((course, index) => (
                          <Draggable key={course.id} draggableId={course.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-2 rounded-md bg-background p-3 shadow-sm"
                              >
                                <div className="font-medium">{course.code}</div>
                                <div className="text-sm text-muted-foreground">{course.name}</div>
                                <div className="mt-2 text-xs">
                                  <Badge variant="secondary">{course.credits} Credits</Badge>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          )}

          {viewMode === "calendar" && <CalendarView courses={courses} />}
          {viewMode === "requirements" && <RequirementsView courses={courses} />}
        </div>
      </CardContent>
    </Card>
  )
}

