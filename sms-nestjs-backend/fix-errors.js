const fs = require('fs');
const path = require('path');

const files = [
  'academic-records/academic-records.controller.ts',
  'deped-forms/deped-forms.controller.ts',
  'document-requests/document-requests.controller.ts',
  'document-requirements/document-requirements.controller.ts',
  'id-qr-records/id-qr-records.controller.ts',
  'learner-movements/learner-movements.controller.ts'
];

files.forEach(f => {
  const fullPath = path.join(__dirname, 'src', f);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Replace "this.xyzService.findAll" with "this.service.findAll"
    content = content.replace(/this\.[a-zA-Z]+Service\.findAll\(ayId\)/, 'this.service.findAll(ayId)');
    // Just in case it's named something else
    // Check what the constructor says
    const match = content.match(/constructor\(private readonly ([a-zA-Z]+)/);
    if (match) {
      const propName = match[1];
      content = content.replace(/this\.[a-zA-Z]+Service\.findAll\(ayId\)/g, `this.${propName}.findAll(ayId)`);
      content = content.replace(/this\.service\.findAll\(ayId\)/g, `this.${propName}.findAll(ayId)`);
    }
    fs.writeFileSync(fullPath, content);
  }
});
