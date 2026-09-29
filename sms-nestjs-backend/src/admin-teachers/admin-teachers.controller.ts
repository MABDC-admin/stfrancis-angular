import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AdminTeachersService } from './admin-teachers.service';

@Controller('admin/teachers')
@Roles('ADMIN')
export class AdminTeachersController {
  constructor(private readonly adminTeachers: AdminTeachersService) {}

  @Get()
  findAll() {
    return this.adminTeachers.findAll();
  }

  @Post()
  create(@Body() body: Parameters<AdminTeachersService['create']>[0]) {
    return this.adminTeachers.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Parameters<AdminTeachersService['update']>[1],
  ) {
    return this.adminTeachers.update(id, body);
  }

  @Patch(':id/password')
  resetPassword(
    @Param('id') id: string,
    @Body() body: { password?: string },
  ) {
    return this.adminTeachers.resetPassword(id, body.password ?? '');
  }
}
