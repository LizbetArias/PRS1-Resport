import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Issue {
  id?: number;
  name: string;
  workshopId: number;
  scheduledTime: string;
  state: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  isModalOpen = false;
  isLoading: boolean = false;
  isActive: boolean = true;
  isEditMode: boolean = false;

  // Datos estatico
  filteredIssues: Issue[] = [
    { id: 1, name: 'Taller Mecánico Juan', workshopId: 101, scheduledTime: '2024-02-02T10:00', state: 'A' },
    { id: 2, name: 'Taller Pedro', workshopId: 102, scheduledTime: '2024-02-02T11:00', state: 'A' },
    { id: 3, name: 'Taller María', workshopId: 103, scheduledTime: '2024-02-02T12:00', state: 'I' }
  ];
  
  issueForm: Issue = {
    id: 0,
    name: '',
    workshopId: 0,
    scheduledTime: '',
    state: 'A'
  };

  toggleStatus(): void {
    this.filteredIssues = this.filteredIssues.filter(issue => 
      issue.state === (this.isActive ? 'A' : 'I')
    );
  }

  openModal(): void {
    this.isEditMode = false;
    this.issueForm = { id: 0, name: '', workshopId: 0, scheduledTime: '', state: 'A'};
    this.isModalOpen = true;
  }

  editSupplierDetails(issue: Issue): void {
    this.isEditMode = true;
    this.issueForm = { ...issue };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  addIssue(): void {
    const newIssue = { ...this.issueForm, id: this.filteredIssues.length + 1 };
    this.filteredIssues.push(newIssue);
    this.closeModal();
  }

  updateSupplier(): void {
    const index = this.filteredIssues.findIndex(i => i.id === this.issueForm.id);
    if (index !== -1) {
      this.filteredIssues[index] = { ...this.issueForm };
    }
    this.closeModal();
  }

  activateIssue(id: number | undefined): void {
    if (id) {
      const issue = this.filteredIssues.find(i => i.id === id);
      if (issue) issue.state = 'A';
    }
  }

  inactivateIssue(id: number | undefined): void {
    if (id) {
      const issue = this.filteredIssues.find(i => i.id === id);
      if (issue) issue.state = 'I';
    }
  }
}