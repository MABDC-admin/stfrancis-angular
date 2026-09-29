export function getSubjectsForGradeLevel(gradeLevel: string | number | undefined | null): string[] {
  const levelStr = String(gradeLevel || '').toUpperCase();

  if (levelStr === 'KG' || levelStr === 'KINDERGARTEN' || levelStr === 'K' || levelStr === 'NURSERY' || levelStr === 'PRE-SCHOOL') {
    return [
      'Socio-Emotional Development',
      'Values Development (GMRC)',
      'Cognitive Development',
      'Physical Health and Motor Development',
      'Aesthetic/Creative Development',
      'Literacy, Language, and Communication'
    ];
  }

  // Handle number formats or 'G1', 'GRADE 1', etc.
  let numStr = levelStr.replace(/[^0-9]/g, '');
  let num = parseInt(numStr, 10);

  if (isNaN(num)) {
    // Default fallback
    return [
      'English',
      'Filipino',
      'Mathematics',
      'Science',
      'Araling Panlipunan (AP)',
      'MAPEH (Music, Arts, PE, Health)',
      'Edukasyon sa Pagpapakatao (EsP)'
    ];
  }

  if (num >= 1 && num <= 3) {
    return [
      'English',
      'Filipino',
      'Mathematics',
      'Science',
      'Araling Panlipunan (AP)',
      'MAPEH (Music, Arts, PE, Health)',
      'Edukasyon sa Pagpapakatao (EsP / Values Education)',
      'Mother Tongue'
    ];
  } else if (num >= 4 && num <= 6) {
    return [
      'English',
      'Filipino',
      'Mathematics',
      'Science',
      'Araling Panlipunan',
      'MAPEH',
      'Edukasyon sa Pagpapakatao (EsP)',
      'EPP / TLE (Edukasyong Pantahanan at Pangkabuhayan)'
    ];
  } else if (num >= 7 && num <= 10) {
    return [
      'English',
      'Filipino',
      'Mathematics',
      'Science',
      'Araling Panlipunan (Social Studies)',
      'MAPEH (Music, Arts, PE, Health)',
      'Edukasyon sa Pagpapakatao (EsP)',
      'Technology and Livelihood Education (TLE)'
    ];
  }

  // Senior High School (G11-G12) fallback or others
  return [
    'English',
    'Filipino',
    'Mathematics',
    'Science',
    'Araling Panlipunan',
    'MAPEH',
    'Edukasyon sa Pagpapakatao (EsP)'
  ];
}
