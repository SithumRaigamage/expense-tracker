import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'quiz';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  duration: number;
  dateAdded: Date;
  progress?: number;
  rating?: number;
  bookmarked?: boolean;
  completed?: boolean;
}

// Add this after the EducationalContent interface
type SortableField = keyof Pick<EducationalContent, 'title' | 'dateAdded' | 'duration' | 'difficulty'>;

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './education.component.html',
})
export class EducationComponent implements OnInit {
  // Content Data
  contents: EducationalContent[] = [];
  filteredContents: EducationalContent[] = [];

  // Filters
  searchQuery = '';
  selectedDifficulty = 'all';
  selectedType = 'all';
  selectedCategory = 'all';

  // Sorting
  sortField: SortableField = 'dateAdded';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 9;

  // Filter options
  difficulties = ['beginner', 'intermediate', 'advanced'];
  contentTypes = ['article', 'video', 'quiz'];
  categories = ['budgeting', 'investing', 'savings', 'taxes'];

  ngOnInit() {
    // Simulate loading initial data
    this.loadDummyData();
    this.applyFilters();
  }

  loadDummyData() {
    this.contents = [
      {
        id: '1',
        title: 'Budgeting Basics',
        description: 'Learn the fundamentals of creating a budget',
        type: 'article',
        difficulty: 'beginner',
        category: 'budgeting',
        duration: 15,
        dateAdded: new Date(),
        rating: 4.5,
        progress: 0
      },
      // Add more dummy content...
    ];
  }

  applyFilters() {
    this.filteredContents = this.contents.filter(content => {
      const matchesSearch = content.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          content.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesDifficulty = this.selectedDifficulty === 'all' ||
                               content.difficulty === this.selectedDifficulty;

      const matchesType = this.selectedType === 'all' ||
                         content.type === this.selectedType;

      const matchesCategory = this.selectedCategory === 'all' ||
                             content.category === this.selectedCategory;

      return matchesSearch && matchesDifficulty && matchesType && matchesCategory;
    });

    // Apply sorting with type safety
    this.filteredContents.sort((a, b) => {
      const factor = this.sortDirection === 'asc' ? 1 : -1;

      // Handle different types of values
      if (this.sortField === 'dateAdded') {
        return (a.dateAdded.getTime() - b.dateAdded.getTime()) * factor;
      }

      if (this.sortField === 'duration') {
        return (a.duration - b.duration) * factor;
      }

      if (this.sortField === 'title' || this.sortField === 'difficulty') {
        const aValue = a[this.sortField]?.toLowerCase() || '';
        const bValue = b[this.sortField]?.toLowerCase() || '';
        return aValue.localeCompare(bValue) * factor;
      }

      return 0;
    });
  }

  get paginatedContent() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredContents.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredContents.length / this.itemsPerPage);
  }

  toggleBookmark(content: EducationalContent) {
    content.bookmarked = !content.bookmarked;
  }

  markAsCompleted(content: EducationalContent) {
    content.completed = true;
    content.progress = 100;
  }

  updateRating(content: EducationalContent, rating: number): void {
    content.rating = rating;
    // Optionally, you can trigger save/update to backend here
    this.applyFilters(); // If you want to re-sort based on rating
  }
}
