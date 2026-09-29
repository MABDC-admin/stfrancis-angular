const { neon } = require('@neondatabase/serverless');

function normalize(value) {
  return (value ?? '').trim().toUpperCase();
}

function normalizeStandardGradeLevel(grade) {
  if (!grade) return '';
  const map = new Map([
    ['PRE-KINDERGARTEN', 'NURSERY'],
    ['KINDERGARTEN', 'NURSERY'],
    ['KINDERGARTEN 1', 'NURSERY'],
    ['NURSERY', 'NURSERY'],
    ['KINDER', 'NURSERY'],
    ['K1', 'NURSERY'],
    ['KINDERGARTEN 2', 'K2'],
    ['K2', 'K2'],
  ]);
  const clean = grade.trim().toLowerCase();
  for (const g of ['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12']) {
    map.set(g.toLowerCase(), g);
    map.set(`grade ${g.slice(1)}`, g);
  }
  map.set('grade1', 'G1'); map.set('grade2','G2');
  map.set('grade 3', 'G3'); map.set('grade 10', 'G10');
  const mapped = map.get(clean);
  if (mapped) return mapped;
  return grade.trim();
}

function isCampusOnlySectionName(sectionName) {
  const n = normalize(sectionName);
  return n === 'SFXSAI' || n === 'MABDC';
}

function extractCampus(value) {
  const n = normalize(value);
  if (!n) return undefined;
  if (n === 'SFXSAI' || n.includes(' SFXSAI') || n.includes('SFXSAI ')) return 'SFXSAI';
  if (n === 'MABDC' || n.includes(' MABDC') || n.includes('MABDC ')) return 'MABDC';
  return undefined;
}

function sectionMatches(studentSection, section) {
  const normalizedStudentSection = normalize(studentSection);
  if (!normalizedStudentSection) return false;
  const normalizedSectionName = normalize(section.sectionName);
  const normalizedSectionGrade = normalize(section.gradeLevel);
  const normalizedSectionId = normalize(section.id);

  if (normalizedStudentSection === normalizedSectionName || normalizedStudentSection === normalizedSectionId) return true;
  if ([
    `${normalizedSectionName}-${normalizedSectionGrade}`,
    `${normalizedSectionName} ${normalizedSectionGrade}`,
    `${normalizedSectionName}-${normalizedSectionGrade} ${normalizedSectionName}`,
  ].includes(normalizedStudentSection)) return true;
  if (normalizedStudentSection.endsWith(`-${normalizedSectionName}`) || normalizedStudentSection.endsWith(` ${normalizedSectionName}`)) return true;
  if (normalizedStudentSection.startsWith(`${normalizedSectionName}-`) || normalizedStudentSection.startsWith(`${normalizedSectionName} `)) return true;
  if (normalizedStudentSection.includes(`-${normalizedSectionName}-`) || normalizedStudentSection.includes(` ${normalizedSectionName}-`) || normalizedStudentSection.includes(` ${normalizedSectionName} `) || normalizedStudentSection.includes(`-${normalizedSectionName} `)) return true;

  const studentCampus = extractCampus(studentSection);
  const sectionCampus = extractCampus(section.sectionName);
  if (!studentCampus || !sectionCampus || studentCampus !== sectionCampus) {
    return false;
  }

  if (isCampusOnlySectionName(section.sectionName)) {
    return normalizeStandardGradeLevel(studentSection) && false;
  }

  return normalizeStandardGradeLevel(studentSection) === normalizeStandardGradeLevel(section.gradeLevel);
}

function studentAssignedToSection(student, section) {
  if (!student.section || !section.gradeLevel) return false;

  const campusOnly = isCampusOnlySectionName(section.sectionName);
  const sectionHasStudentsByCampusAndGrade = campusOnly
    ? normalizeStandardGradeLevel(student.gradeLevel) === normalizeStandardGradeLevel(section.gradeLevel)
    : true;

  if (sectionMatches(student.section, section)) {
    return sectionHasStudentsByCampusAndGrade;
  }

  const studentCampus = extractCampus(student.section);
  const sectionCampus = extractCampus(section.sectionName);
  if (!studentCampus || !sectionCampus || studentCampus !== sectionCampus) {
    return false;
  }
  if (!campusOnly) {
    return normalizeStandardGradeLevel(student.gradeLevel) === normalizeStandardGradeLevel(section.gradeLevel);
  }
  return false;
}

const sql = neon(process.env.DATABASE_URL.replace('&pgbouncer=true', '').replace('?pgbouncer=true', ''));

(async () => {
  const [ay] = await sql`SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`;
  const sections = await sql`SELECT id, "gradeLevel", "sectionName", "academicYearId", enrolled, capacity FROM "Section" WHERE "academicYearId" = ${ay.id} ORDER BY "gradeLevel", "sectionName"`;
  const students = await sql`SELECT id, "gradeLevel", section FROM "Student" WHERE "academicYearId" = ${ay.id}`;

  for (const section of sections) {
    const matched = students.filter(student => studentAssignedToSection(student, section));
    console.log(`${section.sectionName} / ${section.gradeLevel} => ${matched.length} (enrolled=${section.enrolled})`);
  }

  const byCanonical = new Map();
  students.forEach(st => {
    const g = normalizeStandardGradeLevel(st.gradeLevel);
    byCanonical.set(g, (byCanonical.get(g) || 0) + 1);
  });
  console.log('canonicalStudents', Object.fromEntries(byCanonical));
})();
