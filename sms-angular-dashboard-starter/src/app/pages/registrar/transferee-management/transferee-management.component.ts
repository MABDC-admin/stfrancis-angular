import { Component, inject, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { LearnerMovement } from '../../../core/models/registrar.models';
import { buildNewTransferPayload, defaultTransferStatus } from './transferee-management.util';

@Component({
  selector: 'app-transferee-management',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, FormsModule],
  templateUrl: './transferee-management.component.html',
  styleUrl: './transferee-management.component.scss'
})
export class TransfereeManagementComponent implements OnInit {
  private api = inject(RegistrarApiService);

  transfers: LearnerMovement[] = [];
  filteredTransfers: LearnerMovement[] = [];
  
  activeTab: 'incoming' | 'outgoing' | 'lrn-requests' = 'incoming';
  searchQuery: string = '';
  activeAcademicYearId: string | undefined;
  isSaving = false;
  toast = {
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  };

  isModalOpen = false;
  modalType: 'new' | 'lrn' | 'evaluate' | null = null;
  selectedTransfer: LearnerMovement | null = null;
  formData: any = {};

  ngOnInit() {
    this.api.activeAcademicYear$.subscribe(ay => {
      this.activeAcademicYearId = ay?.id;
      if (ay) this.loadTransfers(ay.id);
    });
  }

  loadTransfers(ayId: string) {
    this.api.getLearnerMovements(ayId).subscribe(data => {
      this.transfers = data.filter(m => m.movementType === 'Incoming Transfer' || m.movementType === 'Outgoing Transfer' || m.movementType === 'LRN Transfer');
      this.filterData();
    });
  }

  setTab(tab: 'incoming' | 'outgoing' | 'lrn-requests') {
    this.activeTab = tab;
    this.filterData();
  }

  filterData() {
    let base = this.transfers;

    if (this.activeTab === 'incoming') {
      base = base.filter(t => t.movementType.includes('Incoming'));
    } else if (this.activeTab === 'outgoing') {
      base = base.filter(t => t.movementType.includes('Outgoing'));
    } else if (this.activeTab === 'lrn-requests') {
      base = base.filter(t => t.status.includes('LRN'));
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      base = base.filter(t => t.studentName.toLowerCase().includes(q) || t.from?.toLowerCase().includes(q));
    }

    this.filteredTransfers = base;
  }

  statusClass(status: string): string {
    if (status.includes('Cleared') || status.includes('Evaluated') || status.includes('Approved')) return 'bg-emerald-50 text-emerald-700';
    if (status.includes('Pending LRN') || status.includes('Request')) return 'bg-amber-50 text-amber-700';
    if (status.includes('Pending Evaluation') || status.includes('Review')) return 'bg-blue-50 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  }

  openNewTransferModal() {
    this.modalType = 'new';
    this.selectedTransfer = null;
    this.formData = {
      transferDirection: this.activeTab === 'outgoing' ? 'Outgoing Transfer' : this.activeTab === 'lrn-requests' ? 'LRN Transfer' : 'Incoming Transfer',
      studentName: '',
      previousSchool: this.activeTab === 'outgoing' ? 'SFXSAI' : '',
      receivingSchool: this.activeTab === 'outgoing' ? '' : 'SFXSAI',
      effectiveDate: new Date().toISOString().slice(0, 10),
      status: ''
    };
    this.isModalOpen = true;
  }

  onTransferDirectionChange() {
    const direction = this.formData.transferDirection;
    this.formData.status = defaultTransferStatus(direction);
    if (direction === 'Outgoing Transfer') {
      this.formData.previousSchool = 'SFXSAI';
      this.formData.receivingSchool = '';
    } else {
      this.formData.previousSchool = '';
      this.formData.receivingSchool = 'SFXSAI';
    }
  }

  openModal(type: 'lrn' | 'evaluate', transfer: LearnerMovement) {
    this.modalType = type;
    this.selectedTransfer = transfer;
    this.formData = {};
    if (type === 'evaluate') this.formData.evaluationNotes = 'Verified subjects from SF10.';
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalType = null;
    this.selectedTransfer = null;
    this.formData = {};
  }

  saveModal() {
    if (!this.modalType || this.isSaving) return;

    if (this.modalType === 'new') {
      const payload = buildNewTransferPayload(this.formData, this.activeAcademicYearId);
      if (!payload.studentName || !payload.from || !payload.to) {
        this.showToast('Missing transfer details', 'Learner name, from school, and to school are required.', 'error');
        return;
      }

      this.isSaving = true;
      this.api.createLearnerMovement(payload).subscribe({
        next: (transfer) => {
          this.transfers = [transfer, ...this.transfers];
          this.closeModal();
          this.filterData();
          this.isSaving = false;
          this.showToast('Transfer created', 'New transfer record was saved.', 'success');
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Save failed', 'Unable to create transfer record.', 'error');
        }
      });
      return;
    }

    if (!this.selectedTransfer) return;
    const status = this.modalType === 'lrn' ? 'LRN Requested' : 'Evaluated';
    this.isSaving = true;
    this.api.updateLearnerMovement(this.selectedTransfer.id, { status }).subscribe({
      next: (updated) => {
        this.transfers = this.transfers.map(t => t.id === updated.id ? updated : t);
        this.closeModal();
        this.filterData();
        this.isSaving = false;
        this.showToast(status, 'Transfer workflow status was updated.', 'success');
      },
      error: () => {
        this.isSaving = false;
        this.showToast('Update failed', 'Unable to update transfer status.', 'error');
      }
    });
  }

  private showToast(title: string, message: string, type: 'success' | 'error') {
    this.toast = { show: true, title, message, type };
    setTimeout(() => {
      this.toast = { ...this.toast, show: false };
    }, 3200);
  }
}
