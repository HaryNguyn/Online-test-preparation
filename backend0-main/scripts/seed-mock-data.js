/*
 * Seed script to migrate existing frontend mock data into the MySQL database.
 *
 * Usage:
 *   1. Ensure the database is up and the credentials in ../.env are correct.
 *   2. From the backend0-main directory run: `node scripts/seed-mock-data.js`
 *   3. Default password for all seeded accounts is `password123`.
 */

const path = require("path")
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require("uuid")

require("dotenv").config({ path: path.resolve(__dirname, "../.env") })

const mockUsers = [
  {
    id: "0",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "1",
    email: "student@example.com",
    name: "John Student",
    role: "student",
    grade: "Grade 10",
  },
  {
    id: "2",
    email: "teacher@example.com",
    name: "Sarah Teacher",
    role: "teacher",
  },
  {
    id: "3",
    email: "parent@example.com",
    name: "Mike Parent",
    role: "parent",
  },
  {
    id: "4",
    email: "math.teacher@example.com",
    name: "Dr. Robert Mathematics",
    role: "teacher",
  },
  {
    id: "5",
    email: "science.teacher@example.com",
    name: "Prof. Emily Science",
    role: "teacher",
  },
  {
    id: "6",
    email: "english.teacher@example.com",
    name: "Ms. Jennifer English",
    role: "teacher",
  },
  {
    id: "7",
    email: "student2@example.com",
    name: "Emma Student",
    role: "student",
    grade: "Grade 9",
  },
]

const mockTests = [
  {
    id: "1",
    title: "Mathematics - Algebra Basics",
    description: "Test your knowledge of basic algebra concepts",
    subject: "Mathematics",
    grade: "Grade 10",
    duration: 30,
    totalMarks: 100,
    createdBy: "2",
    questions: [
      {
        question: "What is the value of x in the equation: 2x + 5 = 15?",
        options: ["5", "10", "7.5", "20"],
        correctAnswer: 0,
        explanation: "Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5",
      },
      {
        question: "Simplify: 3(x + 2) - 2x",
        options: ["x + 6", "5x + 6", "x + 2", "3x + 6"],
        correctAnswer: 0,
        explanation: "Distribute: 3x + 6 - 2x = x + 6",
      },
      {
        question: "What is the slope of the line y = 3x + 2?",
        options: ["3", "2", "5", "1"],
        correctAnswer: 0,
        explanation: "In the form y = mx + b, m is the slope. Here m = 3",
      },
      {
        question: "Solve for y: 4y - 8 = 12",
        options: ["5", "4", "3", "6"],
        correctAnswer: 0,
        explanation: "Add 8 to both sides: 4y = 20, then divide by 4: y = 5",
      },
      {
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
    questions: [
      {
        question: "What is the derivative of x²?",
        options: ["2x", "x", "2x²", "x²/2"],
        correctAnswer: 0,
        explanation: "Using the power rule: d/dx(x²) = 2x",
      },
      {
        question: "What is the derivative of sin(x)?",
        options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
        correctAnswer: 0,
        explanation: "The derivative of sin(x) is cos(x)",
      },
      {
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
    questions: [
      {
        question: "What is the sum of angles in a triangle?",
        options: ["180°", "360°", "90°", "270°"],
        correctAnswer: 0,
        explanation: "The sum of all interior angles in any triangle is always 180°",
      },
      {
        question: "What is the formula for the area of a circle?",
        options: ["πr²", "2πr", "πd", "4πr²"],
        correctAnswer: 0,
        explanation: "Area of a circle = π × radius²",
      },
      {
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
    questions: [
      {
        question: "What is the SI unit of force?",
        options: ["Newton", "Joule", "Watt", "Pascal"],
        correctAnswer: 0,
        explanation: "The Newton (N) is the SI unit of force, named after Isaac Newton",
      },
      {
        question: "What is the formula for kinetic energy?",
        options: ["½mv²", "mgh", "Fd", "P/t"],
        correctAnswer: 0,
        explanation: "Kinetic energy = ½ × mass × velocity²",
      },
      {
        question: "What is the speed of light in vacuum?",
        options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10⁹ m/s", "3 × 10⁷ m/s"],
        correctAnswer: 0,
        explanation: "The speed of light in vacuum is approximately 300,000,000 m/s",
      },
      {
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
    questions: [
      {
        question: "What is the atomic number of Carbon?",
        options: ["6", "12", "8", "14"],
        correctAnswer: 0,
        explanation: "Carbon has 6 protons, giving it an atomic number of 6",
      },
      {
        question: "What is H₂O?",
        options: ["Water", "Hydrogen peroxide", "Hydrochloric acid", "Hydroxide"],
        correctAnswer: 0,
        explanation: "H₂O is the chemical formula for water",
      },
      {
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
    questions: [
      {
        question: "Which word is a synonym for \"happy\"?",
        options: ["Joyful", "Sad", "Angry", "Tired"],
        correctAnswer: 0,
        explanation: "Joyful means feeling great pleasure and happiness",
      },
      {
        question: "Identify the verb in: \"The cat sleeps on the mat\"",
        options: ["sleeps", "cat", "mat", "the"],
        correctAnswer: 0,
        explanation: "Sleeps is the action word (verb) in this sentence",
      },
      {
        question: "What is the plural of \"child\"?",
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
    questions: [
      {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"],
        correctAnswer: 0,
        explanation: "Romeo and Juliet is one of Shakespeare's most famous tragedies",
      },
      {
        question: "In which city is 'Romeo and Juliet' set?",
        options: ["Verona", "Venice", "Rome", "Florence"],
        correctAnswer: 0,
        explanation: "The play is set in Verona, Italy",
      },
      {
        question: "What type of play is 'Hamlet'?",
        options: ["Tragedy", "Comedy", "Romance", "History"],
        correctAnswer: 0,
        explanation: "Hamlet is classified as a tragedy",
      },
    ],
  },
]

const defaultPassword = "password123"

async function seed() {
  console.log("🌱 Starting mock data import...")

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  })

  try {
    await connection.beginTransaction()

    const userIdMap = new Map()

    for (const mockUser of mockUsers) {
      const [existing] = await connection.execute("SELECT id FROM Users WHERE email = ?", [mockUser.email])
      let backendId
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)

      if (existing.length > 0) {
        backendId = existing[0].id
        await connection.execute('UPDATE Users SET password = ? WHERE id = ?', [hashedPassword, backendId]);
        console.log(`✅ Updated user ${mockUser.email}`)
      } else {
        backendId = uuidv4()
        await connection.execute(
          `INSERT INTO Users (id, email, password, name, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [backendId, mockUser.email, hashedPassword, mockUser.name, mockUser.role]
        )
        console.log(`✅ Created user ${mockUser.email}`)
      }

      userIdMap.set(mockUser.id, backendId)

      await connection.execute(
        `INSERT INTO UserMapping (mock_id, backend_id, email)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE backend_id = VALUES(backend_id), email = VALUES(email)`,
        [mockUser.id, backendId, mockUser.email]
      )
    }

    for (const mockTest of mockTests) {
      const creatorBackendId = userIdMap.get(mockTest.createdBy)

      if (!creatorBackendId) {
        console.warn(`⚠️  Skipping test "${mockTest.title}" because creator ${mockTest.createdBy} is not mapped`)
        continue
      }

      const [existingExam] = await connection.execute(
        `SELECT id FROM Exams WHERE title = ? AND created_by = ? LIMIT 1`,
        [mockTest.title, creatorBackendId]
      )

      if (existingExam.length > 0) {
        console.log(`ℹ️  Exam already exists: ${mockTest.title}`)
        continue
      }

      const examId = uuidv4()
      const totalMarks = mockTest.totalMarks ?? mockTest.questions.length * 10
      const passingMarks = Math.round(totalMarks * 0.6)

      await connection.execute(
        `INSERT INTO Exams (id, title, description, subject, grade_level, duration, total_marks, passing_marks, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, NOW(), NOW())`,
        [
          examId,
          mockTest.title,
          mockTest.description || "",
          mockTest.subject || "",
          mockTest.grade || "",
          mockTest.duration || mockTest.questions.length * 2 || 30,
          totalMarks,
          passingMarks,
          creatorBackendId,
        ]
      )

      for (let index = 0; index < mockTest.questions.length; index += 1) {
        const question = mockTest.questions[index]
        const questionId = uuidv4()
        const marks = Math.round(totalMarks / Math.max(mockTest.questions.length, 1))

        await connection.execute(
          `INSERT INTO Questions (id, exam_id, question_text, question_type, options, correct_answer, marks, order_number, image_url, audio_url, created_at, updated_at)
           VALUES (?, ?, ?, 'multiple_choice', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            questionId,
            examId,
            question.question,
            JSON.stringify(question.options || []),
            question.correctAnswer ?? 0,
            marks,
            index,
            question.imageUrl || null,
            question.audioUrl || null,
          ]
        )
      }

      console.log(`✅ Created exam ${mockTest.title} with ${mockTest.questions.length} questions`)
    }

    await connection.commit()
    console.log("🎉 Mock data import completed successfully")
    console.log("➡️  Default password for all seeded accounts:", defaultPassword)
  } catch (error) {
    await connection.rollback()
    console.error("❌ Seed failed, rolled back changes")
    console.error(error)
    process.exitCode = 1
  } finally {
    await connection.end()
  }
}

seed().catch((error) => {
  console.error("Unexpected error while seeding data", error)
  process.exitCode = 1
})
