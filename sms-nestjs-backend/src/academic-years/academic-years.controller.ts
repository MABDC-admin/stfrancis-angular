import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { Roles } from '../auth/roles.decorator';

@Roles('ADMIN')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly service: AcademicYearsService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.service.create(createDto);
  }

  @Roles('ADMIN', 'REGISTRAR', 'FINANCE', 'PRINCIPAL', 'TEACHER', 'STUDENT')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('ADMIN', 'REGISTRAR', 'FINANCE', 'PRINCIPAL', 'TEACHER', 'STUDENT')
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
