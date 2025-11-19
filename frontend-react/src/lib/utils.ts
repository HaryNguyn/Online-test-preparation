import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type QuestionIdentifier = {
  id?: string | number | null
  order_number?: number | null
}

type NormalizedAnswer = number | number[] | string | null

const sortObjectKeys = (a: string, b: string) => {
  const numA = Number(a)
  const numB = Number(b)
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB
  }
  return a.localeCompare(b)
}

const parseRawAnswers = (raw: unknown): unknown => {
  if (!raw) return []
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return raw
}

export function normalizeAnswers(
  rawAnswers: unknown,
  questions?: QuestionIdentifier[]
): NormalizedAnswer[] {
  const parsed = parseRawAnswers(rawAnswers)

  if (Array.isArray(parsed)) {
    return parsed as NormalizedAnswer[]
  }

  if (parsed && typeof parsed === "object") {
    const answerObj = parsed as Record<string | number, NormalizedAnswer>

    if (questions && questions.length > 0) {
      return questions.map((question, index) => {
        const candidates: Array<string | number> = []

        if (question.id !== undefined && question.id !== null) {
          candidates.push(question.id)
          candidates.push(String(question.id))
        }

        if (question.order_number !== undefined && question.order_number !== null) {
          candidates.push(question.order_number)
          candidates.push(String(question.order_number))
        }

        candidates.push(index, String(index))

        for (const key of candidates) {
          if (key in answerObj) {
            return answerObj[key]
          }
        }

        return null
      })
    }

    return Object.keys(answerObj)
      .sort(sortObjectKeys)
      .map((key) => answerObj[key] ?? null) as NormalizedAnswer[]
  }

  return []
}
