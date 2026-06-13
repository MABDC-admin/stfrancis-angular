import { StudentRecord } from '../../core/models/registrar.models';

export interface UpcomingBirthday {
  learnerName: string;
  gradeLevel: string;
  dateLabel: string;
  daysUntil: number;
}

const birthdayDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function buildUpcomingBirthdays(
  students: StudentRecord[],
  today = new Date(),
  windowDays = 30,
): UpcomingBirthday[] {
  const start = startOfDay(today);

  return students
    .filter((student) => !!student.birthdate)
    .map((student) => {
      const nextBirthday = nextBirthdayDate(student.birthdate as string, start);
      const daysUntil = Math.round((nextBirthday.getTime() - start.getTime()) / 86400000);

      return {
        learnerName: `${student.lastName}, ${student.firstName}`,
        gradeLevel: student.gradeLevel,
        dateLabel: birthdayDate.format(nextBirthday),
        daysUntil,
      };
    })
    .filter((birthday) => birthday.daysUntil >= 0 && birthday.daysUntil <= windowDays)
    .sort((left, right) => left.daysUntil - right.daysUntil || left.learnerName.localeCompare(right.learnerName))
    .slice(0, 5);
}

function nextBirthdayDate(birthdate: string, today: Date) {
  const parsed = new Date(birthdate);
  let next = new Date(today.getFullYear(), parsed.getMonth(), parsed.getDate());

  if (next < today) {
    next = new Date(today.getFullYear() + 1, parsed.getMonth(), parsed.getDate());
  }

  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
