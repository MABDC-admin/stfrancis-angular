import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarEventsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.calendarEvent.create({ data });
  }

  findAll(ayId?: string) {
    return this.prisma.calendarEvent.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.calendarEvent.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.calendarEvent.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.calendarEvent.delete({ where: { id } });
  }
}
