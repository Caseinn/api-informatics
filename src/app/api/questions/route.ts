// app/api/questions/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client' // only for error narrowing

export const runtime = 'nodejs'

// Local TS unions (don’t rely on Prisma-enum exports)
type QuestionType = 'multiple' | 'boolean'
type Difficulty = 'easy' | 'medium' | 'hard'

const RC = {
  SUCCESS: 0,
  NO_RESULTS: 1,
  INVALID_PARAM: 2,
  TOKEN_NOT_FOUND: 3,
  TOKEN_EMPTY: 4,
} as const

type TriviaQuestion = {
  category: string
  type: QuestionType
  difficulty: Difficulty
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

function parseAmount(input: string | null): number {
  if (!input) return 10
  const num = parseInt(input, 10)
  if (!Number.isFinite(num) || num < 1) return 1
  return Math.min(num, 50)
}
function isValidDifficulty(d: string | null): d is Difficulty {
  return d === 'easy' || d === 'medium' || d === 'hard'
}
function isValidType(t: string | null): t is QuestionType {
  return t === 'multiple' || t === 'boolean'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const amount = parseAmount(searchParams.get('amount'))
    const categoryName = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const qType = searchParams.get('type')
    const token = searchParams.get('token')

    // Build where
    const where: {
      categoryName?: { contains: string; mode: 'insensitive' }
      difficulty?: Difficulty
      type?: QuestionType
      id?: { notIn: string[] }
    } = {}

    if (categoryName) where.categoryName = { contains: categoryName, mode: 'insensitive' }
    if (isValidDifficulty(difficulty)) where.difficulty = difficulty
    if (isValidType(qType)) where.type = qType

    // Exclude served for this token
    let servedIds: string[] = []
    if (token) {
      const session = await prisma.sessionToken.findUnique({
        where: { id: token },
        select: { servedIds: true },
      })
      if (session) {
        servedIds = session.servedIds
        if (servedIds.length > 0) where.id = { notIn: servedIds }
      }
    }

    // Fetch a typed projection
    const questions = await prisma.question.findMany({
      where,
      take: amount,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        categoryName: true,
        type: true,
        difficulty: true,
        question: true,
        correctAnswer: true,
        incorrectAnswers: true,
      },
    })

    // 👉 Give q an explicit type so it's not 'any'
    type QuestionRow = (typeof questions)[number]

    const results: TriviaQuestion[] = questions.map(
      (q: QuestionRow): TriviaQuestion => ({
        category: q.categoryName,
        type: q.type as QuestionType,
        difficulty: q.difficulty as Difficulty,
        question: q.question,
        correct_answer: q.correctAnswer,
        incorrect_answers: q.type === 'boolean' ? [] : q.incorrectAnswers,
      }),
    )

    if (token && questions.length > 0) {
      const newIds = questions.map((q) => q.id)
      await prisma.sessionToken
        .update({
          where: { id: token },
          data: {
            servedIds: { push: newIds },
            // expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
          },
        })
        .catch(async (e: unknown) => {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
            await prisma.sessionToken.create({
              data: {
                id: token,
                servedIds: newIds,
                expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
              },
            })
          } else {
            throw e
          }
        })
    }

    return NextResponse.json({
      response_code: results.length > 0 ? RC.SUCCESS : RC.NO_RESULTS,
      results,
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { response_code: RC.INVALID_PARAM, error: 'Invalid request' },
      { status: 400 },
    )
  }
}
