const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/app/pages/registrar');

const componentsToUpdate = [
  { folder: 'student-masterlist', file: 'student-masterlist.component.ts', getCall: 'getStudents', prop: 'students' },
  { folder: 'enrollment', file: 'enrollment.component.ts', getCall: 'getEnrollmentApplications', prop: 'applications' },
  { folder: 'sections', file: 'section-assignment.component.ts', getCall: 'getSections', prop: 'sections', actuallyFolder: 'section-assignment' },
  { folder: 'documents', file: 'documents.component.ts', getCall: 'getStudents', prop: 'students' },
  { folder: 'academic-records', file: 'academic-records.component.ts', getCall: 'getAcademicRecords', prop: 'records' },
  { folder: 'learner-movement', file: 'learner-movement.component.ts', getCall: 'getLearnerMovements', prop: 'movements' },
  { folder: 'document-requests', file: 'document-requests.component.ts', getCall: 'getDocumentRequests', prop: 'requests' },
  { folder: 'deped-forms', file: 'deped-forms.component.ts', getCall: 'getDepedForms', prop: 'forms' },
  { folder: 'id-qr-management', file: 'id-qr-management.component.ts', getCall: 'getStudents', prop: 'students' }
];

componentsToUpdate.forEach(c => {
  const compDir = c.actuallyFolder ? c.actuallyFolder : c.folder;
  const compPath = path.join(baseDir, compDir, c.file);
  
  if (fs.existsSync(compPath)) {
    let content = fs.readFileSync(compPath, 'utf8');

    // add imports
    if (!content.includes('switchMap')) {
      content = content.replace(/import { OnInit, inject } from '@angular\/core';/, "import { OnInit, inject, DestroyRef } from '@angular/core';\nimport { switchMap, filter } from 'rxjs/operators';\nimport { takeUntilDestroyed } from '@angular/core/rxjs-interop';");
    }

    // add destroyRef
    if (!content.includes('destroyRef = inject(DestroyRef)')) {
      content = content.replace(/private api = inject\(RegistrarApiService\);/, "private api = inject(RegistrarApiService);\n  private destroyRef = inject(DestroyRef);");
    }

    // replace ngOnInit
    const regex = new RegExp(`ngOnInit\\(\\) {[\\s\\S]*?this\\.api\\.${c.getCall}\\(\\)\\.subscribe\\({[\\s\\S]*?}\\);\\n  }`);
    const replacement = `ngOnInit() {
    this.api.activeAcademicYear$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(ay => !!ay),
      switchMap(ay => this.api.${c.getCall}(ay.id))
    ).subscribe({
      next: (data) => this.${c.prop} = data,
      error: (err) => console.error('Failed to load data', err)
    });
  }`;
    content = content.replace(regex, replacement);

    fs.writeFileSync(compPath, content);
    console.log('Updated ' + c.file);
  } else {
    console.log('Not found: ' + compPath);
  }
});
