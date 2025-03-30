// app/api/deadline/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch a specific deadline
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deadline = await prisma.deadline.findUnique({
      where: { id: params.id }
    })

    if (!deadline) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 })
    }

    return NextResponse.json(deadline)
  } catch (error) {
    console.error('Error fetching deadline:', error)
    return NextResponse.json({ error: 'Failed to fetch deadline' }, { status: 500 })
  }
}

// PATCH - Update a deadline
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json()

    // Find and update the deadline
    const deadline = await prisma.deadline.update({
      where: { id: params.id },
      data: updates,
    })

    return NextResponse.json(deadline)
  } catch (error) {
    console.error('Error updating deadline:', error)
    return NextResponse.json({ error: 'Failed to update deadline' }, { status: 500 })
  }
}

// DELETE - Delete a deadline
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.deadline.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting deadline:', error)
    return NextResponse.json({ error: 'Failed to delete deadline' }, { status: 500 })
  }
}