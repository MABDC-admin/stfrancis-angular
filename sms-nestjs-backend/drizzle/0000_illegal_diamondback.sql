-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "BehaviorRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"incidentType" text NOT NULL,
	"description" text NOT NULL,
	"date" timestamp(3) NOT NULL,
	"actionTaken" text,
	"reportedBy" text
);
--> statement-breakpoint
CREATE TABLE "DepEdForm" (
	"id" text PRIMARY KEY NOT NULL,
	"formCode" text NOT NULL,
	"formName" text NOT NULL,
	"description" text,
	"scope" text NOT NULL,
	"status" text NOT NULL,
	"lastGenerated" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"academicYearId" text
);
--> statement-breakpoint
CREATE TABLE "DocumentRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"requestNo" text NOT NULL,
	"studentName" text NOT NULL,
	"documentType" text NOT NULL,
	"paymentStatus" text NOT NULL,
	"requestStatus" text NOT NULL,
	"requestedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"releaseDate" timestamp(3),
	"academicYearId" text
);
--> statement-breakpoint
CREATE TABLE "DocumentRequirement" (
	"id" text PRIMARY KEY NOT NULL,
	"studentName" text NOT NULL,
	"studentNo" text NOT NULL,
	"requirement" text NOT NULL,
	"status" text NOT NULL,
	"uploadedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"verifiedBy" text,
	"remarks" text,
	"academicYearId" text
);
--> statement-breakpoint
CREATE TABLE "FeeTemplate" (
	"id" text PRIMARY KEY NOT NULL,
	"academicYearId" text NOT NULL,
	"gradeLevel" text NOT NULL,
	"name" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FeeTemplateLineItem" (
	"id" text PRIMARY KEY NOT NULL,
	"feeTemplateId" text NOT NULL,
	"feeTypeId" text NOT NULL,
	"description" text NOT NULL,
	"amount" double precision NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FeeType" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "IdQrRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"studentName" text NOT NULL,
	"studentNo" text NOT NULL,
	"gradeSection" text,
	"qrStatus" text NOT NULL,
	"idStatus" text NOT NULL,
	"lastPrinted" timestamp(3),
	"remarks" text,
	"academicYearId" text
);
--> statement-breakpoint
CREATE TABLE "IntegrationLog" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"sourceModule" text NOT NULL,
	"targetModule" text NOT NULL,
	"studentId" text,
	"academicYearId" text,
	"status" text NOT NULL,
	"message" text,
	"performedById" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LearnerMovement" (
	"id" text PRIMARY KEY NOT NULL,
	"studentName" text NOT NULL,
	"movementType" text NOT NULL,
	"from" text,
	"to" text,
	"effectiveDate" timestamp(3) NOT NULL,
	"status" text NOT NULL,
	"requestedBy" text,
	"academicYearId" text
);
--> statement-breakpoint
CREATE TABLE "EnrollmentApplication" (
	"id" text PRIMARY KEY NOT NULL,
	"applicationNo" text NOT NULL,
	"studentName" text NOT NULL,
	"gradeLevel" text NOT NULL,
	"studentType" text NOT NULL,
	"status" text NOT NULL,
	"documentStatus" text NOT NULL,
	"financeStatus" text NOT NULL,
	"submittedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"reviewedBy" text,
	"remarks" text,
	"academicYearId" text,
	"section" text
);
--> statement-breakpoint
CREATE TABLE "AcademicYear" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"startDate" timestamp(3) NOT NULL,
	"endDate" timestamp(3) NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "Payment" (
	"id" text PRIMARY KEY NOT NULL,
	"studentAssessmentId" text NOT NULL,
	"studentId" text NOT NULL,
	"academicYearId" text NOT NULL,
	"receiptNumber" text NOT NULL,
	"method" text NOT NULL,
	"amount" double precision NOT NULL,
	"paymentDate" timestamp(3) NOT NULL,
	"remarks" text,
	"encodedById" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StoredFile" (
	"id" text PRIMARY KEY NOT NULL,
	"ownerType" text NOT NULL,
	"ownerId" text,
	"category" text NOT NULL,
	"originalName" text NOT NULL,
	"storedName" text NOT NULL,
	"mimeType" text NOT NULL,
	"size" integer NOT NULL,
	"relativePath" text NOT NULL,
	"publicUrl" text NOT NULL,
	"uploadedById" text,
	"uploadedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PaymentReceiptAudit" (
	"id" text PRIMARY KEY NOT NULL,
	"paymentId" text NOT NULL,
	"oldReceiptNumber" text NOT NULL,
	"newReceiptNumber" text NOT NULL,
	"editedById" text,
	"editedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Section" (
	"id" text PRIMARY KEY NOT NULL,
	"gradeLevel" text NOT NULL,
	"sectionName" text NOT NULL,
	"adviser" text,
	"room" text,
	"capacity" integer NOT NULL,
	"enrolled" integer DEFAULT 0 NOT NULL,
	"availableSlots" integer NOT NULL,
	"status" text NOT NULL,
	"academicYearId" text
);
--> statement-breakpoint
CREATE TABLE "Student" (
	"id" text PRIMARY KEY NOT NULL,
	"studentNo" text NOT NULL,
	"lrn" text NOT NULL,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text NOT NULL,
	"suffix" text,
	"birthdate" timestamp(3),
	"gender" text,
	"gradeLevel" text NOT NULL,
	"section" text,
	"adviser" text,
	"studentType" text NOT NULL,
	"enrollmentStatus" text NOT NULL,
	"documentStatus" text NOT NULL,
	"financeStatus" text NOT NULL,
	"guardian" text,
	"contactNo" text,
	"address" text,
	"motherName" text,
	"motherContact" text,
	"fatherName" text,
	"fatherContact" text,
	"phAddress" text,
	"uaeAddress" text,
	"previousSchool" text,
	"lastUpdated" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"academicYearId" text,
	"photoFileId" text,
	"photoUrl" text,
	"enrollmentSubmittedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "StudentAssessment" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"academicYearId" text NOT NULL,
	"feeTemplateId" text,
	"regularDiscountPercent" double precision DEFAULT 0 NOT NULL,
	"siblingDiscountPercent" double precision DEFAULT 0 NOT NULL,
	"scholarshipDiscountPercent" double precision DEFAULT 0 NOT NULL,
	"grossAmount" double precision DEFAULT 0 NOT NULL,
	"discountAmount" double precision DEFAULT 0 NOT NULL,
	"netAmount" double precision DEFAULT 0 NOT NULL,
	"paidAmount" double precision DEFAULT 0 NOT NULL,
	"balance" double precision DEFAULT 0 NOT NULL,
	"financeStatus" text DEFAULT 'With Balance' NOT NULL,
	"createdById" text,
	"updatedById" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StudentFee" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"feeType" text NOT NULL,
	"amount" double precision NOT NULL,
	"status" text NOT NULL,
	"dueDate" timestamp(3),
	"paidDate" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "StudentAssessmentLineItem" (
	"id" text PRIMARY KEY NOT NULL,
	"studentAssessmentId" text NOT NULL,
	"feeTypeId" text NOT NULL,
	"description" text NOT NULL,
	"amount" double precision NOT NULL,
	"sourceFeeTemplateLineItemId" text
);
--> statement-breakpoint
CREATE TABLE "StudentSibling" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"siblingName" text NOT NULL,
	"relationship" text,
	"gradeLevel" text
);
--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'ADMIN' NOT NULL,
	"studentId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"avatarFileId" text,
	"avatarUrl" text
);
--> statement-breakpoint
CREATE TABLE "AcademicRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"studentName" text NOT NULL,
	"gradeLevel" text NOT NULL,
	"section" text,
	"schoolYear" text NOT NULL,
	"generalAverage" text,
	"remarks" text,
	"status" text NOT NULL,
	"academicYearId" text,
	"studentId" text
);
--> statement-breakpoint
CREATE TABLE "ChatConversation" (
	"id" text PRIMARY KEY NOT NULL,
	"ownerUserId" text NOT NULL,
	"subject" text DEFAULT 'SFXSAI Support Chat' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ChatMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"senderUserId" text,
	"senderName" text NOT NULL,
	"senderRole" text NOT NULL,
	"body" text NOT NULL,
	"source" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"readAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "TeacherAttendanceRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"classId" text NOT NULL,
	"studentId" text NOT NULL,
	"date" timestamp(3) NOT NULL,
	"status" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"reason" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeacherClassAssignment" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"academicYearId" text,
	"sectionId" text,
	"sectionName" text NOT NULL,
	"subject" text NOT NULL,
	"schedule" text NOT NULL,
	"room" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeacherGradeRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"classId" text NOT NULL,
	"studentId" text NOT NULL,
	"quarter" text NOT NULL,
	"written" double precision,
	"performance" double precision,
	"exam" double precision,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeacherResource" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"classId" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"size" text DEFAULT 'Pending upload' NOT NULL,
	"uploadedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeacherLessonLog" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"classId" text NOT NULL,
	"date" timestamp(3) NOT NULL,
	"objectives" text NOT NULL,
	"activities" text NOT NULL,
	"materials" text NOT NULL,
	"remarks" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeacherAnnouncement" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"audience" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"postedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeacherDirectMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"thread" text NOT NULL,
	"sender" text NOT NULL,
	"audience" text NOT NULL,
	"message" text NOT NULL,
	"sentAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeacherProfile" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"department" text,
	"phone" text,
	"advisoryClass" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"accountStatus" text DEFAULT 'Active' NOT NULL,
	"adminRole" text DEFAULT 'Teacher' NOT NULL,
	"sectionAssignment" text,
	"subjects" text DEFAULT '' NOT NULL,
	"totalClassesHandled" integer DEFAULT 0 NOT NULL,
	"numberOfStudents" integer DEFAULT 0 NOT NULL,
	"weeklyHours" integer DEFAULT 0 NOT NULL,
	"assignedGradeLevel" text
);
--> statement-breakpoint
CREATE TABLE "CalendarEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"eventDate" timestamp(3) NOT NULL,
	"endDate" timestamp(3),
	"eventType" text NOT NULL,
	"color" text,
	"academicYearId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TeacherScheduleEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"teacherUserId" text NOT NULL,
	"weekday" text NOT NULL,
	"weekdaySort" integer NOT NULL,
	"title" text NOT NULL,
	"startTime" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StudentCoreValues" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"schoolYear" text NOT NULL,
	"quarter" text NOT NULL,
	"makaDiyos" text NOT NULL,
	"makatao" text NOT NULL,
	"makakalikasan" text NOT NULL,
	"makabansa" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StudentHealthProfile" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"schoolYear" text NOT NULL,
	"recordType" text NOT NULL,
	"heightMeters" double precision NOT NULL,
	"weightKg" double precision NOT NULL,
	"bmi" double precision NOT NULL,
	"bmiCategory" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "BehaviorRecord" ADD CONSTRAINT "BehaviorRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DepEdForm" ADD CONSTRAINT "DepEdForm_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "FeeTemplate" ADD CONSTRAINT "FeeTemplate_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "FeeTemplateLineItem" ADD CONSTRAINT "FeeTemplateLineItem_feeTemplateId_fkey" FOREIGN KEY ("feeTemplateId") REFERENCES "public"."FeeTemplate"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "FeeTemplateLineItem" ADD CONSTRAINT "FeeTemplateLineItem_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "public"."FeeType"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "IdQrRecord" ADD CONSTRAINT "IdQrRecord_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LearnerMovement" ADD CONSTRAINT "LearnerMovement_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_encodedById_fkey" FOREIGN KEY ("encodedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentAssessmentId_fkey" FOREIGN KEY ("studentAssessmentId") REFERENCES "public"."StudentAssessment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PaymentReceiptAudit" ADD CONSTRAINT "PaymentReceiptAudit_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PaymentReceiptAudit" ADD CONSTRAINT "PaymentReceiptAudit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Section" ADD CONSTRAINT "Section_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Student" ADD CONSTRAINT "Student_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_feeTemplateId_fkey" FOREIGN KEY ("feeTemplateId") REFERENCES "public"."FeeTemplate"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentAssessmentLineItem" ADD CONSTRAINT "StudentAssessmentLineItem_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "public"."FeeType"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentAssessmentLineItem" ADD CONSTRAINT "StudentAssessmentLineItem_sourceFeeTemplateLineItemId_fkey" FOREIGN KEY ("sourceFeeTemplateLineItemId") REFERENCES "public"."FeeTemplateLineItem"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentAssessmentLineItem" ADD CONSTRAINT "StudentAssessmentLineItem_studentAssessmentId_fkey" FOREIGN KEY ("studentAssessmentId") REFERENCES "public"."StudentAssessment"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentSibling" ADD CONSTRAINT "StudentSibling_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."ChatConversation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherAttendanceRecord" ADD CONSTRAINT "TeacherAttendanceRecord_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherGradeRecord" ADD CONSTRAINT "TeacherGradeRecord_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherResource" ADD CONSTRAINT "TeacherResource_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherLessonLog" ADD CONSTRAINT "TeacherLessonLog_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherAnnouncement" ADD CONSTRAINT "TeacherAnnouncement_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherDirectMessage" ADD CONSTRAINT "TeacherDirectMessage_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TeacherScheduleEntry" ADD CONSTRAINT "TeacherScheduleEntry_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentCoreValues" ADD CONSTRAINT "StudentCoreValues_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StudentHealthProfile" ADD CONSTRAINT "StudentHealthProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "DepEdForm_formCode_key" ON "DepEdForm" USING btree ("formCode" text_ops);--> statement-breakpoint
CREATE INDEX "DocumentRequest_academicYearId_idx" ON "DocumentRequest" USING btree ("academicYearId" text_ops);--> statement-breakpoint
CREATE INDEX "DocumentRequest_academicYearId_requestStatus_idx" ON "DocumentRequest" USING btree ("academicYearId" text_ops,"requestStatus" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "DocumentRequest_requestNo_key" ON "DocumentRequest" USING btree ("requestNo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "FeeTemplate_academicYearId_gradeLevel_name_key" ON "FeeTemplate" USING btree ("academicYearId" text_ops,"gradeLevel" text_ops,"name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "FeeType_name_key" ON "FeeType" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "IdQrRecord_studentNo_key" ON "IdQrRecord" USING btree ("studentNo" text_ops);--> statement-breakpoint
CREATE INDEX "EnrollmentApplication_academicYearId_idx" ON "EnrollmentApplication" USING btree ("academicYearId" text_ops);--> statement-breakpoint
CREATE INDEX "EnrollmentApplication_academicYearId_status_idx" ON "EnrollmentApplication" USING btree ("academicYearId" text_ops,"status" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "EnrollmentApplication_applicationNo_key" ON "EnrollmentApplication" USING btree ("applicationNo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "AcademicYear_code_key" ON "AcademicYear" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "Payment_academicYearId_idx" ON "Payment" USING btree ("academicYearId" text_ops);--> statement-breakpoint
CREATE INDEX "Payment_academicYearId_paymentDate_idx" ON "Payment" USING btree ("academicYearId" timestamp_ops,"paymentDate" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Payment_academicYearId_receiptNumber_key" ON "Payment" USING btree ("academicYearId" text_ops,"receiptNumber" text_ops);--> statement-breakpoint
CREATE INDEX "StoredFile_ownerType_ownerId_category_idx" ON "StoredFile" USING btree ("ownerType" text_ops,"ownerId" text_ops,"category" text_ops);--> statement-breakpoint
CREATE INDEX "StoredFile_uploadedById_idx" ON "StoredFile" USING btree ("uploadedById" text_ops);--> statement-breakpoint
CREATE INDEX "Section_academicYearId_gradeLevel_sectionName_idx" ON "Section" USING btree ("academicYearId" text_ops,"gradeLevel" text_ops,"sectionName" text_ops);--> statement-breakpoint
CREATE INDEX "Section_academicYearId_idx" ON "Section" USING btree ("academicYearId" text_ops);--> statement-breakpoint
CREATE INDEX "Student_academicYearId_enrollmentStatus_idx" ON "Student" USING btree ("academicYearId" text_ops,"enrollmentStatus" text_ops);--> statement-breakpoint
CREATE INDEX "Student_academicYearId_gradeLevel_idx" ON "Student" USING btree ("academicYearId" text_ops,"gradeLevel" text_ops);--> statement-breakpoint
CREATE INDEX "Student_academicYearId_idx" ON "Student" USING btree ("academicYearId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Student_lrn_key" ON "Student" USING btree ("lrn" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Student_studentNo_key" ON "Student" USING btree ("studentNo" text_ops);--> statement-breakpoint
CREATE INDEX "StudentAssessment_academicYearId_financeStatus_idx" ON "StudentAssessment" USING btree ("academicYearId" text_ops,"financeStatus" text_ops);--> statement-breakpoint
CREATE INDEX "StudentAssessment_academicYearId_idx" ON "StudentAssessment" USING btree ("academicYearId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "StudentAssessment_studentId_academicYearId_key" ON "StudentAssessment" USING btree ("studentId" text_ops,"academicYearId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_studentId_key" ON "User" USING btree ("studentId" text_ops);--> statement-breakpoint
CREATE INDEX "ChatConversation_ownerUserId_status_idx" ON "ChatConversation" USING btree ("ownerUserId" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage" USING btree ("conversationId" text_ops,"createdAt" text_ops);--> statement-breakpoint
CREATE INDEX "ChatMessage_senderUserId_idx" ON "ChatMessage" USING btree ("senderUserId" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherAttendanceRecord_teacherUserId_classId_idx" ON "TeacherAttendanceRecord" USING btree ("teacherUserId" text_ops,"classId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "TeacherAttendanceRecord_teacherUserId_classId_studentId_dat_key" ON "TeacherAttendanceRecord" USING btree ("teacherUserId" text_ops,"classId" text_ops,"studentId" timestamp_ops,"date" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherClassAssignment_academicYearId_idx" ON "TeacherClassAssignment" USING btree ("academicYearId" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherClassAssignment_sectionId_idx" ON "TeacherClassAssignment" USING btree ("sectionId" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherClassAssignment_teacherUserId_idx" ON "TeacherClassAssignment" USING btree ("teacherUserId" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherGradeRecord_teacherUserId_classId_idx" ON "TeacherGradeRecord" USING btree ("teacherUserId" text_ops,"classId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "TeacherGradeRecord_teacherUserId_classId_studentId_quarter_key" ON "TeacherGradeRecord" USING btree ("teacherUserId" text_ops,"classId" text_ops,"studentId" text_ops,"quarter" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherResource_teacherUserId_classId_idx" ON "TeacherResource" USING btree ("teacherUserId" text_ops,"classId" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherLessonLog_teacherUserId_classId_date_idx" ON "TeacherLessonLog" USING btree ("teacherUserId" text_ops,"classId" text_ops,"date" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherAnnouncement_teacherUserId_postedAt_idx" ON "TeacherAnnouncement" USING btree ("teacherUserId" text_ops,"postedAt" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherDirectMessage_teacherUserId_sentAt_idx" ON "TeacherDirectMessage" USING btree ("teacherUserId" text_ops,"sentAt" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "TeacherProfile_teacherUserId_key" ON "TeacherProfile" USING btree ("teacherUserId" text_ops);--> statement-breakpoint
CREATE INDEX "CalendarEvent_academicYearId_eventDate_idx" ON "CalendarEvent" USING btree ("academicYearId" text_ops,"eventDate" text_ops);--> statement-breakpoint
CREATE INDEX "CalendarEvent_academicYearId_idx" ON "CalendarEvent" USING btree ("academicYearId" text_ops);--> statement-breakpoint
CREATE INDEX "TeacherScheduleEntry_teacherUserId_weekdaySort_idx" ON "TeacherScheduleEntry" USING btree ("teacherUserId" int4_ops,"weekdaySort" int4_ops);--> statement-breakpoint
CREATE INDEX "StudentCoreValues_studentId_idx" ON "StudentCoreValues" USING btree ("studentId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "StudentCoreValues_studentId_schoolYear_quarter_key" ON "StudentCoreValues" USING btree ("studentId" text_ops,"schoolYear" text_ops,"quarter" text_ops);--> statement-breakpoint
CREATE INDEX "StudentHealthProfile_studentId_idx" ON "StudentHealthProfile" USING btree ("studentId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "StudentHealthProfile_studentId_schoolYear_recordType_key" ON "StudentHealthProfile" USING btree ("studentId" text_ops,"schoolYear" text_ops,"recordType" text_ops);
*/