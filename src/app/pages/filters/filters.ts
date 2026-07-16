import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface FilterState {
  searchText: string;
  selectedCategoryId: string;
  locationText: string;
  selectedRadiusKm: number;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: string;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.css'
})
export class Filters {

  @Output() filtersApplied = new EventEmitter<FilterState>();
  @Output() filtersReset = new EventEmitter<void>();

  openSection: string | null = null;

  categories = [
    { id: 'electronics', name: 'Electronics' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'vehicles', name: 'Vehicles' }
  ];

  filters: FilterState = {
    searchText: '',
    selectedCategoryId: '',
    locationText: '',
    selectedRadiusKm: 10,
    minPrice: null,
    maxPrice: null,
    sortBy: 'newest'
  };

  toggleSection(section: string): void {
    this.openSection =
      this.openSection === section ? null : section;
  }

  isSectionOpen(section: string): boolean {
    return this.openSection === section;
  }

  applyFilters(): void {
    this.filtersApplied.emit({
      ...this.filters
    });
  }

  resetFilters(): void {
    this.filters = {
      searchText: '',
      selectedCategoryId: '',
      locationText: '',
      selectedRadiusKm: 10,
      minPrice: null,
      maxPrice: null,
      sortBy: 'newest'
    };

    this.openSection = null;

    this.filtersReset.emit();
    this.filtersApplied.emit({
      ...this.filters
    });
  }
}