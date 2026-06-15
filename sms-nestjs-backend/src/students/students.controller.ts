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
import { StudentsService } from './students.service';
import { Roles } from '../auth/roles.decorator';

@Roles('REGISTRAR')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: any) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles('REGISTRAR', 'FINANCE')
  findAll(@Query('ayId') ayId?: string, @Query('search') search?: string) {
    return this.studentsService.findAll(ayId, search);
  }

  @Get(':id')
  @Roles('REGISTRAR', 'FINANCE')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: any) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Post(':id/behavior')
  addBehaviorRecord(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.addBehaviorRecord(id, body);
  }

  @Post(':id/fees')
  addStudentFee(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.addStudentFee(id, body);
  }

  @Post(':id/siblings')
  addStudentSibling(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.addStudentSibling(id, body);
  }

  @Patch(':id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.studentsService.resetPassword(id);
  }
}
