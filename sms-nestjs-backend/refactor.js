const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src');
const modules = [
  'students',
  'enrollment-applications',
  'sections',
  'document-requirements',
  'academic-records',
  'learner-movements',
  'document-requests',
  'id-qr-records',
  'deped-forms'
];

modules.forEach(mod => {
  const modParts = mod.split('-');
  const camelMod = modParts.map((p, i) => i === 0 ? p : p[0].toUpperCase() + p.slice(1)).join('');

  const controllerPath = path.join(baseDir, mod, `${mod}.controller.ts`);
  if (fs.existsSync(controllerPath)) {
    let content = fs.readFileSync(controllerPath, 'utf8');
    if (!content.includes("@Query('ayId')")) {
      content = content.replace(/import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs\/common';/, "import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';");
      content = content.replace(/findAll\(\) {\n\s*return this\.[a-zA-Z0-9_]+\.findAll\(\);\n\s*}/, `findAll(@Query('ayId') ayId?: string) {\n    return this.${camelMod}Service.findAll(ayId);\n  }`);
      fs.writeFileSync(controllerPath, content);
      console.log(`Updated ${mod}.controller.ts`);
    }
  }

  const servicePath = path.join(baseDir, mod, `${mod}.service.ts`);
  if (fs.existsSync(servicePath)) {
    let content = fs.readFileSync(servicePath, 'utf8');
    if (!content.includes('ayId?: string')) {
      // e.g. return this.prisma.student.findMany();
      // find the model name
      const modelNameMatch = content.match(/this\.prisma\.([a-zA-Z0-9]+)\.findMany\(\)/);
      if (modelNameMatch) {
        const modelName = modelNameMatch[1];
        content = content.replace(/findAll\(\) {\n\s*return this\.prisma\.[a-zA-Z0-9_]+\.findMany\(\);\n\s*}/, `findAll(ayId?: string) {\n    return this.prisma.${modelName}.findMany({ where: ayId ? { academicYearId: ayId } : undefined });\n  }`);
        fs.writeFileSync(servicePath, content);
        console.log(`Updated ${mod}.service.ts`);
      }
    }
  }
});
