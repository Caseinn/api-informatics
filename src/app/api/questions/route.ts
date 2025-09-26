// app/api/v1/trivia/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client' // ⬅️ import Prisma to narrow errors
import type { Difficulty, QuestionType } from '@prisma/client'

export const runtime = 'nodejs'

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

    const where: {
      categoryName?: { contains: string; mode: 'insensitive' }
      difficulty?: Difficulty
      type?: QuestionType
      id?: { notIn: string[] }
    } = {}

    if (categoryName) {
      where.categoryName = { contains: categoryName, mode: 'insensitive' }
    }
    if (isValidDifficulty(difficulty)) where.difficulty = difficulty
    if (isValidType(qType)) where.type = qType

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

    const results: TriviaQuestion[] = questions.map((q) => ({
      category: q.categoryName,
      type: q.type,
      difficulty: q.difficulty,
      question: q.question,
      correct_answer: q.correctAnswer,
      incorrect_answers: q.type === 'boolean' ? [] : q.incorrectAnswers,
    }))

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
          // ⬇️ Type-safe error narrowing (no "any")
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
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { response_code: RC.INVALID_PARAM, error: 'Invalid request' },
      { status: 400 },
    )
  }
}
