const fs = require('fs');
const path = require('path');

const modules = [
  { name: 'academic-years', entity: 'academicYear', className: 'AcademicYears' },
  { name: 'document-requirements', entity: 'documentRequirement', className: 'DocumentRequirements' },
  { name: 'academic-records', entity: 'academicRecord', className: 'AcademicRecords' },
  { name: 'learner-movements', entity: 'learnerMovement', className: 'LearnerMovements' },
  { name: 'document-requests', entity: 'documentRequest', className: 'DocumentRequests' },
  { name: 'deped-forms', entity: 'depEdForm', className: 'DepedForms' },
  { name: 'id-qr-records', entity: 'idQrRecord', className: 'IdQrRecords' }
];

modules.forEach(mod => {
  const dir = path.join(__dirname, 'src', mod.name);
  
  // Update Service
  const servicePath = path.join(dir, `${mod.name}.service.ts`);
  const serviceCode = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ${mod.className}Service {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.${mod.entity}.create({ data });
  }

  findAll() {
    return this.prisma.${mod.entity}.findMany();
  }

  findOne(id: string) {
    return this.prisma.${mod.entity}.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.${mod.entity}.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.${mod.entity}.delete({ where: { id } });
  }
}
`;
  fs.writeFileSync(servicePath, serviceCode);

  // Update Controller
  const controllerPath = path.join(dir, `${mod.name}.controller.ts`);
  const controllerCode = `import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ${mod.className}Service } from './${mod.name}.service';

@Controller('${mod.name}')
export class ${mod.className}Controller {
  constructor(private readonly service: ${mod.className}Service) {}

  @Post()
  create(@Body() createDto: any) {
    return this.service.create(createDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
`;
  fs.writeFileSync(controllerPath, controllerCode);

  // Update Module
  const modulePath = path.join(dir, `${mod.name}.module.ts`);
  const moduleCode = `import { Module } from '@nestjs/common';
import { ${mod.className}Service } from './${mod.name}.service';
import { ${mod.className}Controller } from './${mod.name}.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [${mod.className}Controller],
  providers: [${mod.className}Service]
})
export class ${mod.className}Module {}
`;
  fs.writeFileSync(modulePath, moduleCode);

});

console.log('Successfully applied CRUD logic and PrismaModule imports to all remaining modules!');
