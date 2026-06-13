import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicYearManagement } from './academic-year-management';

describe('AcademicYearManagement', () => {
  let component: AcademicYearManagement;
  let fixture: ComponentFixture<AcademicYearManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicYearManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicYearManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
