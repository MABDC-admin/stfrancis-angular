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
import { EnrollmentApplicationsService } from './enrollment-applications.service';
import { Roles } from '../auth/roles.decorator';

@Roles('REGISTRAR')
@Controller('enrollment-applications')
export class EnrollmentApplicationsController {
  constructor(
    private readonly enrollmentApplicationsService: EnrollmentApplicationsService,
  ) {}

  @Post()
  create(@Body() createDto: any) {
    return this.enrollmentApplicationsService.create(createDto);
  }

  @Get()
  findAll(@Query('ayId') ayId?: string) {
    return this.enrollmentApplicationsService.findAll(ayId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentApplicationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.enrollmentApplicationsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentApplicationsService.remove(id);
  }
}
