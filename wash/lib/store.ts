import { create } from "zustand"

interface Course {
  id: string
  code: string
  name: string
  credits: number
  prerequisites: string[]
  term: string
}

interface CourseList {
  [key: string]: Course[]
}

interface CourseState {
  courses: CourseList
  addCourse: (listId: string, course: Course) => void
  removeCourse: (listId: string, courseId: string) => void
  moveCourse: (fromList: string, toList: string, courseId: string) => void
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: {
    available: [
      {
        id: "cmpt120",
        code: "CMPT 120",
        name: "Introduction to Computing Science and Programming I",
        credits: 3,
        prerequisites: [],
        term: "available",
      },
      {
        id: "cmpt125",
        code: "CMPT 125",
        name: "Introduction to Computing Science and Programming II",
        credits: 3,
        prerequisites: ["cmpt120"],
        term: "available",
      },
    ],
    planned: [],
    completed: [],
  },

  addCourse: (listId, course) =>
    set((state) => ({
      courses: {
        ...state.courses,
        [listId]: [...(state.courses[listId] || []), course],
      },
    })),

  removeCourse: (listId, courseId) =>
    set((state) => ({
      courses: {
        ...state.courses,
        [listId]: state.courses[listId].filter((course) => course.id !== courseId),
      },
    })),

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

