import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarService } from '../../core/services/calendar.service';
import { CalendarEvent } from '../../core/models/registrar.models';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './calendar.component.html',
})
export class CalendarPageComponent implements OnInit {
  private calendarService = inject(CalendarService);
  private fb = inject(FormBuilder);

  currentDate = new Date();
  daysInMonth: Date[] = [];
  events: CalendarEvent[] = [];
  showModal = false;
  eventForm!: FormGroup;
  editingEventId: string | null = null;
  selectedDate: Date | null = null;

  eventTypes = [
    { type: 'Holiday', color: '#ef4444' }, // red
    { type: 'Exam', color: '#f59e0b' },    // amber
    { type: 'Meeting', color: '#3b82f6' }, // blue
    { type: 'Other', color: '#8b5cf6' }    // violet
  ];

  ngOnInit() {
    this.initForm();
    this.generateCalendar();
    this.loadEvents();
  }

  initForm() {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      eventDate: ['', Validators.required],
      endDate: [''],
      eventType: ['Other', Validators.required]
    });
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Padding for first week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Padding for last week
    const endDate = new Date(lastDay);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    this.daysInMonth = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      this.daysInMonth.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  previousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  isCurrentMonth(date: Date) {
    return date.getMonth() === this.currentDate.getMonth();
  }

  isToday(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  loadEvents() {
    this.calendarService.getEvents().subscribe(res => {
      this.events = res;
    });
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    return this.events.filter(e => {
      const eDate = new Date(e.eventDate);
      return eDate.getDate() === date.getDate() &&
             eDate.getMonth() === date.getMonth() &&
             eDate.getFullYear() === date.getFullYear();
    });
  }

  openModal(date?: Date, event?: CalendarEvent) {
    this.showModal = true;
    if (event) {
      this.editingEventId = event.id || null;
      this.eventForm.patchValue({
        title: event.title,
        description: event.description,
        eventDate: new Date(event.eventDate).toISOString().split('T')[0],
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        eventType: event.eventType
      });
    } else {
      this.editingEventId = null;
      this.eventForm.reset({
        eventType: 'Other',
        eventDate: date ? date.toISOString().split('T')[0] : ''
      });
    }
  }

  closeModal() {
    this.showModal = false;
  }

  saveEvent() {
    if (this.eventForm.invalid) return;

    const val = this.eventForm.value;
    const typeObj = this.eventTypes.find(t => t.type === val.eventType);
    
    // Ensure dates are valid ISO strings for Prisma
    const formattedEventDate = new Date(val.eventDate).toISOString();
    const formattedEndDate = val.endDate ? new Date(val.endDate).toISOString() : null;

    const eventData: any = {
      ...val,
      eventDate: formattedEventDate,
      endDate: formattedEndDate,
      color: typeObj?.color || '#8b5cf6'
    };

    if (this.editingEventId) {
      this.calendarService.updateEvent(this.editingEventId, eventData).subscribe(() => {
        this.loadEvents();
        this.closeModal();
      });
    } else {
      this.calendarService.createEvent(eventData).subscribe(() => {
        this.loadEvents();
        this.closeModal();
      });
    }
  }

  deleteEvent() {
    if (this.editingEventId) {
      this.calendarService.deleteEvent(this.editingEventId).subscribe(() => {
        this.loadEvents();
        this.closeModal();
      });
    }
  }
}
