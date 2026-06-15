import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { TeacherService } from './teacher.service';

interface AuthenticatedRequest {
  user?: {
    sub?: string;
    userId?: string;
    id?: string;
    email?: string;
    role?: string;
  };
}

@Controller('teacher')
@Roles('TEACHER')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  private teacherUserId(req: AuthenticatedRequest): string {
    return this.teacherService.requireTeacherUserId(req.user ?? {});
  }

  @Get('portal')
  getPortal(@Req() req: AuthenticatedRequest) {
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Patch('profile')
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() body: Parameters<TeacherService['updateProfile']>[1]) {
    await this.teacherService.updateProfile(this.teacherUserId(req), body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Post('attendance')
  async markAttendance(@Req() req: AuthenticatedRequest, @Body() body: Parameters<TeacherService['markAttendance']>[1]) {
    await this.teacherService.markAttendance(this.teacherUserId(req), body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Post('grades')
  async upsertGrade(@Req() req: AuthenticatedRequest, @Body() body: Parameters<TeacherService['upsertGrade']>[1]) {
    await this.teacherService.upsertGrade(this.teacherUserId(req), body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Post('resources')
  async createResource(@Req() req: AuthenticatedRequest, @Body() body: Parameters<TeacherService['createResource']>[1]) {
    await this.teacherService.createResource(this.teacherUserId(req), body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Patch('resources/:id')
  async updateResource(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Parameters<TeacherService['updateResource']>[2],
  ) {
    await this.teacherService.updateResource(this.teacherUserId(req), id, body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Delete('resources/:id')
  async deleteResource(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.teacherService.deleteResource(this.teacherUserId(req), id);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Post('dlls')
  async createLessonLog(@Req() req: AuthenticatedRequest, @Body() body: Parameters<TeacherService['createLessonLog']>[1]) {
    await this.teacherService.createLessonLog(this.teacherUserId(req), body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Patch('dlls/:id')
  async updateLessonLog(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Parameters<TeacherService['updateLessonLog']>[2],
  ) {
    await this.teacherService.updateLessonLog(this.teacherUserId(req), id, body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Delete('dlls/:id')
  async deleteLessonLog(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.teacherService.deleteLessonLog(this.teacherUserId(req), id);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Post('announcements')
  async createAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Body() body: Parameters<TeacherService['createAnnouncement']>[1],
  ) {
    await this.teacherService.createAnnouncement(this.teacherUserId(req), body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Patch('announcements/:id')
  async updateAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Parameters<TeacherService['updateAnnouncement']>[2],
  ) {
    await this.teacherService.updateAnnouncement(this.teacherUserId(req), id, body);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Delete('announcements/:id')
  async deleteAnnouncement(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.teacherService.deleteAnnouncement(this.teacherUserId(req), id);
    return this.teacherService.getPortalState(req.user ?? {});
  }

  @Post('messages')
  async sendMessage(@Req() req: AuthenticatedRequest, @Body() body: Parameters<TeacherService['sendMessage']>[1]) {
    await this.teacherService.sendMessage(this.teacherUserId(req), body);
    return this.teacherService.getPortalState(req.user ?? {});
  }
}
