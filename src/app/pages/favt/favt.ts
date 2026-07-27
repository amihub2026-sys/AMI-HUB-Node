import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SnackbarService } from '../../services/snackbar.service';
interface FavoriteItem {
  favorite_id: string;
  product_id: string | null;
  name: string;
  price: number;
  location: string;
  image: string;
}

@Component({
  selector: 'app-favt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favt.html',
  styleUrls: ['./favt.css']
})
export class Favt implements OnInit {

  favoriteItems: FavoriteItem[] = [];
  loading = false;
  errorMessage = '';
constructor(
  private router: Router,
  private cdr: ChangeDetectorRef,
  private api: ApiService,
  private snackbar: SnackbarService
) {}

ngOnInit(): void {
  this.loadFavoriteItems();
}
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

private showAlert(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  this.snackbar.show(message, type);
}


loadFavoriteItems(): void {
  this.loading = true;
  this.errorMessage = '';
  this.favoriteItems = [];
  this.cdr.detectChanges();

  this.api.get<any>('/favorites').subscribe({
    next: (res: any) => {
      const data = res?.data || [];

      this.favoriteItems = data
        .filter((item: any) => item?.postId)
        .map((item: any) => {
          const post = item.postId;

          return {
            favorite_id: String(item._id || ''),
            product_id: post?._id ? String(post._id) : null,
            name: post?.title || '',
            price: Number(post?.price || 0),
            location:
              post?.location?.city ||
              post?.location?.address ||
              'Location not available',
            image:
              Array.isArray(post?.images) && post.images.length > 0
                ? post.images[0]
                : 'assets/no-image.png'
          };
        });

      this.loading = false;
      this.cdr.detectChanges();
    },

    error: (error: any) => {
      console.error('Error loading favorites:', error);

      const msg =
        error?.error?.message ||
        error?.message ||
        'Failed to load favorites.';

      this.errorMessage = msg;
      this.favoriteItems = [];
      this.loading = false;

      this.showAlert(msg, 'error');
      this.cdr.detectChanges();
    }
  });
}

  viewDetails(item: FavoriteItem): void {
    if (item.product_id) {
      this.router.navigate(['/post-view', item.product_id]);
      return;
    }

    this.showAlert('Product id not available');
  }

removeItem(item: FavoriteItem): void {
  if (!item.product_id) {
    this.showAlert('Product id not available', 'error');
    return;
  }

  this.api.post<any>(
    `/favorites/${item.product_id}`,
    {}
  ).subscribe({
    next: (res: any) => {
      this.favoriteItems = this.favoriteItems.filter(
        favorite => favorite.favorite_id !== item.favorite_id
      );

      this.cdr.detectChanges();

      this.showAlert(
        res?.message || 'Favorite removed successfully',
        'success'
      );
    },

    error: (error: any) => {
      console.error('Error removing favorite item:', error);

      const message =
        error?.error?.message ||
        error?.message ||
        'Failed to remove favorite item';

      this.showAlert(message, 'error');
    }
  });
}
}