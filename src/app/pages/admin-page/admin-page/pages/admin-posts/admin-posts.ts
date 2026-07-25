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
  @Output() adminEditPost = new EventEmitter<string>();

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

  async ngOnInit(): Promise<void> {
    await this.loadPosts();
  }

async loadPosts(): Promise<void> {
  this.isLoading = true;
  this.errorMessage = '';
  this.cdr.detectChanges();

  try {
    const response: any = await firstValueFrom(
      this.apiService.get('/posts/admin/all')
    );

    const data = response?.data || [];

    this.posts = data.map((row: any) => ({
      id: String(row._id),

      userId:
        row.sellerId?.fullName ||
        row.sellerId?.username ||
        row.sellerId?._id ||
        '-',

      title: row.title || 'Untitled Post',

      price: Number(row.price || 0),

      category:
        row.categoryId?.categoryName ||
        '-',

      subcategory:
        row.subcategoryId?.subcategoryName ||
        '-',

      type:
        row.listingType ||
        '-',

      adType:
        row.priceType ||
        '-',

      status:
        row.status ||
        'pending',

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

  } catch (error: any) {
    console.error('Posts page error:', error);

    this.errorMessage =
      error?.error?.message ||
      'Something went wrong while loading posts.';

    this.posts = [];
  } finally {
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}
get filteredPosts(): AdminPostItem[] {
  const q = this.searchQuery.trim().toLowerCase();

  return this.posts.filter((post) => {

    const matchesSearch =
      !q ||
      String(post.id).includes(q) ||
      post.title.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q) ||
      post.subcategory.toLowerCase().includes(q) ||
      post.type.toLowerCase().includes(q) ||
      post.adType.toLowerCase().includes(q) ||
      post.status.toLowerCase().includes(q) ||
      String(post.userId).toLowerCase().includes(q);

    const matchesType =
      this.selectedPostType === 'all' ||
      post.type.toLowerCase() === this.selectedPostType;

    return matchesSearch && matchesType;

  });
}
onPostTypeChange(): void {
  this.currentPage = 1;
}
  get totalPosts(): number {
    return this.posts.length;
  }

  get activePosts(): number {
    return this.posts.filter((p) => p.isActive).length;
  }

  get featuredPosts(): number {
    return this.posts.filter((p) => p.isFeatured).length;
  }

  get inactivePosts(): number {
    return this.posts.filter((p) => !p.isActive).length;
  }

async togglePostStatus(post: AdminPostItem): Promise<void> {

  const previousValue = post.isActive;

  post.isActive = !post.isActive;

  this.cdr.detectChanges();

  try {

    await firstValueFrom(

      this.apiService.patch(
        `/posts/admin/${post.id}/status`,
        {
          isActive: post.isActive
        }
      )

    );

  } catch (error) {

    console.error(error);

    post.isActive = previousValue;

    this.errorMessage =
      'Failed to update post status.';

  } finally {

    this.cdr.detectChanges();

  }

}

async toggleFeatured(post: AdminPostItem): Promise<void> {

  const previousValue = post.isFeatured;

  post.isFeatured = !post.isFeatured;

  this.cdr.detectChanges();

  try {

    await firstValueFrom(
      this.apiService.patch(
        `/posts/admin/${post.id}/featured`,
        {
          isFeatured: post.isFeatured
        }
      )
    );

  } catch (error) {

    console.error(error);

    post.isFeatured = previousValue;

    this.errorMessage =
      'Failed to update featured status.';

  } finally {

    this.cdr.detectChanges();

  }

}
async deletePost(post: AdminPostItem): Promise<void> {
  const confirmed = window.confirm(
    `Delete post "${post.title}"?`
  );

  if (!confirmed) return;

  const previousPosts = [...this.posts];

  this.posts = this.posts.filter(
    (item) => item.id !== post.id
  );

  this.cdr.detectChanges();

  try {
    await firstValueFrom(
      this.apiService.delete(
        `/posts/admin/${post.id}`
      )
    );

  } catch (error) {
    console.error('Delete post error:', error);

    this.posts = previousPosts;

    this.errorMessage =
      'Failed to delete post.';

  } finally {
    this.cdr.detectChanges();
  }
}
  getStatusLabel(post: AdminPostItem): string {
    return post.isActive ? 'Active' : 'Inactive';
  }

  getStatusClass(post: AdminPostItem): string {
    return post.isActive ? 'status-active' : 'status-inactive';
  }

trackByPost(index: number, post: AdminPostItem): string {
  return post.id;
}

editPost(post: AdminPostItem): void {
  this.adminEditPost.emit(post.id);
}

get totalPages(): number {
  return Math.ceil(this.filteredPosts.length / this.itemsPerPage) || 1;
}

get paginatedPosts(): AdminPostItem[] {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  return this.filteredPosts.slice(start, start + this.itemsPerPage);
}

goToPage(page: number): void {
  if (page < 1 || page > this.totalPages) return;
  this.currentPage = page;
}

private formatDate(value: string | null | undefined): string {
  if (!value) return '-';

  const date = new Date(value);

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
}
