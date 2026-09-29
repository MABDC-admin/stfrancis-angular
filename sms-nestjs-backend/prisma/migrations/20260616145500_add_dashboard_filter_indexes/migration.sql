CREATE INDEX IF NOT EXISTS "Student_academicYearId_idx"
ON "Student"("academicYearId");

CREATE INDEX IF NOT EXISTS "Student_academicYearId_gradeLevel_idx"
ON "Student"("academicYearId", "gradeLevel");

CREATE INDEX IF NOT EXISTS "Student_academicYearId_enrollmentStatus_idx"
ON "Student"("academicYearId", "enrollmentStatus");

CREATE INDEX IF NOT EXISTS "EnrollmentApplication_academicYearId_idx"
ON "EnrollmentApplication"("academicYearId");

CREATE INDEX IF NOT EXISTS "EnrollmentApplication_academicYearId_status_idx"
ON "EnrollmentApplication"("academicYearId", "status");

CREATE INDEX IF NOT EXISTS "Section_academicYearId_idx"
ON "Section"("academicYearId");

CREATE INDEX IF NOT EXISTS "Section_academicYearId_gradeLevel_sectionName_idx"
ON "Section"("academicYearId", "gradeLevel", "sectionName");

CREATE INDEX IF NOT EXISTS "DocumentRequest_academicYearId_idx"
ON "DocumentRequest"("academicYearId");

CREATE INDEX IF NOT EXISTS "DocumentRequest_academicYearId_requestStatus_idx"
ON "DocumentRequest"("academicYearId", "requestStatus");

CREATE INDEX IF NOT EXISTS "StudentAssessment_academicYearId_idx"
ON "StudentAssessment"("academicYearId");

CREATE INDEX IF NOT EXISTS "StudentAssessment_academicYearId_financeStatus_idx"
ON "StudentAssessment"("academicYearId", "financeStatus");

CREATE INDEX IF NOT EXISTS "Payment_academicYearId_idx"
ON "Payment"("academicYearId");

CREATE INDEX IF NOT EXISTS "Payment_academicYearId_paymentDate_idx"
ON "Payment"("academicYearId", "paymentDate");

CREATE INDEX IF NOT EXISTS "CalendarEvent_academicYearId_idx"
ON "CalendarEvent"("academicYearId");

CREATE INDEX IF NOT EXISTS "CalendarEvent_academicYearId_eventDate_idx"
ON "CalendarEvent"("academicYearId", "eventDate");
