import type { Test, User } from "./types"

export const mockUsers: User[] = [
  {
    id: "0",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "1",
    email: "student@example.com",
    name: "John Student",
    role: "student",
    grade: "Grade 10",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    email: "teacher@example.com",
    name: "Sarah Teacher",
    role: "teacher",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    email: "parent@example.com",
    name: "Mike Parent",
    role: "parent",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    email: "math.teacher@example.com",
    name: "Dr. Robert Mathematics",
    role: "teacher",
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    email: "science.teacher@example.com",
    name: "Prof. Emily Science",
    role: "teacher",
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    email: "english.teacher@example.com",
    name: "Ms. Jennifer English",
    role: "teacher",
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    email: "student2@example.com",
    name: "Emma Student",
    role: "student",
    grade: "Grade 9",
    createdAt: new Date().toISOString(),
  },
]

export const mockTests: Test[] = [
  {
    id: "1",
    title: "Mathematics - Algebra Basics",
    description: "Test your knowledge of basic algebra concepts",
    subject: "Mathematics",
    grade: "Grade 10",
    duration: 30,
    totalMarks: 100,
    createdBy: "2",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "1",
        question: "What is the value of x in the equation: 2x + 5 = 15?",
        options: ["5", "10", "7.5", "20"],
        correctAnswer: 0,
        explanation: "Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5",
      },
      {
        id: "2",
        question: "What is the slope of the line y = 3x + 2?",
        options: ["3", "2", "5", "1"],
        correctAnswer: 0,
        explanation: "In the form y = mx + b, m is the slope. Here m = 3",
      },
    ],
  },
  {
    id: "2",
    title: "Science - Physics Fundamentals",
    description: "Basic physics concepts and principles",
    subject: "Science",
    grade: "Grade 10",
    duration: 25,
    totalMarks: 100,
    createdBy: "5",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "1",
        question: "What is the SI unit of force?",
        options: ["Newton", "Joule", "Watt", "Pascal"],
        correctAnswer: 0,
        explanation: "The Newton (N) is the SI unit of force, named after Isaac Newton",
      },
      {
        id: "2",
        question: "What is the formula for kinetic energy?",
        options: ["½mv²", "mgh", "Fd", "P/t"],
        correctAnswer: 0,
        explanation: "Kinetic energy = ½ × mass × velocity²",
      },
    ],
  },
]

export function initializeMockData() {
  if (typeof window === "undefined") return

  const users = window.localStorage.getItem("exam_platform_users")
  const tests = window.localStorage.getItem("exam_platform_tests")

  if (!users) {
    window.localStorage.setItem("exam_platform_users", JSON.stringify(mockUsers))
  }

  if (!tests) {
    window.localStorage.setItem("exam_platform_tests", JSON.stringify(mockTests))
  }
}
