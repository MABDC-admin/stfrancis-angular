import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CalendarEvent } from '../models/registrar.models';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getEvents(ayId?: string): Observable<CalendarEvent[]> {
    const params: any = ayId ? { ayId } : {};
    return this.http.get<CalendarEvent[]>(`${this.baseUrl}/calendar-events`, { params });
  }

  getEvent(id: string): Observable<CalendarEvent> {
    return this.http.get<CalendarEvent>(`${this.baseUrl}/calendar-events/${id}`);
  }

  createEvent(data: Partial<CalendarEvent>): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(`${this.baseUrl}/calendar-events`, data);
  }

  updateEvent(id: string, data: Partial<CalendarEvent>): Observable<CalendarEvent> {
    return this.http.patch<CalendarEvent>(`${this.baseUrl}/calendar-events/${id}`, data);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/calendar-events/${id}`);
  }
}
