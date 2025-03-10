// app/api/deadlines/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'

// GET - Fetch all deadlines for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    
    // Check if user is authenticated
    if (!session?.user?.sub) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const deadlines = await prisma.deadline.findMany({
      where: { userId: session.user.sub },
      orderBy: { dueDate: 'asc' },
    })

    return new NextResponse(JSON.stringify(deadlines), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching deadlines:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch deadlines' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST - Create a new deadline
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    
    // Check if user is authenticated
    if (!session?.user?.sub) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { title, course, dueDate, description = '' } = await req.json()

    // Validate required fields
    if (!title || !course || !dueDate) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const deadline = await prisma.deadline.create({
      data: {
        title,
        course,
        dueDate: new Date(dueDate),
        description,
        completed: false,
        userId: session.user.sub,
      },
    })

    return new NextResponse(JSON.stringify(deadline), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error creating deadline:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to create deadline' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}