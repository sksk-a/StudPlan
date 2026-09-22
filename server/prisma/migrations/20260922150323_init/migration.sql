-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('homework', 'laboratory', 'practice', 'coursework', 'exam', 'other');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('planned', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "teacher" VARCHAR(120) NOT NULL DEFAULT '',
    "color" VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "taskType" "TaskType" NOT NULL,
    "deadline" TIMESTAMPTZ(3) NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 2,
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "estimatedMinutes" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_id_userId_key" ON "Subject"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_userId_name_key" ON "Subject"("userId", "name");

-- CreateIndex
CREATE INDEX "Task_userId_deadline_idx" ON "Task"("userId", "deadline");

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");

-- CreateIndex
CREATE INDEX "Task_subjectId_userId_idx" ON "Task"("subjectId", "userId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_subjectId_userId_fkey" FOREIGN KEY ("subjectId", "userId") REFERENCES "Subject"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
