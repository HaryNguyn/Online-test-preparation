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
        question: "Simplify: 3(x + 2) - 2x",
        options: ["x + 6", "5x + 6", "x + 2", "3x + 6"],
        correctAnswer: 0,
        explanation: "Distribute: 3x + 6 - 2x = x + 6",
      },
      {
        id: "3",
        question: "What is the slope of the line y = 3x + 2?",
        options: ["3", "2", "5", "1"],
        correctAnswer: 0,
        explanation: "In the form y = mx + b, m is the slope. Here m = 3",
      },
      {
        id: "4",
        question: "Solve for y: 4y - 8 = 12",
        options: ["5", "4", "3", "6"],
        correctAnswer: 0,
        explanation: "Add 8 to both sides: 4y = 20, then divide by 4: y = 5",
      },
      {
        id: "5",
        question: "What is (x + 3)(x - 3)?",
        options: ["x² - 9", "x² + 9", "x² - 6x - 9", "x² + 6x + 9"],
        correctAnswer: 0,
        explanation: "This is the difference of squares: (a + b)(a - b) = a² - b²",
      },
    ],
  },
  {
    id: "2",
    title: "Advanced Calculus - Derivatives",
    description: "Master the fundamentals of derivatives and differentiation",
    subject: "Mathematics",
    grade: "Grade 12",
    duration: 45,
    totalMarks: 100,
    createdBy: "4",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "1",
        question: "What is the derivative of x²?",
        options: ["2x", "x", "2x²", "x²/2"],
        correctAnswer: 0,
        explanation: "Using the power rule: d/dx(x²) = 2x",
      },
      {
        id: "2",
        question: "What is the derivative of sin(x)?",
        options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
        correctAnswer: 0,
        explanation: "The derivative of sin(x) is cos(x)",
      },
      {
        id: "3",
        question: "What is the chain rule?",
        options: [
          "d/dx[f(g(x))] = f'(g(x)) · g'(x)",
          "d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)",
          "d/dx[f(x)/g(x)] = [f'(x)g(x) - f(x)g'(x)]/g(x)²",
          "d/dx[x^n] = nx^(n-1)",
        ],
        correctAnswer: 0,
        explanation: "The chain rule is used for composite functions",
      },
    ],
  },
  {
    id: "3",
    title: "Geometry - Triangles and Circles",
    description: "Explore properties of triangles and circles",
    subject: "Mathematics",
    grade: "Grade 9",
    duration: 30,
    totalMarks: 100,
    createdBy: "4",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "1",
        question: "What is the sum of angles in a triangle?",
        options: ["180°", "360°", "90°", "270°"],
        correctAnswer: 0,
        explanation: "The sum of all interior angles in any triangle is always 180°",
      },
      {
        id: "2",
        question: "What is the formula for the area of a circle?",
        options: ["πr²", "2πr", "πd", "4πr²"],
        correctAnswer: 0,
        explanation: "Area of a circle = π × radius²",
      },
      {
        id: "3",
        question: "In a right triangle, what is the Pythagorean theorem?",
        options: ["a² + b² = c²", "a + b = c", "a² - b² = c²", "ab = c"],
        correctAnswer: 0,
        explanation:
          "In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides",
      },
    ],
  },
  {
    id: "4",
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
      {
        id: "3",
        question: "What is the speed of light in vacuum?",
        options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10⁹ m/s", "3 × 10⁷ m/s"],
        correctAnswer: 0,
        explanation: "The speed of light in vacuum is approximately 300,000,000 m/s",
      },
      {
        id: "4",
        question: "What is Newton's First Law of Motion?",
        options: [
          "An object at rest stays at rest unless acted upon by a force",
          "F = ma",
          "Every action has an equal and opposite reaction",
          "Energy cannot be created or destroyed",
        ],
        correctAnswer: 0,
        explanation: "The law of inertia states that objects maintain their state of motion",
      },
    ],
  },
  {
    id: "5",
    title: "Chemistry - Periodic Table",
    description: "Understanding elements and the periodic table",
    subject: "Science",
    grade: "Grade 11",
    duration: 35,
    totalMarks: 100,
    createdBy: "5",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "1",
        question: "What is the atomic number of Carbon?",
        options: ["6", "12", "8", "14"],
        correctAnswer: 0,
        explanation: "Carbon has 6 protons, giving it an atomic number of 6",
      },
      {
        id: "2",
        question: "What is H₂O?",
        options: ["Water", "Hydrogen peroxide", "Hydrochloric acid", "Hydroxide"],
        correctAnswer: 0,
        explanation: "H₂O is the chemical formula for water",
      },
      {
        id: "3",
        question: "What is the most abundant element in Earth's atmosphere?",
        options: ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"],
        correctAnswer: 0,
        explanation: "Nitrogen makes up about 78% of Earth's atmosphere",
      },
    ],
  },
  {
    id: "6",
    title: "English - Grammar and Vocabulary",
    description: "Test your English language skills",
    subject: "English",
    grade: "Grade 9",
    duration: 20,
    totalMarks: 100,
    createdBy: "6",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "1",
        question: 'Which word is a synonym for "happy"?',
        options: ["Joyful", "Sad", "Angry", "Tired"],
        correctAnswer: 0,
        explanation: "Joyful means feeling great pleasure and happiness",
      },
      {
        id: "2",
        question: 'Identify the verb in: "The cat sleeps on the mat"',
        options: ["sleeps", "cat", "mat", "the"],
        correctAnswer: 0,
        explanation: "Sleeps is the action word (verb) in this sentence",
      },
      {
        id: "3",
        question: 'What is the plural of "child"?',
        options: ["children", "childs", "childes", "child"],
        correctAnswer: 0,
        explanation: "Children is the irregular plural form of child",
      },
    ],
  },
  {
    id: "7",
    title: "Literature - Shakespeare's Works",
    description: "Explore the works of William Shakespeare",
    subject: "English",
    grade: "Grade 11",
    duration: 40,
    totalMarks: 100,
    createdBy: "6",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "1",
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"],
        correctAnswer: 0,
        explanation: "Romeo and Juliet is one of Shakespeare's most famous tragedies",
      },
      {
        id: "2",
        question: "In which city is 'Romeo and Juliet' set?",
        options: ["Verona", "Venice", "Rome", "Florence"],
        correctAnswer: 0,
        explanation: "The play is set in Verona, Italy",
      },
      {
        id: "3",
        question: "What type of play is 'Hamlet'?",
        options: ["Tragedy", "Comedy", "Romance", "History"],
        correctAnswer: 0,
        explanation: "Hamlet is classified as a tragedy",
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
