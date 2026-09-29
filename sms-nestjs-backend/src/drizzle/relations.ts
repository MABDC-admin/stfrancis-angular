import { relations } from "drizzle-orm/relations";
import { student, behaviorRecord, academicYear, depEdForm, documentRequest, documentRequirement, feeTemplate, feeTemplateLineItem, feeType, idQrRecord, user, integrationLog, learnerMovement, enrollmentApplication, payment, studentAssessment, paymentReceiptAudit, section, studentFee, studentAssessmentLineItem, studentSibling, academicRecord, chatConversation, chatMessage, teacherAttendanceRecord, teacherClassAssignment, teacherGradeRecord, teacherResource, teacherLessonLog, teacherAnnouncement, teacherDirectMessage, teacherProfile, calendarEvent, teacherScheduleEntry, studentCoreValues, studentHealthProfile } from "./schema";

export const behaviorRecordRelations = relations(behaviorRecord, ({one}) => ({
	student: one(student, {
		fields: [behaviorRecord.studentId],
		references: [student.id]
	}),
}));

export const studentRelations = relations(student, ({one, many}) => ({
	behaviorRecords: many(behaviorRecord),
	payments: many(payment),
	academicYear: one(academicYear, {
		fields: [student.academicYearId],
		references: [academicYear.id]
	}),
	studentAssessments: many(studentAssessment),
	studentFees: many(studentFee),
	studentSiblings: many(studentSibling),
	users: many(user),
	academicRecords: many(academicRecord),
	studentCoreValues: many(studentCoreValues),
	studentHealthProfiles: many(studentHealthProfile),
}));

export const depEdFormRelations = relations(depEdForm, ({one}) => ({
	academicYear: one(academicYear, {
		fields: [depEdForm.academicYearId],
		references: [academicYear.id]
	}),
}));

export const academicYearRelations = relations(academicYear, ({many}) => ({
	depEdForms: many(depEdForm),
	documentRequests: many(documentRequest),
	documentRequirements: many(documentRequirement),
	feeTemplates: many(feeTemplate),
	idQrRecords: many(idQrRecord),
	learnerMovements: many(learnerMovement),
	enrollmentApplications: many(enrollmentApplication),
	payments: many(payment),
	sections: many(section),
	students: many(student),
	studentAssessments: many(studentAssessment),
	academicRecords: many(academicRecord),
	teacherClassAssignments: many(teacherClassAssignment),
	calendarEvents: many(calendarEvent),
}));

export const documentRequestRelations = relations(documentRequest, ({one}) => ({
	academicYear: one(academicYear, {
		fields: [documentRequest.academicYearId],
		references: [academicYear.id]
	}),
}));

export const documentRequirementRelations = relations(documentRequirement, ({one}) => ({
	academicYear: one(academicYear, {
		fields: [documentRequirement.academicYearId],
		references: [academicYear.id]
	}),
}));

export const feeTemplateRelations = relations(feeTemplate, ({one, many}) => ({
	academicYear: one(academicYear, {
		fields: [feeTemplate.academicYearId],
		references: [academicYear.id]
	}),
	feeTemplateLineItems: many(feeTemplateLineItem),
	studentAssessments: many(studentAssessment),
}));

export const feeTemplateLineItemRelations = relations(feeTemplateLineItem, ({one, many}) => ({
	feeTemplate: one(feeTemplate, {
		fields: [feeTemplateLineItem.feeTemplateId],
		references: [feeTemplate.id]
	}),
	feeType: one(feeType, {
		fields: [feeTemplateLineItem.feeTypeId],
		references: [feeType.id]
	}),
	studentAssessmentLineItems: many(studentAssessmentLineItem),
}));

export const feeTypeRelations = relations(feeType, ({many}) => ({
	feeTemplateLineItems: many(feeTemplateLineItem),
	studentAssessmentLineItems: many(studentAssessmentLineItem),
}));

export const idQrRecordRelations = relations(idQrRecord, ({one}) => ({
	academicYear: one(academicYear, {
		fields: [idQrRecord.academicYearId],
		references: [academicYear.id]
	}),
}));

export const integrationLogRelations = relations(integrationLog, ({one}) => ({
	user: one(user, {
		fields: [integrationLog.performedById],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({one, many}) => ({
	integrationLogs: many(integrationLog),
	payments: many(payment),
	paymentReceiptAudits: many(paymentReceiptAudit),
	studentAssessments_createdById: many(studentAssessment, {
		relationName: "studentAssessment_createdById_user_id"
	}),
	studentAssessments_updatedById: many(studentAssessment, {
		relationName: "studentAssessment_updatedById_user_id"
	}),
	student: one(student, {
		fields: [user.studentId],
		references: [student.id]
	}),
	chatConversations: many(chatConversation),
	chatMessages: many(chatMessage),
	teacherAttendanceRecords: many(teacherAttendanceRecord),
	teacherClassAssignments: many(teacherClassAssignment),
	teacherGradeRecords: many(teacherGradeRecord),
	teacherResources: many(teacherResource),
	teacherLessonLogs: many(teacherLessonLog),
	teacherAnnouncements: many(teacherAnnouncement),
	teacherDirectMessages: many(teacherDirectMessage),
	teacherProfiles: many(teacherProfile),
	teacherScheduleEntries: many(teacherScheduleEntry),
}));

export const learnerMovementRelations = relations(learnerMovement, ({one}) => ({
	academicYear: one(academicYear, {
		fields: [learnerMovement.academicYearId],
		references: [academicYear.id]
	}),
}));

export const enrollmentApplicationRelations = relations(enrollmentApplication, ({one}) => ({
	academicYear: one(academicYear, {
		fields: [enrollmentApplication.academicYearId],
		references: [academicYear.id]
	}),
}));

export const paymentRelations = relations(payment, ({one, many}) => ({
	academicYear: one(academicYear, {
		fields: [payment.academicYearId],
		references: [academicYear.id]
	}),
	user: one(user, {
		fields: [payment.encodedById],
		references: [user.id]
	}),
	studentAssessment: one(studentAssessment, {
		fields: [payment.studentAssessmentId],
		references: [studentAssessment.id]
	}),
	student: one(student, {
		fields: [payment.studentId],
		references: [student.id]
	}),
	paymentReceiptAudits: many(paymentReceiptAudit),
}));

export const studentAssessmentRelations = relations(studentAssessment, ({one, many}) => ({
	payments: many(payment),
	academicYear: one(academicYear, {
		fields: [studentAssessment.academicYearId],
		references: [academicYear.id]
	}),
	user_createdById: one(user, {
		fields: [studentAssessment.createdById],
		references: [user.id],
		relationName: "studentAssessment_createdById_user_id"
	}),
	feeTemplate: one(feeTemplate, {
		fields: [studentAssessment.feeTemplateId],
		references: [feeTemplate.id]
	}),
	student: one(student, {
		fields: [studentAssessment.studentId],
		references: [student.id]
	}),
	user_updatedById: one(user, {
		fields: [studentAssessment.updatedById],
		references: [user.id],
		relationName: "studentAssessment_updatedById_user_id"
	}),
	studentAssessmentLineItems: many(studentAssessmentLineItem),
}));

export const paymentReceiptAuditRelations = relations(paymentReceiptAudit, ({one}) => ({
	user: one(user, {
		fields: [paymentReceiptAudit.editedById],
		references: [user.id]
	}),
	payment: one(payment, {
		fields: [paymentReceiptAudit.paymentId],
		references: [payment.id]
	}),
}));

export const sectionRelations = relations(section, ({one, many}) => ({
	academicYear: one(academicYear, {
		fields: [section.academicYearId],
		references: [academicYear.id]
	}),
	teacherClassAssignments: many(teacherClassAssignment),
}));

export const studentFeeRelations = relations(studentFee, ({one}) => ({
	student: one(student, {
		fields: [studentFee.studentId],
		references: [student.id]
	}),
}));

export const studentAssessmentLineItemRelations = relations(studentAssessmentLineItem, ({one}) => ({
	feeType: one(feeType, {
		fields: [studentAssessmentLineItem.feeTypeId],
		references: [feeType.id]
	}),
	feeTemplateLineItem: one(feeTemplateLineItem, {
		fields: [studentAssessmentLineItem.sourceFeeTemplateLineItemId],
		references: [feeTemplateLineItem.id]
	}),
	studentAssessment: one(studentAssessment, {
		fields: [studentAssessmentLineItem.studentAssessmentId],
		references: [studentAssessment.id]
	}),
}));

export const studentSiblingRelations = relations(studentSibling, ({one}) => ({
	student: one(student, {
		fields: [studentSibling.studentId],
		references: [student.id]
	}),
}));

export const academicRecordRelations = relations(academicRecord, ({one}) => ({
	academicYear: one(academicYear, {
		fields: [academicRecord.academicYearId],
		references: [academicYear.id]
	}),
	student: one(student, {
		fields: [academicRecord.studentId],
		references: [student.id]
	}),
}));

export const chatConversationRelations = relations(chatConversation, ({one, many}) => ({
	user: one(user, {
		fields: [chatConversation.ownerUserId],
		references: [user.id]
	}),
	chatMessages: many(chatMessage),
}));

export const chatMessageRelations = relations(chatMessage, ({one}) => ({
	chatConversation: one(chatConversation, {
		fields: [chatMessage.conversationId],
		references: [chatConversation.id]
	}),
	user: one(user, {
		fields: [chatMessage.senderUserId],
		references: [user.id]
	}),
}));

export const teacherAttendanceRecordRelations = relations(teacherAttendanceRecord, ({one}) => ({
	user: one(user, {
		fields: [teacherAttendanceRecord.teacherUserId],
		references: [user.id]
	}),
}));

export const teacherClassAssignmentRelations = relations(teacherClassAssignment, ({one}) => ({
	user: one(user, {
		fields: [teacherClassAssignment.teacherUserId],
		references: [user.id]
	}),
	academicYear: one(academicYear, {
		fields: [teacherClassAssignment.academicYearId],
		references: [academicYear.id]
	}),
	section: one(section, {
		fields: [teacherClassAssignment.sectionId],
		references: [section.id]
	}),
}));

export const teacherGradeRecordRelations = relations(teacherGradeRecord, ({one}) => ({
	user: one(user, {
		fields: [teacherGradeRecord.teacherUserId],
		references: [user.id]
	}),
}));

export const teacherResourceRelations = relations(teacherResource, ({one}) => ({
	user: one(user, {
		fields: [teacherResource.teacherUserId],
		references: [user.id]
	}),
}));

export const teacherLessonLogRelations = relations(teacherLessonLog, ({one}) => ({
	user: one(user, {
		fields: [teacherLessonLog.teacherUserId],
		references: [user.id]
	}),
}));

export const teacherAnnouncementRelations = relations(teacherAnnouncement, ({one}) => ({
	user: one(user, {
		fields: [teacherAnnouncement.teacherUserId],
		references: [user.id]
	}),
}));

export const teacherDirectMessageRelations = relations(teacherDirectMessage, ({one}) => ({
	user: one(user, {
		fields: [teacherDirectMessage.teacherUserId],
		references: [user.id]
	}),
}));

export const teacherProfileRelations = relations(teacherProfile, ({one}) => ({
	user: one(user, {
		fields: [teacherProfile.teacherUserId],
		references: [user.id]
	}),
}));

export const calendarEventRelations = relations(calendarEvent, ({one}) => ({
	academicYear: one(academicYear, {
		fields: [calendarEvent.academicYearId],
		references: [academicYear.id]
	}),
}));

export const teacherScheduleEntryRelations = relations(teacherScheduleEntry, ({one}) => ({
	user: one(user, {
		fields: [teacherScheduleEntry.teacherUserId],
		references: [user.id]
	}),
}));

export const studentCoreValuesRelations = relations(studentCoreValues, ({one}) => ({
	student: one(student, {
		fields: [studentCoreValues.studentId],
		references: [student.id]
	}),
}));

export const studentHealthProfileRelations = relations(studentHealthProfile, ({one}) => ({
	student: one(student, {
		fields: [studentHealthProfile.studentId],
		references: [student.id]
	}),
}));