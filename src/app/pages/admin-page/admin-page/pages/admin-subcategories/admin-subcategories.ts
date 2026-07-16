import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';

interface CategoryApiItem {
  _id: string;
  categoryName: string;
  slug?: string;
  type?: string;
  isActive?: boolean;
}

interface SubcategoryApiItem {
  _id: string;

  categoryId:
    | string
    | {
        _id: string;
        categoryName: string;
        slug?: string;
        type?: string;
      };

  subcategoryName: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminSubcategoryItem {
  subcategoryid: string;
  categoryid: string;
  categoryname: string;
  subcategoryname: string;
  slug: string;
  iconurl: string;
  image: string;
  description: string;
  sortorder: number;
  isactive: boolean;
  createdon: string | null;
  createdLabel: string;
}

interface CategoryOption {
  categoryid: string;
  categoryname: string;
  isactive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type SubcategoryStatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-admin-subcategories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-subcategories.html',
  styleUrls: ['./admin-subcategories.css']
})
export class AdminSubcategories implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  @Input() searchQuery = '';

  currentPage = 1;
  itemsPerPage = 5;

  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  subcategoryStatusFilter: SubcategoryStatusFilter = 'all';

  allSubcategories: AdminSubcategoryItem[] = [];
  categories: CategoryOption[] = [];

  showForm = false;
  editingSubcategoryId: string | null = null;

  form = {
    categoryid: null as string | null,
    subcategoryname: '',
    slug: '',
    iconurl: '',
    image: '',
    description: '',
    sortorder: 1,
    isactive: true
  };

  ngOnInit(): void {
    this.loadCategories();
    this.loadSubcategories();
  }

  // =====================================================
  // LOAD CATEGORIES FROM NODE API
  // GET /api/categories
  // =====================================================

  loadCategories(): void {
    this.api
      .get('/categories')
      .subscribe({
        next: (response: any) => {
          const rows: CategoryApiItem[] = Array.isArray(response)
            ? response
            : response?.data || [];

          this.categories = rows.map((category) => ({
            categoryid: category._id,
            categoryname: category.categoryName || '',
            isactive: category.isActive !== false
          }));

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error('Load categories error:', error);

          this.errorMessage =
            error?.error?.message || 'Failed to load categories.';

          this.categories = [];
          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // LOAD SUBCATEGORIES FROM NODE API
  // GET /api/subcategories
  // =====================================================

  loadSubcategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .get('/subcategories')
      .subscribe({
        next: (response: any) => {
          const rows = response?.data || [];

          this.allSubcategories = rows.map((row: SubcategoryApiItem) => {
            const populatedCategory =
              typeof row.categoryId === 'object'
                ? row.categoryId
                : null;

            return {
              subcategoryid: row._id,

              categoryid:
                populatedCategory?._id ||
                (typeof row.categoryId === 'string'
                  ? row.categoryId
                  : ''),

              categoryname:
                populatedCategory?.categoryName || '-',

              subcategoryname: row.subcategoryName || '',
              slug: row.slug || '',
              iconurl: row.icon || '',
              image: row.image || '',
              description: row.description || '',
              sortorder: Number(row.sortOrder || 0),
              isactive: row.isActive !== false,
              createdon: row.createdAt || null,
              createdLabel: this.formatDate(row.createdAt)
            };
          });

          if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error('Load subcategories error:', error);

          this.errorMessage =
            error?.error?.message ||
            'Failed to load subcategories.';

          this.allSubcategories = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // OPEN CREATE FORM
  // =====================================================

  openCreateForm(): void {
    this.showForm = true;
    this.editingSubcategoryId = null;

    this.errorMessage = '';
    this.successMessage = '';

    const firstActiveCategory =
      this.categories.find((category) => category.isactive) ||
      this.categories[0];

    this.form = {
      categoryid: firstActiveCategory?.categoryid || null,
      subcategoryname: '',
      slug: '',
      iconurl: '',
      image: '',
      description: '',
      sortorder: this.allSubcategories.length + 1,
      isactive: true
    };

    this.cdr.detectChanges();
  }

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  editSubcategory(subcategory: AdminSubcategoryItem): void {
    this.showForm = true;
    this.editingSubcategoryId = subcategory.subcategoryid;

    this.errorMessage = '';
    this.successMessage = '';

    this.form = {
      categoryid: subcategory.categoryid,
      subcategoryname: subcategory.subcategoryname,
      slug: subcategory.slug,
      iconurl: subcategory.iconurl,
      image: subcategory.image,
      description: subcategory.description,
      sortorder: subcategory.sortorder,
      isactive: subcategory.isactive
    };

    this.cdr.detectChanges();
  }

  // =====================================================
  // CANCEL FORM
  // =====================================================

  cancelForm(): void {
    this.showForm = false;
    this.editingSubcategoryId = null;

    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  // =====================================================
  // CREATE SLUG
  // =====================================================

  onSubcategoryNameChange(): void {
    this.form.slug = this.makeSlug(this.form.subcategoryname);
  }
onIconFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  this.form.iconurl = URL.createObjectURL(file);
  this.cdr.detectChanges();
}

onImageFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  this.form.image = URL.createObjectURL(file);
  this.cdr.detectChanges();
}
  // =====================================================
  // SAVE CREATE / UPDATE
  // =====================================================

  saveSubcategory(): void {
    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.form.categoryid) {
      this.errorMessage = 'Category is required.';
      return;
    }

    if (!this.form.subcategoryname.trim()) {
      this.errorMessage = 'Subcategory name is required.';
      return;
    }

    this.isSaving = true;

    const payload = {
      categoryId: this.form.categoryid,
      subcategoryName: this.form.subcategoryname.trim(),

      /*
       The backend automatically creates the slug from
       subcategoryName, so slug does not need to be sent.
      */

      icon: this.form.iconurl.trim(),
      image: this.form.image.trim(),
      description: this.form.description.trim(),
      sortOrder: Number(this.form.sortorder || 0),
      isActive: this.form.isactive
    };

    if (this.editingSubcategoryId) {
      this.updateSubcategory(
        this.editingSubcategoryId,
        payload
      );
    } else {
      this.createSubcategory(payload);
    }
  }

  // =====================================================
  // CREATE
  // POST /api/subcategories
  // =====================================================

  private createSubcategory(payload: any): void {
    this.api
      .post('/subcategories', payload)
      .subscribe({
        next: (response: any) => {
          this.successMessage =
            response?.message ||
            'Subcategory created successfully.';

          this.isSaving = false;
          this.showForm = false;
          this.editingSubcategoryId = null;

          this.loadSubcategories();
        },

        error: (error) => {
          console.error('Create subcategory error:', error);

          this.errorMessage =
            error?.error?.message ||
            'Failed to create subcategory.';

          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // UPDATE
  // PUT /api/subcategories/:id
  // =====================================================

  private updateSubcategory(
    id: string,
    payload: any
  ): void {
    this.api
      .put(`/subcategories/${id}`, payload)
      .subscribe({
        next: (response: any) => {
          this.successMessage =
            response?.message ||
            'Subcategory updated successfully.';

          this.isSaving = false;
          this.showForm = false;
          this.editingSubcategoryId = null;

          this.loadSubcategories();
        },

        error: (error) => {
          console.error('Update subcategory error:', error);

          this.errorMessage =
            error?.error?.message ||
            'Failed to update subcategory.';

          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // TOGGLE ACTIVE STATUS
  // =====================================================

  toggleSubcategoryStatus(
    subcategory: AdminSubcategoryItem
  ): void {
    const nextValue = !subcategory.isactive;

    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      isActive: nextValue
    };

    this.api
      .put(
        `/subcategories/${subcategory.subcategoryid}`,
        payload
      )
      .subscribe({
        next: () => {
          subcategory.isactive = nextValue;

          this.successMessage = nextValue
            ? 'Subcategory activated successfully.'
            : 'Subcategory deactivated successfully.';

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Toggle subcategory status error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to update subcategory status.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // DELETE
  // DELETE /api/subcategories/:id
  // =====================================================

  deleteSubcategory(
    subcategory: AdminSubcategoryItem
  ): void {
    const confirmed = window.confirm(
      `Do you want to delete subcategory "${subcategory.subcategoryname}"?`
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .delete(`/subcategories/${subcategory.subcategoryid}`)
      .subscribe({
        next: (response: any) => {
          this.successMessage =
            response?.message ||
            'Subcategory deleted successfully.';

          this.loadSubcategories();
        },

        error: (error) => {
          console.error('Delete subcategory error:', error);

          this.errorMessage =
            error?.error?.message ||
            'Failed to delete subcategory.';

          this.cdr.detectChanges();
        }
      });
  }

  // =====================================================
  // FILTER
  // =====================================================

  setSubcategoryStatusFilter(
    filter: SubcategoryStatusFilter
  ): void {
    this.subcategoryStatusFilter = filter;
    this.currentPage = 1;
  }

  get filteredSubcategories(): AdminSubcategoryItem[] {
    const query = this.searchQuery
      .trim()
      .toLowerCase();

    return this.allSubcategories.filter((subcategory) => {
      const matchesSearch =
        !query ||
        subcategory.subcategoryname
          .toLowerCase()
          .includes(query) ||
        subcategory.categoryname
          .toLowerCase()
          .includes(query) ||
        subcategory.slug
          .toLowerCase()
          .includes(query) ||
        String(subcategory.sortorder).includes(query) ||
        (subcategory.isactive
          ? 'active'
          : 'inactive'
        ).includes(query);

      const matchesStatus =
        this.subcategoryStatusFilter === 'all' ||
        (
          this.subcategoryStatusFilter === 'active' &&
          subcategory.isactive
        ) ||
        (
          this.subcategoryStatusFilter === 'inactive' &&
          !subcategory.isactive
        );

      return matchesSearch && matchesStatus;
    });
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  get totalPages(): number {
    return (
      Math.ceil(
        this.filteredSubcategories.length /
          this.itemsPerPage
      ) || 1
    );
  }

  get paginatedSubcategories(): AdminSubcategoryItem[] {
    const start =
      (this.currentPage - 1) *
      this.itemsPerPage;

    return this.filteredSubcategories.slice(
      start,
      start + this.itemsPerPage
    );
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  // =====================================================
  // COUNTS
  // =====================================================

  get totalSubcategoriesCount(): number {
    return this.allSubcategories.length;
  }

  get activeSubcategoriesCount(): number {
    return this.allSubcategories.filter(
      (item) => item.isactive
    ).length;
  }

  get inactiveSubcategoriesCount(): number {
    return this.allSubcategories.filter(
      (item) => !item.isactive
    ).length;
  }

  get totalCategoriesLinkedCount(): number {
    const categoryIds = new Set(
      this.allSubcategories.map(
        (item) => item.categoryid
      )
    );

    return categoryIds.size;
  }

  // =====================================================
  // TRACK BY
  // =====================================================

  trackBySubcategory(
    index: number,
    subcategory: AdminSubcategoryItem
  ): string {
    return subcategory.subcategoryid;
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private makeSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private formatDate(
    value: string | null | undefined
  ): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    );
  }
}