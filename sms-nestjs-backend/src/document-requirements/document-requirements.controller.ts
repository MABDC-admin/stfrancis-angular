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
import { DocumentRequirementsService } from './document-requirements.service';
import { Roles } from '../auth/roles.decorator';

@Roles('REGISTRAR')
@Controller('document-requirements')
export class DocumentRequirementsController {
  constructor(private readonly service: DocumentRequirementsService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('ayId') ayId?: string) {
    return this.service.findAll(ayId);
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
