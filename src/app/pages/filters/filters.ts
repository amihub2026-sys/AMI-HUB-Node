import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  Input
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
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
export class Filters implements OnInit {

  @Output() filtersApplied = new EventEmitter<FilterState>();
  @Output() filtersReset = new EventEmitter<void>();

  openSection: string | null = null;

@Input()
categoryType: 'product' | 'service' | 'all' = 'product';

categories: any[] = [];

private readonly categoriesApiUrl =
  `${environment.apiUrl}/categories`;
  filters: FilterState = {
    searchText: '',
    selectedCategoryId: '',
    locationText: '',
    selectedRadiusKm: 10,
    minPrice: null,
    maxPrice: null,
    sortBy: 'Newest'
  };
constructor(private http: HttpClient) {}

ngOnInit(): void {
  this.loadCategories();
}

private loadCategories(): void {
  this.http.get<any>(this.categoriesApiUrl).subscribe({
    next: (response) => {
      console.log('Categories API Response:', response);
console.log('Categories API URL:', this.categoriesApiUrl);
      const rawCategories =
        response?.data?.categories ||
        response?.categories ||
        response?.data ||
        [];
console.log('Raw category array:', rawCategories);
console.log('First category:', rawCategories?.[0]);
      this.categories = Array.isArray(rawCategories)
        ? rawCategories
            .filter((category: any) => {
              const isActive =
                category?.isActive ??
                category?.isactive ??
                true;

const type = String(
  category?.categoryType ||
  category?.category_type ||
  ''
)
  .trim()
  .toLowerCase();

const availableIn = Array.isArray(category?.availableIn)
  ? category.availableIn.map((value: any) =>
      String(value).trim().toLowerCase()
    )
  : [];

return (
  isActive !== false &&
  (
    this.categoryType === 'all' ||
    type === this.categoryType ||
    availableIn.includes(this.categoryType)
  )
);
            })
            .map((category: any) => ({
              id: String(
                category?._id ||
                category?.categoryid ||
                ''
              ),

              name:
                category?.categoryName ||
                category?.categoryname ||
                'Unnamed Category'
            }))
        : [];
    },

    error: (error) => {
      console.error(
        'Error loading filter categories:',
        error
      );

      this.categories = [];
    }
  });
}
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
      sortBy: 'Newest'
    };

    this.openSection = null;

    this.filtersReset.emit();
    this.filtersApplied.emit({
      ...this.filters
    });
  }
}