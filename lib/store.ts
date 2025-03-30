import { create } from "zustand"
import { DEGREE_REQUIREMENTS } from "@/lib/degreeRequirements"

interface Course {
  id: string
  code: string
  name: string
  credits: number
  term: "available" | "planned" | "completed"
}

export interface CourseList {
  available: Course[]
  planned: Course[]
  completed: Course[]
}

interface CourseState {
  courses: CourseList
  loadInitialCourses: () => void
  addCourse: (listId: "planned" | "completed", course: Course) => void
  removeCourse: (listId: "planned" | "completed", courseId: string) => void
  moveCourse: (fromList: "planned" | "completed", toList: "planned" | "completed", courseId: string) => void
}

const flattenRequirementCourses = (): Course[] => {
  const seen = new Set()
  const all: Course[] = []

  for (const req of DEGREE_REQUIREMENTS) {
    for (const course of req.courses) {
      if (seen.has(course.title)) continue
      seen.add(course.title)

      all.push({
        id: course.title.toLowerCase().replace(/\s/g, ""),
        code: course.title,
        name: course.name,
        credits: course.credits,
        term: "available",
      })
    }
  }

  return all
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: {
    available: [],
    planned: [],
    completed: [],
  },

  loadInitialCourses: () => {
    const planned = get().courses.planned
    const completed = get().courses.completed

    const usedCodes = new Set([...planned, ...completed].map((c) => c.code))

    const available = flattenRequirementCourses().filter((course) => !usedCodes.has(course.code))

    set((state) => ({
      courses: {
        ...state.courses,
        available,
      },
    }))
  },

  addCourse: (listId, course) =>
    set((state) => ({
      courses: {
        ...state.courses,
        [listId]: [...state.courses[listId], course],
        available: state.courses.available.filter((c) => c.id !== course.id),
      },
    })),

  removeCourse: (listId, courseId) =>
    set((state) => {
      const course = state.courses[listId].find((c) => c.id === courseId)
      if (!course) return state

      return {
        courses: {
          ...state.courses,
          [listId]: state.courses[listId].filter((c) => c.id !== courseId),
          available: [...state.courses.available, { ...course, term: "available" }],
        },
      }
    }),

  moveCourse: (fromList, toList, courseId) =>
    set((state) => {
      const course = state.courses[fromList].find((c) => c.id === courseId)
      if (!course) return state

      return {
        courses: {
          ...state.courses,
          [fromList]: state.courses[fromList].filter((c) => c.id !== courseId),
          [toList]: [...state.courses[toList], { ...course, term: toList }],
        },
      }
    }),
}))
