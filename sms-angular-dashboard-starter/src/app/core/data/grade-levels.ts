export interface GradeLevelOption {
  value: string;
  label: string;
}

export const gradeLevelOptions: GradeLevelOption[] = [
  { value: 'Nursery', label: 'Nursery' },
  { value: 'K2', label: 'Kindergarten 2' },
  { value: 'G1', label: 'Grade 1' },
  { value: 'G2', label: 'Grade 2' },
  { value: 'G3', label: 'Grade 3' },
  { value: 'G4', label: 'Grade 4' },
  { value: 'G5', label: 'Grade 5' },
  { value: 'G6', label: 'Grade 6' },
  { value: 'G7', label: 'Grade 7' },
  { value: 'G8', label: 'Grade 8' },
  { value: 'G9', label: 'Grade 9' },
  { value: 'G10', label: 'Grade 10' },
  { value: 'G11', label: 'Grade 11' },
  { value: 'G12', label: 'Grade 12' },
];

export const gradeLevels = gradeLevelOptions.map(option => option.value);

const gradeLevelLabelMap = new Map(gradeLevelOptions.map(option => [option.value, option.label]));
const gradeLevelAliasMap = new Map<string, string>([
  ['pre-kindergarten', 'Nursery'],
  ['kindergarten', 'Nursery'],
  ['kindergarten 1', 'Nursery'],
  ['nursery', 'Nursery'],
  ['k1', 'Nursery'],
  ['kindergarten 2', 'K2'],
  ['k2', 'K2'],
  ...gradeLevelOptions
    .filter(option => option.value.startsWith('G'))
    .flatMap(option => [
      [option.value.toLowerCase(), option.value],
      [option.label.toLowerCase(), option.value],
    ] as Array<[string, string]>),
]);

export function normalizeGradeLevel(gradeLevel: string | null | undefined): string {
  if (!gradeLevel) {
    return '';
  }

  return gradeLevelAliasMap.get(gradeLevel.trim().toLowerCase()) || gradeLevel.trim();
}

export function displayGradeLevel(gradeLevel: string | null | undefined): string {
  const normalized = normalizeGradeLevel(gradeLevel);

  if (!normalized) {
    return 'No grade';
  }

  return gradeLevelLabelMap.get(normalized) || normalized;
}

export function gradeLevelMatches(actual: string | null | undefined, expected: string | null | undefined): boolean {
  return normalizeGradeLevel(actual) === normalizeGradeLevel(expected);
}
