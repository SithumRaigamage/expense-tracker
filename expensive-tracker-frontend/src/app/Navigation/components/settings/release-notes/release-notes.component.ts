import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faRocket,
  faBug,
  faGaugeHigh,
  faSearch,
  faPlus,
  faSave,
  faTrash,
  faPencilAlt
} from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReleaseNote, ReleaseNoteService } from '../../../../services/release-note.service';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DialogService } from '../../../../shared/services/dialog.service';

@Component({
  selector: 'app-release-notes',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './release-notes.component.html'
})
export class ReleaseNotesComponent implements OnInit {
  private releaseNoteService = inject(ReleaseNoteService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogs = inject(DialogService);

  searchTerm = '';
  rocketIcon = faRocket;
  bugIcon = faBug;
  speedIcon = faGaugeHigh;
  searchIcon = faSearch;
  plusIcon = faPlus;
  saveIcon = faSave;
  trashIcon = faTrash;
  editIcon = faPencilAlt;

  releases: ReleaseNote[] = [];
  isLoading = false;
  error = '';
  isAdmin = false; // This would be set based on user role in a real app
  showForm = false;
  releaseForm: FormGroup;
  editMode = false;
  currentReleaseId: string | null = null;

  constructor() {
    this.releaseForm = this.fb.group({
      version: ['', [Validators.required, Validators.pattern(/^\d+\.\d+\.\d+(-\w+)?$/)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      features: [''],
      bugfixes: [''],
      improvements: [''],
      isPublished: [true]
    });
  }

  ngOnInit(): void {
    this.loadReleaseNotes();
    this.checkUserRole();
  }

  checkUserRole(): void {
    // Set isAdmin to true if user has admin role
    this.isAdmin = this.authService.isAdmin();
  }

  loadReleaseNotes(): void {
    this.isLoading = true;
    this.error = '';

    this.releaseNoteService.getReleaseNotes().subscribe({
      next: (data) => {
        this.releases = data.map(note => ({
          ...note,
          isExpanded: data.indexOf(note) === 0 // Expand the first release by default
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load release notes. Please try again later.';
        console.error('Error loading release notes:', err);
        this.isLoading = false;
      }
    });
  }

  toggleRelease(release: ReleaseNote): void {
    release.isExpanded = !release.isExpanded;
  }

  get filteredReleases(): ReleaseNote[] {
    return this.releases.filter(release =>
      release.version.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      release.features.some(feature =>
        feature.toLowerCase().includes(this.searchTerm.toLowerCase())
      ) ||
      release.bugfixes.some(bug =>
        bug.toLowerCase().includes(this.searchTerm.toLowerCase())
      ) ||
      release.improvements.some(improvement =>
        improvement.toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.releaseForm.reset({
      version: '',
      date: new Date().toISOString().split('T')[0],
      features: '',
      bugfixes: '',
      improvements: '',
      isPublished: true
    });
    this.editMode = false;
    this.currentReleaseId = null;
  }

  editReleaseNote(release: ReleaseNote): void {
    this.editMode = true;
    this.currentReleaseId = release._id || null;
    this.showForm = true;

    this.releaseForm.setValue({
      version: release.version,
      date: new Date(release.date).toISOString().split('T')[0],
      features: release.features.join('\n'),
      bugfixes: release.bugfixes.join('\n'),
      improvements: release.improvements.join('\n'),
      isPublished: release.isPublished !== undefined ? release.isPublished : true
    });
  }

  deleteReleaseNote(id: string): void {
    if (!id) {
      return;
    }

    this.dialogs.confirmDelete('release note').subscribe(confirmed => {
      if (confirmed) {
        this.performDelete(id);
      }
    });
  }

  private performDelete(id: string): void {
    this.isLoading = true;
    this.error = ''; // Clear any previous errors

    this.releaseNoteService.deleteReleaseNote(id).subscribe({
      next: () => {
        this.releases = this.releases.filter(r => r._id !== id);
        this.isLoading = false;
        this.notifications.success('Release note deleted.');
      },
      error: (err) => {
        if (err.status === 403) {
          this.error = 'You do not have permission to delete release notes. Admin privileges required.';
        } else {
          this.error = 'Failed to delete release note: ' + (err.error?.message || err.message || 'Unknown error');
        }
        this.notifications.error(this.error);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.releaseForm.invalid) {
      return;
    }

    const formValue = this.releaseForm.value;
    const releaseNote: ReleaseNote = {
      version: formValue.version,
      date: formValue.date,
      features: this.splitTextareaIntoArray(formValue.features),
      bugfixes: this.splitTextareaIntoArray(formValue.bugfixes),
      improvements: this.splitTextareaIntoArray(formValue.improvements),
      isPublished: formValue.isPublished
    };

    this.isLoading = true;
    this.error = ''; // Clear any previous errors

    if (this.editMode && this.currentReleaseId) {
      // Update existing release note
      this.releaseNoteService.updateReleaseNote(this.currentReleaseId, releaseNote).subscribe({
        next: (updated) => {
          const index = this.releases.findIndex(r => r._id === this.currentReleaseId);
          if (index !== -1) {
            this.releases[index] = { ...updated, isExpanded: this.releases[index].isExpanded };
          }
          this.isLoading = false;
          this.toggleForm();
        },
        error: (err) => {
          if (err.status === 403) {
            this.error = 'You do not have permission to update release notes. Admin privileges required.';
          } else {
            this.error = 'Failed to update release note: ' + (err.error?.message || err.message || 'Unknown error');
          }
          console.error('Error updating release note:', err);
          this.isLoading = false;
        }
      });
    } else {
      // Create new release note
      this.releaseNoteService.createReleaseNote(releaseNote).subscribe({
        next: (created) => {
          this.releases.unshift({ ...created, isExpanded: true });
          this.isLoading = false;
          this.toggleForm();
        },
        error: (err) => {
          if (err.status === 403) {
            this.error = 'You do not have permission to create release notes. Admin privileges required.';
          } else {
            this.error = 'Failed to create release note: ' + (err.error?.message || err.message || 'Unknown error');
          }
          console.error('Error creating release note:', err);
          this.isLoading = false;
        }
      });
    }
  }

  private splitTextareaIntoArray(text: string): string[] {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim() !== '');
  }
}
