import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  PrincipalAudience,
  PrincipalClassSection,
  PrincipalStudent,
  PrincipalSubjectMetric,
  PrincipalTeacher,
} from './principal-portal.util';

export interface PrincipalTrend {
  label: string;
  attendance: number;
  performance: number;
  enrollment: number;
}

export interface PrincipalAlert {
  id: string;
  severity: 'High' | 'Medium' | 'Low';
  title: string;
  detail: string;
  owner: string;
}

export interface PrincipalAnnouncement {
  id: string;
  audience: PrincipalAudience;
  title: string;
  body: string;
  pinned: boolean;
  scheduledFor: string;
}

export interface PrincipalMessage {
  id: string;
  recipient: string;
  channel: 'Teacher' | 'Class' | 'Admin';
  body: string;
  sentAt: string;
}

export interface PrincipalCalendarItem {
  id: string;
  date: string;
  title: string;
  type: string;
}

export interface PrincipalPortalState {
  principal: {
    name: string;
    email: string;
    title: string;
    phone: string;
    office: string;
  };
  teachers: PrincipalTeacher[];
  students: PrincipalStudent[];
  classes: PrincipalClassSection[];
  subjects: PrincipalSubjectMetric[];
  trends: PrincipalTrend[];
  alerts: PrincipalAlert[];
  announcements: PrincipalAnnouncement[];
  messages: PrincipalMessage[];
  calendar: PrincipalCalendarItem[];
}

const STORAGE_KEY = 'sfxsai.principal.portal.state.v1';

const initialState: PrincipalPortalState = {
  principal: {
    name: 'Academic Director',
    email: 'principal@sfxsai.com',
    title: 'Principal / Academic Director',
    phone: '0917 777 2026',
    office: 'Main Academic Office',
  },
  teachers: [
    { id: 't-001', name: 'Maria Santos', department: 'Mathematics', classesHandled: 4, attendanceRate: 98, performance: 91, status: 'Active' },
    { id: 't-002', name: 'Joel Reyes', department: 'Science', classesHandled: 5, attendanceRate: 96, performance: 89, status: 'Active' },
    { id: 't-003', name: 'Ana Dela Cruz', department: 'Language', classesHandled: 3, attendanceRate: 94, performance: 86, status: 'Coaching' },
    { id: 't-004', name: 'Ramon Villanueva', department: 'MAPEH', classesHandled: 2, attendanceRate: 91, performance: 83, status: 'Active' },
  ],
  students: [
    { id: 's-001', name: 'Lee Brent Cubian', gradeLevel: 'Nursery', section: 'St. Anne', average: 92, attendanceRate: 97, status: 'Active' },
    { id: 's-002', name: 'Jean Kyrie Dadula', gradeLevel: 'Nursery', section: 'St. Anne', average: 88, attendanceRate: 95, status: 'Active' },
    { id: 's-003', name: 'Mikhabellle Eilish Garbo', gradeLevel: 'G1', section: 'St. Therese', average: 91, attendanceRate: 96, status: 'Active' },
    { id: 's-004', name: 'Austin Levi Lagario', gradeLevel: 'G1', section: 'St. Therese', average: 85, attendanceRate: 93, status: 'Active' },
    { id: 's-005', name: 'Kyrztan Mark Llemit', gradeLevel: 'G7', section: 'St. Clare', average: 73, attendanceRate: 84, status: 'Active' },
    { id: 's-006', name: 'Lance Pingal', gradeLevel: 'G7', section: 'St. Clare', average: 82, attendanceRate: 91, status: 'Active' },
    { id: 's-007', name: 'Chris Louie Sayod', gradeLevel: 'G7', section: 'St. Clare', average: 79, attendanceRate: 78, status: 'Pending' },
    { id: 's-008', name: 'Danaya Selene Suralta', gradeLevel: 'G8', section: 'St. Agnes', average: 89, attendanceRate: 93, status: 'Active' },
    { id: 's-009', name: 'Zuriel Edelweiss Tabaranza', gradeLevel: 'G8', section: 'St. Agnes', average: 94, attendanceRate: 98, status: 'Active' },
    { id: 's-010', name: 'Alexys Verana', gradeLevel: 'G9', section: 'St. Ignatius', average: 76, attendanceRate: 86, status: 'Dropped' },
  ],
  classes: [
    { id: 'c-001', gradeLevel: 'Nursery', section: 'St. Anne', adviser: 'Maria Santos', subject: 'Homeroom', enrollment: 2, average: 90, attendanceRate: 96 },
    { id: 'c-002', gradeLevel: 'G1', section: 'St. Therese', adviser: 'Ana Dela Cruz', subject: 'Core Subjects', enrollment: 2, average: 88, attendanceRate: 95 },
    { id: 'c-003', gradeLevel: 'G7', section: 'St. Clare', adviser: 'Maria Santos', subject: 'Mathematics', enrollment: 3, average: 78, attendanceRate: 84 },
    { id: 'c-004', gradeLevel: 'G8', section: 'St. Agnes', adviser: 'Joel Reyes', subject: 'Science', enrollment: 2, average: 92, attendanceRate: 96 },
    { id: 'c-005', gradeLevel: 'G9', section: 'St. Ignatius', adviser: 'Ramon Villanueva', subject: 'MAPEH', enrollment: 1, average: 76, attendanceRate: 86 },
  ],
  subjects: [
    { subject: 'Mathematics', gradeLevel: 'G7', quarter: 'Q1', average: 82, passRate: 86 },
    { subject: 'Science', gradeLevel: 'G8', quarter: 'Q1', average: 91, passRate: 96 },
    { subject: 'English', gradeLevel: 'G9', quarter: 'Q1', average: 84, passRate: 89 },
    { subject: 'Filipino', gradeLevel: 'G1', quarter: 'Q1', average: 88, passRate: 94 },
    { subject: 'MAPEH', gradeLevel: 'G9', quarter: 'Q1', average: 79, passRate: 82 },
  ],
  trends: [
    { label: 'Jan', attendance: 90, performance: 82, enrollment: 54 },
    { label: 'Feb', attendance: 91, performance: 83, enrollment: 58 },
    { label: 'Mar', attendance: 92, performance: 85, enrollment: 62 },
    { label: 'Apr', attendance: 89, performance: 84, enrollment: 65 },
    { label: 'May', attendance: 93, performance: 86, enrollment: 69 },
    { label: 'Jun', attendance: 91, performance: 87, enrollment: 73 },
  ],
  alerts: [
    { id: 'a-001', severity: 'High', title: 'G7 attendance below threshold', detail: 'St. Clare is below the 85% leadership watch line.', owner: 'Adviser: Maria Santos' },
    { id: 'a-002', severity: 'Medium', title: 'Two learners need academic intervention', detail: 'Average or attendance risk detected this quarter.', owner: 'Academic Coordinator' },
    { id: 'a-003', severity: 'Low', title: 'Teacher coaching follow-up', detail: 'Language department observation notes need review.', owner: 'Principal Office' },
  ],
  announcements: [
    { id: 'ann-001', audience: 'Entire school', title: 'Quarterly Academic Review', body: 'Department heads will submit performance notes by Friday.', pinned: true, scheduledFor: '2026-06-17 8:00 AM' },
  ],
  messages: [
    { id: 'm-001', recipient: 'Faculty Group', channel: 'Teacher', body: 'Prepare class intervention reports for at-risk learners.', sentAt: '9:10 AM' },
  ],
  calendar: [
    { id: 'cal-001', date: 'Jun 17', title: 'Academic Council', type: 'Leadership' },
    { id: 'cal-002', date: 'Jun 19', title: 'Parent Conference', type: 'Student Support' },
    { id: 'cal-003', date: 'Jun 21', title: 'DepEd Report Review', type: 'Compliance' },
  ],
};

@Injectable({ providedIn: 'root' })
export class PrincipalPortalService {
  private readonly stateSubject = new BehaviorSubject<PrincipalPortalState>(this.loadState());
  readonly state$ = this.stateSubject.asObservable();

  snapshot(): PrincipalPortalState {
    return this.stateSubject.value;
  }

  postAnnouncement(input: Omit<PrincipalAnnouncement, 'id'>) {
    const current = this.snapshot();
    this.setState({
      ...current,
      announcements: [{ ...input, id: `ann-${Date.now()}` }, ...current.announcements],
    });
  }

  sendMessage(input: Omit<PrincipalMessage, 'id' | 'sentAt'>) {
    const current = this.snapshot();
    this.setState({
      ...current,
      messages: [{ ...input, id: `m-${Date.now()}`, sentAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }, ...current.messages],
    });
  }

  updateProfile(profile: PrincipalPortalState['principal']) {
    this.setState({ ...this.snapshot(), principal: profile });
  }

  private setState(state: PrincipalPortalState) {
    this.stateSubject.next(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private loadState(): PrincipalPortalState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as PrincipalPortalState : initialState;
    } catch {
      return initialState;
    }
  }
}
