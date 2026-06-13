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
import { DepedFormsService } from './deped-forms.service';
import { Roles } from '../auth/roles.decorator';

@Roles('REGISTRAR')
@Controller('deped-forms')
export class DepedFormsController {
  constructor(private readonly service: DepedFormsService) {}

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
