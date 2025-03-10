// app/api/deadlines/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'

// GET - Fetch a specific deadline
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    // Check if user is authenticated
    if (!session?.user?.sub) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const deadline = await prisma.deadline.findUnique({
      where: { 
        id: params.id,
        userId: session.user.sub
      },
    })

    if (!deadline) {
      return new NextResponse(JSON.stringify({ error: 'Deadline not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new NextResponse(JSON.stringify(deadline), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching deadline:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch deadline' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// PATCH - Update a deadline
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    // Check if user is authenticated
    if (!session?.user?.sub) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const updates = await req.json()

    // Find the deadline and confirm ownership
    const existingDeadline = await prisma.deadline.findUnique({
      where: { 
        id: params.id
      },
    })

    if (!existingDeadline) {
      return new NextResponse(JSON.stringify({ error: 'Deadline not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (existingDeadline.userId !== session.user.sub) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update the deadline
    const deadline = await prisma.deadline.update({
      where: { id: params.id },
      data: updates,
    })

    return new NextResponse(JSON.stringify(deadline), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error updating deadline:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to update deadline' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// DELETE - Delete a deadline
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    // Check if user is authenticated
    if (!session?.user?.sub) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Find the deadline and confirm ownership
    const existingDeadline = await prisma.deadline.findUnique({
      where: { 
        id: params.id
      },
    })

    if (!existingDeadline) {
      return new NextResponse(JSON.stringify({ error: 'Deadline not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (existingDeadline.userId !== session.user.sub) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Delete the deadline
    await prisma.deadline.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting deadline:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to delete deadline' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}