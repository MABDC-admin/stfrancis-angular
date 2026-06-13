import { Reflector } from '@nestjs/core';
import { AcademicRecordsController } from '../academic-records/academic-records.controller';
import { DepedFormsController } from '../deped-forms/deped-forms.controller';
import { DocumentRequestsController } from '../document-requests/document-requests.controller';
import { DocumentRequirementsController } from '../document-requirements/document-requirements.controller';
import { EnrollmentApplicationsController } from '../enrollment-applications/enrollment-applications.controller';
import { IdQrRecordsController } from '../id-qr-records/id-qr-records.controller';
import { LearnerMovementsController } from '../learner-movements/learner-movements.controller';
import { SectionsController } from '../sections/sections.controller';
import { StudentsController } from '../students/students.controller';
import { ROLES_KEY } from './roles.decorator';

describe('registrar controller role metadata', () => {
  const reflector = new Reflector();

  it.each([
    AcademicRecordsController,
    DepedFormsController,
    DocumentRequestsController,
    DocumentRequirementsController,
    EnrollmentApplicationsController,
    IdQrRecordsController,
    LearnerMovementsController,
    SectionsController,
    StudentsController,
  ])('%p requires registrar role', (controller) => {
    expect(reflector.get(ROLES_KEY, controller)).toEqual(['REGISTRAR']);
  });

  it('allows finance read-only access to student lookup endpoints', () => {
    expect(
      reflector.get(ROLES_KEY, StudentsController.prototype.findAll),
    ).toEqual(['REGISTRAR', 'FINANCE']);
    expect(
      reflector.get(ROLES_KEY, StudentsController.prototype.findOne),
    ).toEqual(['REGISTRAR', 'FINANCE']);
  });
});
