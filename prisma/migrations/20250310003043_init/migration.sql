-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);
