import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OnInit, inject, DestroyRef } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { StudentRecord } from '../../../core/models/registrar.models';
import { replaceStudentInList } from './student-masterlist-realtime.util';
import { displayGradeLevel, gradeLevelMatches, gradeLevelOptions } from '../../../core/data/grade-levels';

@Component({
  selector: 'app-student-masterlist',
  standalone: true,
  imports: [NgFor, NgClass, RouterLink],
  templateUrl: './student-masterlist.component.html',
  styleUrl: './student-masterlist.component.scss'
})
export class StudentMasterlistComponent implements OnInit {
  private api = inject(RegistrarApiService);
  private destroyRef = inject(DestroyRef);
  students: StudentRecord[] = [];
  selectedGrade: string = 'All';
  grades = [{ value: 'All', label: 'All grade levels' }, ...gradeLevelOptions];
  readonly displayGradeLevel = displayGradeLevel;

  get filteredStudents(): StudentRecord[] {
    if (this.selectedGrade === 'All') return this.students;
    return this.students.filter(s => gradeLevelMatches(s.gradeLevel, this.selectedGrade));
  }

  ngOnInit() {
    this.api.activeAcademicYear$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(ay => !!ay),
      switchMap(ay => this.api.getStudents(ay.id))
    ).subscribe({
      next: (data) => this.students = data,
      error: (err) => console.error('Failed to load data', err)
    });

    this.api.studentUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedStudent) => {
        this.students = replaceStudentInList(this.students, updatedStudent);
      });
  }

  statusClass(status: string): string {
    if (status.includes('Officially') || status.includes('Approved') || status.includes('Cleared') || status.includes('Complete')) {
      return 'bg-emerald-50 text-emerald-700';
    }
    if (status.includes('Review') || status.includes('Assessment') || status.includes('Partially')) {
      return 'bg-blue-50 text-blue-700';
    }
    if (status.includes('Missing') || status.includes('Incomplete') || status.includes('Balance')) {
      return 'bg-amber-50 text-amber-700';
    }
    return 'bg-slate-100 text-slate-700';
  }

  trackStudent(_: number, item: StudentRecord): string {
    return item.id || '';
  }
}
