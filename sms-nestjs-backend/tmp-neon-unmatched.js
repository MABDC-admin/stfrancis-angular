const { neon } = require('@neondatabase/serverless');

const databaseUrl = 'postgresql://neondb_owner:npg_PBVb6cqt4sFL@ep-morning-lake-ao4bwlif-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

const normalizeSectionValue = (value) => (value ?? '').trim().toUpperCase();
const normalizeGrade = (grade) => {
  if (!grade) return '';
  const normalized = String(grade).trim().toLowerCase().replace(/\s+/g, ' ');
  const map = new Map([
    ['pre-kindergarten', 'Nursery'],
    ['kindergarten', 'Nursery'],
    ['kindergarten 1', 'Nursery'],
    ['nursery', 'Nursery'],
    ['kinder', 'Nursery'],
    ['k1', 'Nursery'],
    ['kinder 2', 'K2'],
    ['kindergarten 2', 'K2'],
    ['k2', 'K2'],
    ['kinder2', 'K2'],
    ['grade1', 'G1'],
    ['grade2', 'G2'],
    ['grade3', 'G3'],
    ['grade4', 'G4'],
    ['grade5', 'G5'],
    ['grade6', 'G6'],
    ['grade7', 'G7'],
    ['grade8', 'G8'],
    ['grade9', 'G9'],
    ['grade10', 'G10'],
    ['grade11', 'G11'],
    ['grade12', 'G12'],
  ].concat([1,2,3,4,5,6,7,8,9,10,11,12].flatMap(n => [
    [`g${n}`, `G${n}`],
    [`${n}`, `G${n}`],
    [`grade ${n}`, `G${n}`],
    [`grade${n}`, `G${n}`],
  ])));
  if (map.has(normalized)) return map.get(normalized);
  const m = normalized.match(/^g?(\d+)$/);
  if (m) return `G${m[1]}`;
  return grade;
};

const extractCampus = (value) => {
  const normalized = normalizeSectionValue(value);
  if (!normalized) return undefined;
  if (normalized === 'SFXSAI' || normalized.includes(' SFXSAI') || normalized.includes('SFXSAI ')) return 'SFXSAI';
  if (normalized === 'MABDC' || normalized.includes(' MABDC') || normalized.includes('MABDC ')) return 'MABDC';
  return undefined;
};

const isCampusOnly = (sectionName) => {
  const normalized = normalizeSectionValue(sectionName);
  return normalized === 'SFXSAI' || normalized === 'MABDC';
};

const matchesSectionIdentifier = (studentSection, section) => {
  const s = normalizeSectionValue(studentSection);
  if (!s) return false;
  const nSectionName = normalizeSectionValue(section.sectionName);
  const nSectionId = normalizeSectionValue(section.id);
  const nSectionGrade = normalizeSectionValue(section.gradeLevel);
  return (
    s === nSectionName || s === nSectionId ||
    s === `${nSectionName}-${nSectionGrade}` ||
    s === `${nSectionName} ${nSectionGrade}` ||
    s.endsWith(`-${nSectionName}`) ||
    s.endsWith(` ${nSectionName}`) ||
    s === nSectionName ||
    s.startsWith(`${nSectionName}-`) ||
    s.startsWith(`${nSectionName} `) ||
    s.includes(`-${nSectionName}-`) ||
    s.includes(` ${nSectionName}-`) ||
    s.includes(` ${nSectionName} `) ||
    s.includes(`-${nSectionName} `)
  );
};

const studentAssigned = (student, section) => {
  if (!student.section || !section.gradeLevel) return false;

  const campusOnly = isCampusOnly(section.sectionName);

  if (matchesSectionIdentifier(student.section, section)) {
    if (campusOnly) {
      return normalizeGrade(student.gradeLevel) === normalizeGrade(section.gradeLevel);
    }
    return true;
  }

  const studentCampus = extractCampus(student.section);
  const sectionCampus = extractCampus(section.sectionName);
  if (!studentCampus || !sectionCampus || studentCampus !== sectionCampus) return false;

  if (!campusOnly) {
    return normalizeGrade(student.gradeLevel) === normalizeGrade(section.gradeLevel);
  }
  return false;
};

(async () => {
  const [ay] = await sql`SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`;
  const sections = await sql`SELECT id, "sectionName", "gradeLevel" FROM "Section" WHERE "academicYearId" = ${ay.id}`;
  const students = await sql`SELECT id, "lastName", "firstName", "gradeLevel", section FROM "Student" WHERE "academicYearId" = ${ay.id}`;

  const unmatched = [];
  let matchedCount = 0;

  for (const student of students) {
    const sectionList = sections.filter(section => studentAssigned(student, section));
    if (sectionList.length === 0) {
      unmatched.push(student);
    } else {
      matchedCount++;
    }
  }

  console.log('students', students.length);
  console.log('matched', matchedCount);
  console.log('unmatched', unmatched.length);
  for (const u of unmatched) {
    console.log(u.id, `${u.lastName}, ${u.firstName}`, `grade=${u.gradeLevel}`, `section=${u.section}`);
  }
})();
