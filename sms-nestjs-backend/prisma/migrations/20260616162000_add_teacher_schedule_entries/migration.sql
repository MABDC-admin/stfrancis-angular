CREATE TABLE "TeacherScheduleEntry" (
  "id" TEXT NOT NULL,
  "teacherUserId" TEXT NOT NULL,
  "weekday" TEXT NOT NULL,
  "weekdaySort" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeacherScheduleEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherScheduleEntry_teacherUserId_weekdaySort_idx"
  ON "TeacherScheduleEntry"("teacherUserId", "weekdaySort");

ALTER TABLE "TeacherScheduleEntry"
  ADD CONSTRAINT "TeacherScheduleEntry_teacherUserId_fkey"
  FOREIGN KEY ("teacherUserId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
