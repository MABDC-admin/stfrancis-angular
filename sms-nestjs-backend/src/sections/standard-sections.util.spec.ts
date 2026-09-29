import { buildStandardSections, standardSectionNames } from './standard-sections.util';
import { normalizeStandardGradeLevel } from './standard-sections.util';

describe('standard sections', () => {
  it('builds SFXSAI and MABDC sections for every supported grade level', () => {
    const sections = buildStandardSections('ay-2026', new Map([
      ['Nursery', 3],
      ['G7', 9],
    ]));

    expect(sections).toHaveLength(28);
    expect(standardSectionNames).toEqual(['SFXSAI', 'MABDC']);
    expect(sections).toEqual(expect.arrayContaining([
      expect.objectContaining({ academicYearId: 'ay-2026', gradeLevel: 'Nursery', sectionName: 'SFXSAI', enrolled: 3, availableSlots: 27, status: 'Open' }),
      expect.objectContaining({ academicYearId: 'ay-2026', gradeLevel: 'Nursery', sectionName: 'MABDC', enrolled: 0, availableSlots: 30, status: 'Open' }),
      expect.objectContaining({ academicYearId: 'ay-2026', gradeLevel: 'G12', sectionName: 'SFXSAI' }),
    ]));
  });

  it('normalizes full grade labels when counting section enrollment', () => {
    const sections = buildStandardSections('ay-2026', new Map([
      ['G3', 13],
      ['Grade 3', 1],
    ]));

    expect(sections).toEqual(expect.arrayContaining([
      expect.objectContaining({ gradeLevel: 'G3', sectionName: 'SFXSAI', enrolled: 14, availableSlots: 16 }),
    ]));
  });

  it('normalizes compact grade labels', () => {
    const gradeAliases = ['grade3', 'g3', '3', 'Kinder', 'kinder'];
    expect(gradeAliases.map(normalizeStandardGradeLevel)).toEqual([
      'G3',
      'G3',
      'G3',
      'K2',
      'K2',
    ]);
  });
});
