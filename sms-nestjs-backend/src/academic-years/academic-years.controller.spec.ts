import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { ROLES_KEY } from '../auth/roles.decorator';
import { AcademicYearsController } from './academic-years.controller';

describe('AcademicYearsController security metadata', () => {
  const reflector = new Reflector();

  it('does not mark academic-year routes as public', () => {
    expect(
      reflector.get(IS_PUBLIC_KEY, AcademicYearsController),
    ).toBeUndefined();
  });

  it('requires admin role for academic-year routes', () => {
    expect(reflector.get(ROLES_KEY, AcademicYearsController)).toEqual([
      'ADMIN',
    ]);
  });

  it('allows operational users to read academic years', () => {
    expect(
      reflector.get(ROLES_KEY, AcademicYearsController.prototype.findAll),
    ).toEqual(['ADMIN', 'REGISTRAR', 'FINANCE', 'PRINCIPAL', 'TEACHER', 'STUDENT']);
    expect(
      reflector.get(ROLES_KEY, AcademicYearsController.prototype.findOne),
    ).toEqual(['ADMIN', 'REGISTRAR', 'FINANCE', 'PRINCIPAL', 'TEACHER', 'STUDENT']);
  });
});
