import { Component, HostListener, inject, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { buildRegistrarClearancePayload } from './learner-profile-clearance.util';
import { shouldCloseModalOnKey } from './learner-profile-modal.util';

@Component({
  selector: 'app-learner-profile',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink, DatePipe, FormsModule],
  templateUrl: './learner-profile.component.html',
  styleUrl: './learner-profile.component.scss'
})
export class LearnerProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(RegistrarApiService);

  student: any | null = null;
  enrollments: any[] = [];
  documents: any[] = [];
  academicHistory: any[] = [];
  behaviorRecords: any[] = [];
  fees: any[] = [];
  siblings: any[] = [];
  achievements: any[] = [];
  medicalAlerts: any[] = [];
  userAccount: any | null = null;
  sections: any[] = [];
  isMarkingRegistrarCleared = false;
  isUploadingDocument = false;
  isUploadingPhoto = false;
  toast = {
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };
  
  requiredDocuments = [
    'PSA Birth Certificate (Original)',
    'SF9 / Form 138 (Original Report Card)',
    'SF10 / Form 137 (Permanent Record)',
    'Certificate of Good Moral Character',
    '2x2 ID Pictures (2 pcs)',
    'Medical Certificate'
  ];

  behaviorSubTab: 'disciplinary' | 'attendance' = 'disciplinary';

  activeTab: string = 'personal';
  tabs = [
    { id: 'personal', label: 'Personal Info', icon: 'person' },
    { id: 'academic', label: 'Academic Records', icon: 'school' },
    { id: 'behavior', label: 'Behavior', icon: 'gavel' },
    { id: 'documents', label: 'Documents', icon: 'folder' },
    { id: 'fees', label: 'Fees', icon: 'payments' },
    { id: 'siblings', label: 'Siblings', icon: 'family_restroom' },
    { id: 'user', label: 'User Login', icon: 'key' }
  ];

  isModalOpen = false;
  modalType: 'sibling' | 'academic' | 'behavior' | 'fee' | 'edit-info' | 'move-section' | null = null;
  formData: any = {};

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent) {
    if (!shouldCloseModalOnKey(event.key, this.isModalOpen)) return;
    event.preventDefault();
    this.closeModal();
  }

  get studentAge(): string | number {
    if (!this.student?.birthdate) return 'N/A';
    const bdate = new Date(this.student.birthdate);
    const diff = Date.now() - bdate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  get filteredBehaviorRecords() {
    if (this.behaviorSubTab === 'attendance') {
      return this.behaviorRecords.filter(r => r.incidentType === 'Tardiness' || r.incidentType === 'Absent');
    }
    return this.behaviorRecords.filter(r => r.incidentType !== 'Tardiness' && r.incidentType !== 'Absent');
  }

  get attendanceIssuesCount() {
    return this.behaviorRecords.filter(r => r.incidentType === 'Tardiness' || r.incidentType === 'Absent').length;
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    this.toast.title = title;
    this.toast.message = message;
    this.toast.type = type;
    this.toast.show = true;
    setTimeout(() => {
      this.toast.show = false;
    }, 4000);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getStudentById(id).subscribe(res => {
        this.student = res;
        this.loadRelatedData();
      });
      
      // Fetch sections for the Move Section modal
      this.api.getSections().subscribe(sections => {
        this.sections = sections;
      });
    }
  }

  loadRelatedData() {
    if (!this.student) return;

    this.api.getSections().subscribe(secs => {
      this.sections = secs;
    });

    this.enrollments = this.student.enrollments || [];
    this.academicHistory = this.student.academicHistory || this.student.academicRecords || [];
    this.behaviorRecords = this.student.behaviorRecords || [];
    this.fees = this.student.fees || [];
    this.siblings = this.student.siblings || [];
    this.loadStoredDocuments();
    this.achievements = this.student.achievements || [];
    this.medicalAlerts = this.student.medicalAlerts || [];
    this.userAccount = this.student.user || this.student.userAccount || null;
  }

  setTab(tabId: string) {
    this.activeTab = tabId;
  }

  statusClass(status: string): string {
    if (status.includes('Officially') || status.includes('Approved') || status.includes('Verified') || status.includes('Cleared') || status.includes('Complete') || status.includes('Validated')) {
      return 'bg-emerald-50 text-emerald-700';
    }
    if (status.includes('Review') || status.includes('Assessment') || status.includes('Partially')) {
      return 'bg-blue-50 text-blue-700';
    }
    if (status.includes('Missing') || status.includes('Incomplete') || status.includes('Balance') || status.includes('Pending')) {
      return 'bg-amber-50 text-amber-700';
    }
    return 'bg-slate-100 text-slate-700';
  }

  loadStoredDocuments() {
    if (!this.student?.id) return;
    this.api.getStoredFiles('student', this.student.id, 'document').subscribe({
      next: (files) => {
        this.documents = files.map(file => ({
          ...file,
          requirement: file.originalName,
          uploadedAt: file.uploadedAt,
          status: 'Uploaded',
          isImage: file.mimeType?.startsWith('image/'),
          fileUrl: file.publicUrl
        }));
      },
      error: () => this.showToast('Documents unavailable', 'Unable to load saved learner documents.', 'error')
    });
  }

  handlePdfUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.isUploadingDocument = true;

    this.api.uploadStudentDocument(this.student.id, file).subscribe({
      next: (savedFile) => {
        this.documents.unshift({
          ...savedFile,
          requirement: savedFile.originalName,
          uploadedAt: savedFile.uploadedAt,
          status: 'Uploaded',
          isImage: savedFile.mimeType?.startsWith('image/'),
          fileUrl: savedFile.publicUrl
        });
        this.isUploadingDocument = false;
        input.value = '';
        this.showToast('Document saved', 'The learner document was uploaded and stored.', 'success');
      },
      error: () => {
        this.isUploadingDocument = false;
        input.value = '';
        this.showToast('Upload failed', 'Only PDF and image files up to 10 MB are allowed.', 'error');
      }
    });
  }

  handlePhotoUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!this.student?.id || !input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.showToast('Photo not uploaded', 'Please choose a PNG, JPG, or WEBP image file.', 'error');
      return;
    }

    this.isUploadingPhoto = true;
    this.api.uploadStudentPhoto(this.student.id, file).subscribe({
      next: (savedFile) => {
        this.student = {
          ...this.student,
          photoUrl: savedFile.publicUrl,
          photoFileId: savedFile.id
        };
        this.isUploadingPhoto = false;
        input.value = '';
        this.showToast('Photo saved', 'The learner profile photo was updated.', 'success');
      },
      error: () => {
        this.isUploadingPhoto = false;
        input.value = '';
        this.showToast('Upload failed', 'Only image files up to 5 MB are allowed.', 'error');
      }
    });
  }

  deleteDocument(doc: any) {
    if (!doc?.id) return;
    if (!confirm(`Delete ${doc.originalName || doc.requirement}?`)) {
      return;
    }

    this.api.deleteStoredFile(doc.id).subscribe({
      next: () => {
        this.documents = this.documents.filter(item => item.id !== doc.id);
        this.showToast('Document deleted', 'The stored learner document was removed.', 'success');
      },
      error: () => this.showToast('Delete failed', 'Unable to remove the stored document.', 'error')
    });
  }

  get availableSections() {
    return this.sections.filter(s => s.gradeLevel === this.student?.gradeLevel);
  }

  openModal(type: 'sibling' | 'academic' | 'behavior' | 'fee' | 'edit-info' | 'move-section') {
    this.modalType = type;
    this.formData = {};
    if (type === 'fee') this.formData.status = 'Outstanding Balance';
    if (type === 'edit-info') {
      this.formData = { 
        firstName: this.student.firstName,
        lastName: this.student.lastName,
        gender: this.student.gender,
        birthdate: this.student.birthdate ? new Date(this.student.birthdate).toISOString().split('T')[0] : null,
        contactNo: this.student.contactNo,
        address: this.student.address,
        uaeAddress: this.student.uaeAddress,
        phAddress: this.student.phAddress,
        motherName: this.student.motherName,
        motherContact: this.student.motherContact,
        fatherName: this.student.fatherName,
        fatherContact: this.student.fatherContact,
        guardian: this.student.guardian,
        previousSchool: this.student.previousSchool
      };
    }
    if (type === 'move-section') this.formData = { newSection: '' };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalType = null;
    this.formData = {};
  }

  saveModal() {
    if (!this.student?.id) return;
    const id = this.student.id;
    
    if (this.modalType === 'sibling') {
      this.api.addStudentSibling(id, this.formData).subscribe(res => {
        this.siblings.push(res);
        this.closeModal();
      });
    } else if (this.modalType === 'behavior') {
      this.formData.date = new Date().toISOString();
      this.api.addBehaviorRecord(id, this.formData).subscribe(res => {
        this.behaviorRecords.push(res);
        this.closeModal();
      });
    } else if (this.modalType === 'fee') {
      this.formData.amount = Number(this.formData.amount);
      if (this.formData.status === 'Fully Paid') this.formData.paidDate = new Date().toISOString();
      this.api.addStudentFee(id, this.formData).subscribe(res => {
        this.fees.push(res);
        this.closeModal();
      });
    } else if (this.modalType === 'edit-info') {
      const payload = { ...this.formData };
      // Prisma expects a valid ISO DateTime string or Date object
      if (payload.birthdate) {
        payload.birthdate = new Date(payload.birthdate).toISOString();
      }
      
      this.api.updateStudent(id, payload).subscribe({
        next: (res) => {
          this.student = { ...this.student, ...res };
          this.closeModal();
          this.showToast('Learner updated', 'The learner profile changes were saved.', 'success');
        },
        error: (err) => {
          console.error(err);
          this.showToast('Save failed', 'Failed to save changes. Please check the learner details and try again.', 'error');
        }
      });
    } else if (this.modalType === 'move-section') {
      const sectionName = this.availableSections.find(s => s.id === this.formData.newSection)?.sectionName;
      if (sectionName) {
        this.api.updateStudent(id, { section: sectionName }).subscribe(res => {
          this.student.section = sectionName;
          this.closeModal();
          this.showToast('Section updated', 'The learner section was updated in registrar records.', 'success');
        });
      }
    }
  }

  markCleared() {
    if (!this.student?.id) return;
    this.isMarkingRegistrarCleared = true;
    this.api.updateStudent(this.student.id, buildRegistrarClearancePayload(this.student.enrollmentStatus)).subscribe({
      next: (res) => {
        this.student = { ...this.student, ...res };
        this.isMarkingRegistrarCleared = false;
        this.showToast('Registrar cleared', 'Learner status updated in realtime across registrar records.', 'success');
      },
      error: () => {
        this.isMarkingRegistrarCleared = false;
        this.showToast('Clearance failed', 'Failed to mark this learner as Registrar Cleared.', 'error');
      }
    });
  }

  resetPassword() {
    if (!this.student?.id) return;
    if (confirm('Are you sure you want to reset this student\'s password to default?')) {
      this.api.resetStudentPassword(this.student.id).subscribe({
        next: () => this.showToast('Password reset', 'The learner password was reset to the default value.', 'success'),
        error: () => this.showToast('Reset failed', 'Failed to reset the learner password.', 'error')
      });
    }
  }
}
