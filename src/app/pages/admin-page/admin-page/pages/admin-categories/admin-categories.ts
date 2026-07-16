import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';

interface AdminCategoryItem {
  categoryid: string;
  categoryname: string;
  slug: string;
  iconurl: string;
  bannerurl: string;
  sortorder: number;
  isactive: boolean;
  createdon: string;
  rawcreatedon: string;
  category_type: string;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.html',
  styleUrls: ['./admin-categories.css'],
})
export class AdminCategoriesComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);

  currentPage = 1;
  itemsPerPage = 5;
  @Input() searchQuery = '';

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  categories: AdminCategoryItem[] = [];
  showForm = false;
  editingCategoryId: string | null = null;

  form = {
    categoryname: '',
    slug: '',
    iconurl: '',
    bannerurl: '',
    sortorder: 1,
    isactive: true,
    category_type: 'product',
  };

  async ngOnInit(): Promise<void> {
    await this.loadCategories();
  }

  async loadCategories(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.get('/categories').subscribe({
      next: (res: any) => {
        this.categories = (res.data || []).map((row: any) => ({
          categoryid: row._id,
          categoryname: row.categoryName || '',
          slug: row.slug || '',
          iconurl: row.icon || '',
          bannerurl: row.image || '',
          sortorder: row.sortOrder || 0,
          isactive: row.isActive,
          createdon: this.formatDate(row.createdAt),
          rawcreatedon: row.createdAt,
          category_type: row.type || '-',
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load categories';
        this.categories = [];
        this.isLoading = false;
      },
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.itemsPerPage) || 1;
  }

  get paginatedCategories(): AdminCategoryItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCategories.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  get filteredCategories(): AdminCategoryItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.categories;

    return this.categories.filter(
      (item) =>
        String(item.categoryid).includes(q) ||
        item.categoryname.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.category_type.toLowerCase().includes(q) ||
        String(item.sortorder).includes(q) ||
        (item.isactive ? 'active' : 'inactive').includes(q)
    );
  }

  get totalCategories(): number {
    return this.categories.length;
  }
  get activeCategories(): number {
    return this.categories.filter((c) => c.isactive).length;
  }
  get inactiveCategories(): number {
    return this.categories.filter((c) => !c.isactive).length;
  }
  get productCategories(): number {
    return this.categories.filter((c) => c.category_type === 'product').length;
  }

  openCreateForm(): void {
    this.showForm = true;
    this.editingCategoryId = null;
    this.successMessage = '';
    this.errorMessage = '';

    this.form = {
      categoryname: '',
      slug: '',
      iconurl: '',
      bannerurl: '',
      sortorder: this.categories.length + 1,
      isactive: true,
      category_type: 'product',
    };

    this.cdr.detectChanges();
  }

  editCategory(item: AdminCategoryItem): void {
    this.showForm = true;
    this.editingCategoryId = item.categoryid;
    this.successMessage = '';
    this.errorMessage = '';

    this.form = {
      categoryname: item.categoryname,
      slug: item.slug,
      iconurl: item.iconurl,
      bannerurl: item.bannerurl,
      sortorder: item.sortorder,
      isactive: item.isactive,
      category_type: item.category_type || 'product',
    };

    this.cdr.detectChanges();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingCategoryId = null;
    this.cdr.detectChanges();
  }

  onCategoryNameChange(): void {
    if (!this.editingCategoryId) {
      this.form.slug = this.makeSlug(this.form.categoryname);
      this.cdr.detectChanges();
    }
  }

async onIconFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Directly generate a local URL for preview
  this.form.iconurl = URL.createObjectURL(file);
  this.cdr.detectChanges();
}
async onBannerFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Directly generate a local URL for preview
  this.form.bannerurl = URL.createObjectURL(file);
  this.cdr.detectChanges();
}
  async saveCategory(): Promise<void> {
    if (this.isSaving) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;
    this.cdr.detectChanges();

    if (!this.form.categoryname.trim()) {
      this.errorMessage = 'Category name is required.';
      this.isSaving = false;
      return;
    }

    if (!this.form.slug.trim()) {
      this.errorMessage = 'Slug is required.';
      this.isSaving = false;
      return;
    }

    if (!this.form.category_type.trim()) {
      this.errorMessage = 'Category type is required.';
      this.isSaving = false;
      return;
    }

    const payload = {
      categoryName: this.form.categoryname.trim(),
      type: this.form.category_type.trim(),
      icon: this.form.iconurl,
      image: this.form.bannerurl || '',
      sortOrder: Number(this.form.sortorder || 0),
      isActive: this.form.isactive,
    };

    try {
      if (this.editingCategoryId) {
        await this.api.put('/categories/' + this.editingCategoryId, payload).toPromise();
        this.successMessage = 'Category updated successfully';
      } else {
        await this.api.post('/categories', payload).toPromise();
        this.successMessage = 'Category created successfully';
      }
      this.cancelForm();
      await this.loadCategories();
    } catch (err) {
      console.error('Save category error:', err);
      this.errorMessage = 'Failed to save category.';
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async toggleCategoryStatus(item: AdminCategoryItem) {
    try {
      await this.api.put('/categories/' + item.categoryid, { isActive: !item.isactive }).toPromise();
      this.successMessage = 'Status updated';
      await this.loadCategories();
    } catch {
      this.errorMessage = 'Failed updating status';
    }
  }

  async deleteCategory(item: AdminCategoryItem) {
    const confirmed = window.confirm(`Do you want to deactivate ${item.categoryname}?`);
    if (!confirmed) return;

    try {
      await this.api.delete('/categories/' + item.categoryid).toPromise();
      this.successMessage = 'Category deactivated';
      await this.loadCategories();
    } catch {
      this.errorMessage = 'Delete failed';
    }
  }

  getStatusLabel(item: AdminCategoryItem): string {
    return item.isactive ? 'Active' : 'Inactive';
  }

  getStatusClass(item: AdminCategoryItem): string {
    return item.isactive ? 'status-active' : 'status-inactive';
  }

  trackByCategory(index: number, item: AdminCategoryItem): string {
    return item.categoryid;
  }

  private makeSlug(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}