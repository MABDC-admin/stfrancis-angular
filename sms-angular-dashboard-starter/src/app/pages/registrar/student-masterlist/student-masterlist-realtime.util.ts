import { StudentRecord } from '../../../core/models/registrar.models';

export function replaceStudentInList(students: StudentRecord[], updatedStudent: StudentRecord): StudentRecord[] {
  return students.map((student) => student.id === updatedStudent.id ? { ...student, ...updatedStudent } : student);
}
