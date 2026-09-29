import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { Roles } from '../auth/roles.decorator';

@Roles('REGISTRAR', 'TEACHER')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @Roles('REGISTRAR')
  create(@Body() createDto: any) {
    return this.sectionsService.create(createDto);
  }

  @Get()
  @Roles('REGISTRAR', 'TEACHER')
  findAll(@Query('ayId') ayId?: string) {
    return this.sectionsService.findAll(ayId);
  }

  @Get('meta/teachers')
  @Roles('REGISTRAR', 'TEACHER')
  getTeachers() {
    return this.sectionsService.getTeachers();
  }

  @Get(':id')
  @Roles('REGISTRAR', 'TEACHER')
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('REGISTRAR')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.sectionsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('REGISTRAR')
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }

  @Post(':id/assign')
  @Roles('REGISTRAR')
  batchAssign(@Param('id') id: string, @Body() body: { studentIds: string[] }) {
    return this.sectionsService.batchAssign(id, body.studentIds);
  }
}
