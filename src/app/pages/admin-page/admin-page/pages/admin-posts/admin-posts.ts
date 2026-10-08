
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ChangeDetectorRef,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';

import { ApiService } from '../../../../../services/api.service';
import { firstValueFrom } from 'rxjs';

interface AdminPostItem {
  id: string;
  userId: string;
  title: string;
  price: number;
  category: string;
  subcategory: string;
  type: string;
  adType: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  createdOn: string;
  imageUrl: string;
  rawCreatedOn: string;
}

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-posts.html',
  styleUrls: ['./admin-posts.css'],
})
export class AdminPosts implements OnInit {

  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  @Input() searchQuery = '';

  selectedPostType = 'all';

  @Output()
  adminEditPost = new EventEmitter<string>();

  isLoading = true;
  errorMessage = '';

  posts: AdminPostItem[] = [];

  currentPage = 1;
  itemsPerPage = 5;

  editingPost: AdminPostItem | null = null;

  editForm: any = {
    title: '',
    price: 0,
    category: '',
    subcategory: '',
    type: '',
    adType: '',
    isActive: true,
    isFeatured: false,
    imageUrl: ''
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  async ngOnInit(): Promise<void> {
    await this.loadPosts();
  }

  // ==========================================
  // LOAD ALL ADMIN POSTS
  // ==========================================

  async loadPosts(): Promise<void> {

    this.isLoading = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    try {

      const response: any = await firstValueFrom(
        this.apiService.getAdmin('/posts/admin/all')
      );

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      this.posts = data.map((row: any) => ({

        id: String(row._id),

        userId:
          row.sellerId?.fullName ||
          row.sellerId?.username ||
          row.sellerId?._id ||
          '-',

        title:
          row.title || 'Untitled Post',

        price:
          Number(row.price || 0),

        category:
          row.categoryId?.categoryName || '-',

        subcategory:
          row.subcategoryId?.subcategoryName || '-',

        type:
          row.listingType || '-',

        adType:
          row.priceType || '-',

        status:
          row.status || 'pending',

        isActive:
          row.status === 'approved',

        isFeatured:
          row.isFeatured === true,

        createdOn:
          this.formatDate(row.createdAt),

        imageUrl:
          row.images?.[0] || '',

        rawCreatedOn:
          row.createdAt || '',

      }));

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

    } catch (error: any) {

      console.error(
        'ADMIN POSTS LOAD ERROR:',
        error
      );

      this.errorMessage =
        error?.error?.message ||
        `Failed to load posts. HTTP ${error?.status || 'unknown'}`;

      this.posts = [];

    } finally {

      this.isLoading = false;
      this.cdr.detectChanges();

    }
  }

  // ==========================================
  // SEARCH + FILTER POSTS
  // ==========================================

  get filteredPosts(): AdminPostItem[] {

    const q = this.searchQuery.trim().toLowerCase();

    return this.posts.filter((post) => {

      const matchesSearch =
        !q ||
        String(post.id).toLowerCase().includes(q) ||
        post.title.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.subcategory.toLowerCase().includes(q) ||
        post.type.toLowerCase().includes(q) ||
        post.adType.toLowerCase().includes(q) ||
        post.status.toLowerCase().includes(q) ||
        String(post.userId).toLowerCase().includes(q);

      const matchesType =
        this.selectedPostType === 'all' ||
        post.type.toLowerCase() ===
          this.selectedPostType.toLowerCase();

      return matchesSearch && matchesType;

    });
  }

  onPostTypeChange(): void {
    this.currentPage = 1;
  }

  // ==========================================
  // POST STATISTICS
  // ==========================================

  get totalPosts(): number {
    return this.posts.length;
  }

  get activePosts(): number {
    return this.posts.filter(
      (post) => post.isActive
    ).length;
  }

  get featuredPosts(): number {
    return this.posts.filter(
      (post) => post.isFeatured
    ).length;
  }

  get inactivePosts(): number {
    return this.posts.filter(
      (post) => !post.isActive
    ).length;
  }

  // ==========================================
  // ENABLE / DISABLE POST
  // ==========================================

  async togglePostStatus(
    post: AdminPostItem
  ): Promise<void> {

    const previousValue = post.isActive;
    const previousStatus = post.status;

    const nextValue = !previousValue;

    this.errorMessage = '';

    post.isActive = nextValue;
    post.status = nextValue
      ? 'approved'
      : 'rejected';

    this.cdr.detectChanges();

    try {

      const response: any = await firstValueFrom(
        this.apiService.patchAdmin(
          `/posts/admin/${post.id}/status`,
          {
            isActive: nextValue
          }
        )
      );

      if (response?.success === false) {
        throw new Error(
          response.message ||
          'Failed to update post status'
        );
      }

      if (response?.data?.status) {
        post.status = response.data.status;
        post.isActive =
          response.data.status === 'approved';
      }

      console.log(
        'ADMIN POST STATUS UPDATED:',
        response
      );

    } catch (error: any) {

      console.error(
        'ADMIN POST STATUS ERROR:',
        error
      );

      post.isActive = previousValue;
      post.status = previousStatus;

      this.errorMessage =
        error?.error?.message ||
        error?.message ||
        `Failed to update post status. HTTP ${error?.status || 'unknown'}`;

    } finally {

      this.cdr.detectChanges();

    }
  }

  // ==========================================
  // FEATURED POST ON / OFF
  // ==========================================

  async toggleFeatured(
    post: AdminPostItem
  ): Promise<void> {

    const previousValue = post.isFeatured;
    const nextValue = !previousValue;

    this.errorMessage = '';

    post.isFeatured = nextValue;

    this.cdr.detectChanges();

    try {

      const response: any = await firstValueFrom(
        this.apiService.patchAdmin(
          `/posts/admin/${post.id}/featured`,
          {
            isFeatured: nextValue
          }
        )
      );

      if (response?.success === false) {
        throw new Error(
          response.message ||
          'Failed to update featured status'
        );
      }

      if (response?.data) {
        post.isFeatured =
          response.data.isFeatured === true;
      }

      console.log(
        'ADMIN FEATURED STATUS UPDATED:',
        response
      );

    } catch (error: any) {

      console.error(
        'ADMIN FEATURED STATUS ERROR:',
        error
      );

      post.isFeatured = previousValue;

      this.errorMessage =
        error?.error?.message ||
        error?.message ||
        `Failed to update featured status. HTTP ${error?.status || 'unknown'}`;

    } finally {

      this.cdr.detectChanges();

    }
  }

  // ==========================================
  // DELETE POST
  // ==========================================

  async deletePost(
    post: AdminPostItem
  ): Promise<void> {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${post.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';

    try {

      const response: any = await firstValueFrom(
        this.apiService.deleteAdmin(
          `/posts/admin/${post.id}`
        )
      );

      if (response?.success === false) {
        throw new Error(
          response.message ||
          'Post deletion failed'
        );
      }

      this.posts = this.posts.filter(
        (item) => item.id !== post.id
      );

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

      console.log(
        'ADMIN POST DELETED:',
        post.id
      );

    } catch (error: any) {

      console.error(
        'ADMIN DELETE POST ERROR:',
        error
      );

      this.errorMessage =
        error?.error?.message ||
        error?.message ||
        `Failed to delete post. HTTP ${error?.status || 'unknown'}`;

    } finally {

      this.cdr.detectChanges();

    }
  }

  // ==========================================
  // STATUS LABEL
  // ==========================================

  getStatusLabel(
    post: AdminPostItem
  ): string {

    return post.isActive
      ? 'Active'
      : 'Inactive';
  }

  getStatusClass(
    post: AdminPostItem
  ): string {

    return post.isActive
      ? 'status-active'
      : 'status-inactive';
  }

  // ==========================================
  // TRACK POSTS
  // ==========================================

  trackByPost(
    index: number,
    post: AdminPostItem
  ): string {

    return post.id;
  }

  // ==========================================
  // EDIT POST
  // ==========================================

  editPost(
    post: AdminPostItem
  ): void {

    this.adminEditPost.emit(post.id);
  }

  // ==========================================
  // PAGINATION
  // ==========================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredPosts.length /
      this.itemsPerPage
    ) || 1;
  }

  get paginatedPosts(): AdminPostItem[] {

    const start =
      (this.currentPage - 1) *
      this.itemsPerPage;

    return this.filteredPosts.slice(
      start,
      start + this.itemsPerPage
    );
  }

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) {
      return;
    }

    this.currentPage = page;
  }

  // ==========================================
  // FORMAT DATE
  // ==========================================

  private formatDate(
    value: string | null | undefined
  ): string {

    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }

}
