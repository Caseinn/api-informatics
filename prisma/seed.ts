// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type QuestionType = 'multiple' | 'boolean'
type Difficulty = 'easy' | 'medium' | 'hard'

async function main() {
  // --- 1) Categories ---
  const categoryData = [
    { name: 'Arrays',      slug: 'arrays',      extId: 31 },
    { name: 'Pointers',    slug: 'pointers',    extId: 32 },
    { name: 'Subprograms', slug: 'subprograms', extId: 33 },
    { name: 'Structs',     slug: 'structs',     extId: 34 },
  ] as const

  const createdCategories: Record<string, string> = {}

  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {}, // no changes if exists
      create: cat,
    })
    createdCategories[cat.name] = created.id
  }

  // --- 2) Questions ---
  const questionData: Array<{
    type: QuestionType
    difficulty: Difficulty
    categoryName: keyof typeof createdCategories | string
    question: string
    correctAnswer: string
    incorrectAnswers: string[]
  }> = [
    // ===== ARRAYS =====
    {
      type: 'multiple',
      difficulty: 'easy',
      categoryName: 'Arrays',
      question: 'How do you declare an array of 5 integers in C++?',
      correctAnswer: 'int arr[5];',
      incorrectAnswers: ['int arr(5);', 'array<int, 5> arr;', 'int[5] arr;'],
    },
    {
      type: 'boolean',
      difficulty: 'easy',
      categoryName: 'Arrays',
      question: 'In C++, array indices start at 0.',
      correctAnswer: 'True',
      incorrectAnswers: ['False'],
    },
    {
      type: 'multiple',
      difficulty: 'medium',
      categoryName: 'Arrays',
      question:
        'What is the size of the array "int arr[10];" in bytes (assuming int is 4 bytes)?',
      correctAnswer: '40',
      incorrectAnswers: ['10', '4', '44'],
    },
    {
      type: 'multiple',
      difficulty: 'hard',
      categoryName: 'Arrays',
      question: 'Which header must be included to use std::array in C++?',
      correctAnswer: '<array>',
      incorrectAnswers: ['<vector>', '<utility>', '<stdlib.h>'],
    },
    {
      type: 'boolean',
      difficulty: 'medium',
      categoryName: 'Arrays',
      question: 'C-style arrays can be resized at runtime.',
      correctAnswer: 'False',
      incorrectAnswers: ['True'],
    },

    // ===== POINTERS =====
    {
      type: 'multiple',
      difficulty: 'easy',
      categoryName: 'Pointers',
      question: 'Which operator is used to get the address of a variable in C++?',
      correctAnswer: '&',
      incorrectAnswers: ['*', '->', '.'],
    },
    {
      type: 'boolean',
      difficulty: 'easy',
      categoryName: 'Pointers',
      question: 'A null pointer points to address 0.',
      correctAnswer: 'True',
      incorrectAnswers: ['False'],
    },
    {
      type: 'multiple',
      difficulty: 'medium',
      categoryName: 'Pointers',
      question: 'What does "int* p = nullptr;" declare?',
      correctAnswer: 'A pointer to an integer, initialized to null',
      incorrectAnswers: [
        'An integer with value null',
        'A pointer to a null integer',
        'An array of null integers',
      ],
    },
    {
      type: 'multiple',
      difficulty: 'hard',
      categoryName: 'Pointers',
      question: 'What is "void*" commonly used for in C++?',
      correctAnswer: 'A generic pointer that can point to any data type',
      incorrectAnswers: [
        'A pointer to a function',
        'A pointer that points to nothing',
        'A deprecated pointer type',
      ],
    },
    {
      type: 'boolean',
      difficulty: 'medium',
      categoryName: 'Pointers',
      question: 'You can perform arithmetic on void pointers in standard C++.',
      correctAnswer: 'False',
      incorrectAnswers: ['True'],
    },

    // ===== SUBPROGRAMS =====
    {
      type: 'multiple',
      difficulty: 'easy',
      categoryName: 'Subprograms',
      question: 'What keyword is used to return a value from a C++ function?',
      correctAnswer: 'return',
      incorrectAnswers: ['exit', 'yield', 'send'],
    },
    {
      type: 'boolean',
      difficulty: 'easy',
      categoryName: 'Subprograms',
      question: 'A function in C++ must always return a value.',
      correctAnswer: 'False',
      incorrectAnswers: ['True'],
    },
    {
      type: 'multiple',
      difficulty: 'medium',
      categoryName: 'Subprograms',
      question: 'What is function overloading in C++?',
      correctAnswer:
        'Defining multiple functions with the same name but different parameters',
      incorrectAnswers: [
        'Calling a function inside itself',
        'Inheriting a function from a base class',
        'Using default arguments in a function',
      ],
    },
    {
      type: 'multiple',
      difficulty: 'hard',
      categoryName: 'Subprograms',
      question:
        'What does "inline" suggest to the compiler about a function?',
      correctAnswer:
        'It should try to insert the function code directly at the call site',
      incorrectAnswers: [
        'The function runs in a separate thread',
        'The function cannot be modified',
        'The function is only visible in the current file',
      ],
    },
    {
      type: 'boolean',
      difficulty: 'medium',
      categoryName: 'Subprograms',
      question:
        'Default arguments in C++ must be specified from left to right.',
      correctAnswer: 'False',
      incorrectAnswers: ['True'],
    },

    // ===== STRUCTS =====
    {
      type: 'multiple',
      difficulty: 'easy',
      categoryName: 'Structs',
      question: 'Which keyword is used to define a structure in C++?',
      correctAnswer: 'struct',
      incorrectAnswers: ['class', 'typedef', 'union'],
    },
    {
      type: 'boolean',
      difficulty: 'easy',
      categoryName: 'Structs',
      question: 'By default, members of a struct in C++ are public.',
      correctAnswer: 'True',
      incorrectAnswers: ['False'],
    },
    {
      type: 'multiple',
      difficulty: 'medium',
      categoryName: 'Structs',
      question: 'How do you access a member of a struct variable "s" named "x"?',
      correctAnswer: 's.x',
      incorrectAnswers: ['s->x', 's[x]', '*s.x'],
    },
    {
      type: 'multiple',
      difficulty: 'hard',
      categoryName: 'Structs',
      question: 'What is a "POD struct" in C++?',
      correctAnswer:
        'A Plain Old Data struct with no constructors, virtual functions, or private members',
      incorrectAnswers: [
        'A struct that uses pointers only',
        'A deprecated type of struct',
        'A struct defined in the <pod> header',
      ],
    },
    {
      type: 'boolean',
      difficulty: 'medium',
      categoryName: 'Structs',
      question: 'You can define member functions inside a C++ struct.',
      correctAnswer: 'True',
      incorrectAnswers: ['False'],
    },
  ]

// create only if not exists
for (const q of questionData) {
  const categoryId = createdCategories[q.categoryName]
  if (!categoryId) continue

  const exists = await prisma.question.findFirst({
    where: { question: q.question },
    select: { id: true },
  })

  if (!exists) {
    await prisma.question.create({
      data: {
        type: q.type,
        difficulty: q.difficulty,
        categoryId,
        categoryName: q.categoryName,
        question: q.question,
        correctAnswer: q.correctAnswer,
        incorrectAnswers: q.incorrectAnswers,
        tags: [],
      },
    })
  }
}
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
