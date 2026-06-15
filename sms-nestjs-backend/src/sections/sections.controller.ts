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

@Roles('REGISTRAR')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.sectionsService.create(createDto);
  }

  @Get()
  findAll(@Query('ayId') ayId?: string) {
    return this.sectionsService.findAll(ayId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.sectionsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }

  @Post(':id/assign')
  batchAssign(@Param('id') id: string, @Body() body: { studentIds: string[] }) {
    return this.sectionsService.batchAssign(id, body.studentIds);
  }
}
