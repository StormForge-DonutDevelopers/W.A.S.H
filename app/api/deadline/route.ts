// app/api/deadline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all deadlines
export async function GET() {
  try {
    const deadlines = await prisma.deadline.findMany({
      where: { userId: "anonymous" },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(deadlines)
  } catch (error) {
    console.error('Error fetching deadlines:', error)
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 })
  }
}

// POST - Create a new deadline
export async function POST(req: NextRequest) {
  try {
    const { title, course, dueDate, description = '', completed = false } = await req.json()

    // Validate required fields
    if (!title || !course || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const deadline = await prisma.deadline.create({
      data: {
        title,
        course,
        dueDate: new Date(dueDate),
        description,
        completed,
        userId: "anonymous", // Fixed value for anonymous users
      },
    })

    return NextResponse.json(deadline, { status: 201 })
  } catch (error) {
    console.error('Error creating deadline:', error)
    return NextResponse.json({ error: 'Failed to create deadline' }, { status: 500 })
  }
}