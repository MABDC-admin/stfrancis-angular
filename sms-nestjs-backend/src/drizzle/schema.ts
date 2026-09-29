import { pgTable, foreignKey, text, timestamp, uniqueIndex, index, boolean, doublePrecision, integer, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const behaviorRecord = pgTable("BehaviorRecord", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	incidentType: text().notNull(),
	description: text().notNull(),
	date: timestamp({ precision: 3, mode: 'string' }).notNull(),
	actionTaken: text(),
	reportedBy: text(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "BehaviorRecord_studentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const depEdForm = pgTable("DepEdForm", {
	id: text().primaryKey().notNull(),
	formCode: text().notNull(),
	formName: text().notNull(),
	description: text(),
	scope: text().notNull(),
	status: text().notNull(),
	lastGenerated: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	academicYearId: text(),
}, (table) => [
	uniqueIndex("DepEdForm_formCode_key").using("btree", table.formCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "DepEdForm_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const documentRequest = pgTable("DocumentRequest", {
	id: text().primaryKey().notNull(),
	requestNo: text().notNull(),
	studentName: text().notNull(),
	documentType: text().notNull(),
	paymentStatus: text().notNull(),
	requestStatus: text().notNull(),
	requestedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	releaseDate: timestamp({ precision: 3, mode: 'string' }),
	academicYearId: text(),
}, (table) => [
	index("DocumentRequest_academicYearId_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops")),
	index("DocumentRequest_academicYearId_requestStatus_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.requestStatus.asc().nullsLast().op("text_ops")),
	uniqueIndex("DocumentRequest_requestNo_key").using("btree", table.requestNo.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "DocumentRequest_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const documentRequirement = pgTable("DocumentRequirement", {
	id: text().primaryKey().notNull(),
	studentName: text().notNull(),
	studentNo: text().notNull(),
	requirement: text().notNull(),
	status: text().notNull(),
	uploadedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	verifiedBy: text(),
	remarks: text(),
	academicYearId: text(),
}, (table) => [
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "DocumentRequirement_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const feeTemplate = pgTable("FeeTemplate", {
	id: text().primaryKey().notNull(),
	academicYearId: text().notNull(),
	gradeLevel: text().notNull(),
	name: text().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("FeeTemplate_academicYearId_gradeLevel_name_key").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.gradeLevel.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "FeeTemplate_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const feeTemplateLineItem = pgTable("FeeTemplateLineItem", {
	id: text().primaryKey().notNull(),
	feeTemplateId: text().notNull(),
	feeTypeId: text().notNull(),
	description: text().notNull(),
	amount: doublePrecision().notNull(),
	sortOrder: integer().default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.feeTemplateId],
			foreignColumns: [feeTemplate.id],
			name: "FeeTemplateLineItem_feeTemplateId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.feeTypeId],
			foreignColumns: [feeType.id],
			name: "FeeTemplateLineItem_feeTypeId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const feeType = pgTable("FeeType", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("FeeType_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const idQrRecord = pgTable("IdQrRecord", {
	id: text().primaryKey().notNull(),
	studentName: text().notNull(),
	studentNo: text().notNull(),
	gradeSection: text(),
	qrStatus: text().notNull(),
	idStatus: text().notNull(),
	lastPrinted: timestamp({ precision: 3, mode: 'string' }),
	remarks: text(),
	academicYearId: text(),
}, (table) => [
	uniqueIndex("IdQrRecord_studentNo_key").using("btree", table.studentNo.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "IdQrRecord_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const integrationLog = pgTable("IntegrationLog", {
	id: text().primaryKey().notNull(),
	action: text().notNull(),
	sourceModule: text().notNull(),
	targetModule: text().notNull(),
	studentId: text(),
	academicYearId: text(),
	status: text().notNull(),
	message: text(),
	performedById: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.performedById],
			foreignColumns: [user.id],
			name: "IntegrationLog_performedById_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const learnerMovement = pgTable("LearnerMovement", {
	id: text().primaryKey().notNull(),
	studentName: text().notNull(),
	movementType: text().notNull(),
	from: text(),
	to: text(),
	effectiveDate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	status: text().notNull(),
	requestedBy: text(),
	academicYearId: text(),
}, (table) => [
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "LearnerMovement_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const enrollmentApplication = pgTable("EnrollmentApplication", {
	id: text().primaryKey().notNull(),
	applicationNo: text().notNull(),
	studentName: text().notNull(),
	gradeLevel: text().notNull(),
	studentType: text().notNull(),
	status: text().notNull(),
	documentStatus: text().notNull(),
	financeStatus: text().notNull(),
	submittedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	reviewedBy: text(),
	remarks: text(),
	academicYearId: text(),
	section: text(),
}, (table) => [
	index("EnrollmentApplication_academicYearId_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops")),
	index("EnrollmentApplication_academicYearId_status_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("EnrollmentApplication_applicationNo_key").using("btree", table.applicationNo.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "EnrollmentApplication_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const academicYear = pgTable("AcademicYear", {
	id: text().primaryKey().notNull(),
	code: text().notNull(),
	startDate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	endDate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	isActive: boolean().default(false).notNull(),
	remarks: text(),
}, (table) => [
	uniqueIndex("AcademicYear_code_key").using("btree", table.code.asc().nullsLast().op("text_ops")),
]);

export const payment = pgTable("Payment", {
	id: text().primaryKey().notNull(),
	studentAssessmentId: text().notNull(),
	studentId: text().notNull(),
	academicYearId: text().notNull(),
	receiptNumber: text().notNull(),
	method: text().notNull(),
	amount: doublePrecision().notNull(),
	paymentDate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	remarks: text(),
	encodedById: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("Payment_academicYearId_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops")),
	index("Payment_academicYearId_paymentDate_idx").using("btree", table.academicYearId.asc().nullsLast().op("timestamp_ops"), table.paymentDate.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("Payment_academicYearId_receiptNumber_key").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.receiptNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "Payment_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.encodedById],
			foreignColumns: [user.id],
			name: "Payment_encodedById_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.studentAssessmentId],
			foreignColumns: [studentAssessment.id],
			name: "Payment_studentAssessmentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "Payment_studentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const storedFile = pgTable("StoredFile", {
	id: text().primaryKey().notNull(),
	ownerType: text().notNull(),
	ownerId: text(),
	category: text().notNull(),
	originalName: text().notNull(),
	storedName: text().notNull(),
	mimeType: text().notNull(),
	size: integer().notNull(),
	relativePath: text().notNull(),
	publicUrl: text().notNull(),
	uploadedById: text(),
	uploadedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("StoredFile_ownerType_ownerId_category_idx").using("btree", table.ownerType.asc().nullsLast().op("text_ops"), table.ownerId.asc().nullsLast().op("text_ops"), table.category.asc().nullsLast().op("text_ops")),
	index("StoredFile_uploadedById_idx").using("btree", table.uploadedById.asc().nullsLast().op("text_ops")),
]);

export const paymentReceiptAudit = pgTable("PaymentReceiptAudit", {
	id: text().primaryKey().notNull(),
	paymentId: text().notNull(),
	oldReceiptNumber: text().notNull(),
	newReceiptNumber: text().notNull(),
	editedById: text(),
	editedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.editedById],
			foreignColumns: [user.id],
			name: "PaymentReceiptAudit_editedById_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payment.id],
			name: "PaymentReceiptAudit_paymentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const section = pgTable("Section", {
	id: text().primaryKey().notNull(),
	gradeLevel: text().notNull(),
	sectionName: text().notNull(),
	adviser: text(),
	room: text(),
	capacity: integer().notNull(),
	enrolled: integer().default(0).notNull(),
	availableSlots: integer().notNull(),
	status: text().notNull(),
	academicYearId: text(),
}, (table) => [
	index("Section_academicYearId_gradeLevel_sectionName_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.gradeLevel.asc().nullsLast().op("text_ops"), table.sectionName.asc().nullsLast().op("text_ops")),
	index("Section_academicYearId_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "Section_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const student = pgTable("Student", {
	id: text().primaryKey().notNull(),
	studentNo: text().notNull(),
	lrn: text().notNull(),
	firstName: text().notNull(),
	middleName: text(),
	lastName: text().notNull(),
	suffix: text(),
	birthdate: timestamp({ precision: 3, mode: 'string' }),
	gender: text(),
	gradeLevel: text().notNull(),
	section: text(),
	adviser: text(),
	studentType: text().notNull(),
	enrollmentStatus: text().notNull(),
	documentStatus: text().notNull(),
	financeStatus: text().notNull(),
	guardian: text(),
	contactNo: text(),
	address: text(),
	motherName: text(),
	motherContact: text(),
	fatherName: text(),
	fatherContact: text(),
	phAddress: text(),
	uaeAddress: text(),
	previousSchool: text(),
	lastUpdated: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	academicYearId: text(),
	photoFileId: text(),
	photoUrl: text(),
	enrollmentSubmittedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	index("Student_academicYearId_enrollmentStatus_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.enrollmentStatus.asc().nullsLast().op("text_ops")),
	index("Student_academicYearId_gradeLevel_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.gradeLevel.asc().nullsLast().op("text_ops")),
	index("Student_academicYearId_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops")),
	uniqueIndex("Student_lrn_key").using("btree", table.lrn.asc().nullsLast().op("text_ops")),
	uniqueIndex("Student_studentNo_key").using("btree", table.studentNo.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "Student_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const studentAssessment = pgTable("StudentAssessment", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	academicYearId: text().notNull(),
	feeTemplateId: text(),
	regularDiscountPercent: doublePrecision().default(0).notNull(),
	siblingDiscountPercent: doublePrecision().default(0).notNull(),
	scholarshipDiscountPercent: doublePrecision().default(0).notNull(),
	grossAmount: doublePrecision().default(0).notNull(),
	discountAmount: doublePrecision().default(0).notNull(),
	netAmount: doublePrecision().default(0).notNull(),
	paidAmount: doublePrecision().default(0).notNull(),
	balance: doublePrecision().default(0).notNull(),
	financeStatus: text().default('With Balance').notNull(),
	createdById: text(),
	updatedById: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("StudentAssessment_academicYearId_financeStatus_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.financeStatus.asc().nullsLast().op("text_ops")),
	index("StudentAssessment_academicYearId_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops")),
	uniqueIndex("StudentAssessment_studentId_academicYearId_key").using("btree", table.studentId.asc().nullsLast().op("text_ops"), table.academicYearId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "StudentAssessment_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [user.id],
			name: "StudentAssessment_createdById_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.feeTemplateId],
			foreignColumns: [feeTemplate.id],
			name: "StudentAssessment_feeTemplateId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "StudentAssessment_studentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.updatedById],
			foreignColumns: [user.id],
			name: "StudentAssessment_updatedById_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const studentFee = pgTable("StudentFee", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	feeType: text().notNull(),
	amount: doublePrecision().notNull(),
	status: text().notNull(),
	dueDate: timestamp({ precision: 3, mode: 'string' }),
	paidDate: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "StudentFee_studentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const studentAssessmentLineItem = pgTable("StudentAssessmentLineItem", {
	id: text().primaryKey().notNull(),
	studentAssessmentId: text().notNull(),
	feeTypeId: text().notNull(),
	description: text().notNull(),
	amount: doublePrecision().notNull(),
	sourceFeeTemplateLineItemId: text(),
}, (table) => [
	foreignKey({
			columns: [table.feeTypeId],
			foreignColumns: [feeType.id],
			name: "StudentAssessmentLineItem_feeTypeId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.sourceFeeTemplateLineItemId],
			foreignColumns: [feeTemplateLineItem.id],
			name: "StudentAssessmentLineItem_sourceFeeTemplateLineItemId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.studentAssessmentId],
			foreignColumns: [studentAssessment.id],
			name: "StudentAssessmentLineItem_studentAssessmentId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const studentSibling = pgTable("StudentSibling", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	siblingName: text().notNull(),
	relationship: text(),
	gradeLevel: text(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "StudentSibling_studentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp("rolled_back_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	role: text().default('ADMIN').notNull(),
	studentId: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	avatarFileId: text(),
	avatarUrl: text(),
}, (table) => [
	uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("User_studentId_key").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "User_studentId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const academicRecord = pgTable("AcademicRecord", {
	id: text().primaryKey().notNull(),
	studentName: text().notNull(),
	gradeLevel: text().notNull(),
	section: text(),
	schoolYear: text().notNull(),
	generalAverage: text(),
	remarks: text(),
	status: text().notNull(),
	academicYearId: text(),
	studentId: text(),
}, (table) => [
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "AcademicRecord_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "AcademicRecord_studentId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const chatConversation = pgTable("ChatConversation", {
	id: text().primaryKey().notNull(),
	ownerUserId: text().notNull(),
	subject: text().default('SFXSAI Support Chat').notNull(),
	status: text().default('OPEN').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("ChatConversation_ownerUserId_status_idx").using("btree", table.ownerUserId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ownerUserId],
			foreignColumns: [user.id],
			name: "ChatConversation_ownerUserId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const chatMessage = pgTable("ChatMessage", {
	id: text().primaryKey().notNull(),
	conversationId: text().notNull(),
	senderUserId: text(),
	senderName: text().notNull(),
	senderRole: text().notNull(),
	body: text().notNull(),
	source: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	readAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	index("ChatMessage_conversationId_createdAt_idx").using("btree", table.conversationId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("ChatMessage_senderUserId_idx").using("btree", table.senderUserId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [chatConversation.id],
			name: "ChatMessage_conversationId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.senderUserId],
			foreignColumns: [user.id],
			name: "ChatMessage_senderUserId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const teacherAttendanceRecord = pgTable("TeacherAttendanceRecord", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	classId: text().notNull(),
	studentId: text().notNull(),
	date: timestamp({ precision: 3, mode: 'string' }).notNull(),
	status: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	reason: text().default('').notNull(),
}, (table) => [
	index("TeacherAttendanceRecord_teacherUserId_classId_idx").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops"), table.classId.asc().nullsLast().op("text_ops")),
	uniqueIndex("TeacherAttendanceRecord_teacherUserId_classId_studentId_dat_key").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops"), table.classId.asc().nullsLast().op("text_ops"), table.studentId.asc().nullsLast().op("timestamp_ops"), table.date.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherAttendanceRecord_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const teacherClassAssignment = pgTable("TeacherClassAssignment", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	academicYearId: text(),
	sectionId: text(),
	sectionName: text().notNull(),
	subject: text().notNull(),
	schedule: text().notNull(),
	room: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("TeacherClassAssignment_academicYearId_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops")),
	index("TeacherClassAssignment_sectionId_idx").using("btree", table.sectionId.asc().nullsLast().op("text_ops")),
	index("TeacherClassAssignment_teacherUserId_idx").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherClassAssignment_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "TeacherClassAssignment_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [section.id],
			name: "TeacherClassAssignment_sectionId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const teacherGradeRecord = pgTable("TeacherGradeRecord", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	classId: text().notNull(),
	studentId: text().notNull(),
	quarter: text().notNull(),
	written: doublePrecision(),
	performance: doublePrecision(),
	exam: doublePrecision(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("TeacherGradeRecord_teacherUserId_classId_idx").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops"), table.classId.asc().nullsLast().op("text_ops")),
	uniqueIndex("TeacherGradeRecord_teacherUserId_classId_studentId_quarter_key").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops"), table.classId.asc().nullsLast().op("text_ops"), table.studentId.asc().nullsLast().op("text_ops"), table.quarter.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherGradeRecord_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const teacherResource = pgTable("TeacherResource", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	classId: text().notNull(),
	title: text().notNull(),
	type: text().notNull(),
	subject: text().notNull(),
	size: text().default('Pending upload').notNull(),
	uploadedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("TeacherResource_teacherUserId_classId_idx").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops"), table.classId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherResource_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const teacherLessonLog = pgTable("TeacherLessonLog", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	classId: text().notNull(),
	date: timestamp({ precision: 3, mode: 'string' }).notNull(),
	objectives: text().notNull(),
	activities: text().notNull(),
	materials: text().notNull(),
	remarks: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("TeacherLessonLog_teacherUserId_classId_date_idx").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops"), table.classId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherLessonLog_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const teacherAnnouncement = pgTable("TeacherAnnouncement", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	audience: text().notNull(),
	title: text().notNull(),
	body: text().notNull(),
	postedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("TeacherAnnouncement_teacherUserId_postedAt_idx").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops"), table.postedAt.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherAnnouncement_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const teacherDirectMessage = pgTable("TeacherDirectMessage", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	thread: text().notNull(),
	sender: text().notNull(),
	audience: text().notNull(),
	message: text().notNull(),
	sentAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("TeacherDirectMessage_teacherUserId_sentAt_idx").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops"), table.sentAt.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherDirectMessage_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const teacherProfile = pgTable("TeacherProfile", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	department: text(),
	phone: text(),
	advisoryClass: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	accountStatus: text().default('Active').notNull(),
	adminRole: text().default('Teacher').notNull(),
	sectionAssignment: text(),
	subjects: text().default('').notNull(),
	totalClassesHandled: integer().default(0).notNull(),
	numberOfStudents: integer().default(0).notNull(),
	weeklyHours: integer().default(0).notNull(),
	assignedGradeLevel: text(),
}, (table) => [
	uniqueIndex("TeacherProfile_teacherUserId_key").using("btree", table.teacherUserId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherProfile_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const calendarEvent = pgTable("CalendarEvent", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	eventDate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	endDate: timestamp({ precision: 3, mode: 'string' }),
	eventType: text().notNull(),
	color: text(),
	academicYearId: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("CalendarEvent_academicYearId_eventDate_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops"), table.eventDate.asc().nullsLast().op("text_ops")),
	index("CalendarEvent_academicYearId_idx").using("btree", table.academicYearId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYear.id],
			name: "CalendarEvent_academicYearId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const teacherScheduleEntry = pgTable("TeacherScheduleEntry", {
	id: text().primaryKey().notNull(),
	teacherUserId: text().notNull(),
	weekday: text().notNull(),
	weekdaySort: integer().notNull(),
	title: text().notNull(),
	startTime: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("TeacherScheduleEntry_teacherUserId_weekdaySort_idx").using("btree", table.teacherUserId.asc().nullsLast().op("int4_ops"), table.weekdaySort.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.teacherUserId],
			foreignColumns: [user.id],
			name: "TeacherScheduleEntry_teacherUserId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const studentCoreValues = pgTable("StudentCoreValues", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	schoolYear: text().notNull(),
	quarter: text().notNull(),
	makaDiyos: text().notNull(),
	makatao: text().notNull(),
	makakalikasan: text().notNull(),
	makabansa: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("StudentCoreValues_studentId_idx").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
	uniqueIndex("StudentCoreValues_studentId_schoolYear_quarter_key").using("btree", table.studentId.asc().nullsLast().op("text_ops"), table.schoolYear.asc().nullsLast().op("text_ops"), table.quarter.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "StudentCoreValues_studentId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const studentHealthProfile = pgTable("StudentHealthProfile", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	schoolYear: text().notNull(),
	recordType: text().notNull(),
	heightMeters: doublePrecision().notNull(),
	weightKg: doublePrecision().notNull(),
	bmi: doublePrecision().notNull(),
	bmiCategory: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("StudentHealthProfile_studentId_idx").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
	uniqueIndex("StudentHealthProfile_studentId_schoolYear_recordType_key").using("btree", table.studentId.asc().nullsLast().op("text_ops"), table.schoolYear.asc().nullsLast().op("text_ops"), table.recordType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [student.id],
			name: "StudentHealthProfile_studentId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);
