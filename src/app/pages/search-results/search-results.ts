import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnInit
} from '@angular/core';

import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../services/api.service';

interface CategoryItem {
  categoryid: string;
  categoryname: string;
  iconurl?: string;
  availableIn?: string[];
}

interface SubcategoryItem {
  subcategoryid: string;
  categoryid: string;
  subcategoryname: string;
  iconurl?: string;
}

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './search-results.html',
  styleUrls: ['./search-results.css']
})
export class SearchResults implements OnInit {

  @Input() results: any[] = [];
@Input()
type: 'all' | 'product' | 'service' | 'job' = 'all';
  searchText = '';
  locationText = '';
  selectedRadiusKm = 5;

  selectedType: 'all' | 'product' | 'service' | 'job' = 'all';

  selectedCategoryId: string | null = null;
  selectedSubcategoryId: string | null = null;

  minPrice: number | null = null;
  maxPrice: number | null = null;

  sortBy = 'Newest';

  showCategoryDropdown = false;
  showMobileFilters = false;
  showProfileMenu = false;

  isLoggedInUser = false;
  notificationCount = 0;
  chatCount = 0;

  isLoading = false;

  categories: CategoryItem[] = [];
  subcategories: SubcategoryItem[] = [];
  filteredResults: any[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.isLoggedInUser =
      !!localStorage.getItem('token');

    this.route.queryParamMap.subscribe(async (params) => {
      this.searchText =
        String(params.get('q') || '').trim();

      this.selectedCategoryId =
        params.get('categoryId') ||
        params.get('category') ||
        null;

      this.selectedSubcategoryId =
        params.get('subcategoryId') ||
        params.get('subcategory') ||
        null;

const incomingType =
  String(
    params.get('type') ||
    this.type ||
    'all'
  )
    .trim()
    .toLowerCase();

      this.selectedType =
        incomingType === 'products'
          ? 'product'
          : incomingType === 'services' ||
            incomingType === 'service-list'
          ? 'service'
          : incomingType === 'product' ||
            incomingType === 'service' ||
            incomingType === 'job'
          ? incomingType
          : 'all';

      await this.initialLoad();
    });
  }

  async initialLoad(): Promise<void> {
    this.isLoading = true;
    this.results = [];
    this.filteredResults = [];
    this.subcategories = [];
    this.cdr.detectChanges();

    try {
      await this.loadCategories();

      if (this.selectedCategoryId) {
        await this.loadSubcategories(
          this.selectedCategoryId
        );
      }

      await this.loadResults();
      this.applyFilters();

    } catch (error) {
      console.error(
        'Search results initial load error:',
        error
      );

      this.results = [];
      this.filteredResults = [];

    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const response: any =
        await firstValueFrom(
          this.api.get('/categories')
        );

      const allCategories =
        (response?.data || [])
          .filter(
            (item: any) =>
              item?.isActive === true
          )
          .map((item: any) => ({
            categoryid: String(
              item?._id ||
              item?.categoryid ||
              ''
            ),
            categoryname:
              item?.categoryName ||
              item?.categoryname ||
              '',
            iconurl:
              item?.icon ||
              item?.image ||
              item?.iconurl ||
              '',
            availableIn:
              Array.isArray(item?.availableIn)
                ? item.availableIn
                : []
          }));

      this.categories =
        this.selectedType === 'all'
          ? allCategories
          : allCategories.filter(
              (category: CategoryItem) =>
                category.availableIn?.includes(
                  this.selectedType
                )
            );

    } catch (error) {
      console.error(
        'Category loading error:',
        error
      );

      this.categories = [];
    }
  }

async loadSubcategories(
  categoryId: string
): Promise<void> {

  try {

    let endpoint = '';

    if (this.selectedType === 'all') {

      endpoint =
        `/subcategories/category/${encodeURIComponent(categoryId)}`;

    } else {

      endpoint =
        `/subcategories/category/${encodeURIComponent(categoryId)}?type=${this.selectedType}`;

    }

    const response: any =
      await firstValueFrom(
        this.api.get(endpoint)
      );

    const rawSubcategories =
      response?.data ||
      response?.subcategories ||
      [];

    this.subcategories =
      (Array.isArray(rawSubcategories)
        ? rawSubcategories
        : []
      ).map((item: any) => ({

        ...item,

        subcategoryid: String(
          item?._id ||
          item?.subcategoryid ||
          ''
        ),

        categoryid: String(
          item?.categoryId?._id ||
          item?.categoryId ||
          item?.categoryid ||
          ''
        ),

        subcategoryname:
          item?.subcategoryName ||
          item?.subcategoryname ||
          '',

        iconurl:
          item?.icon ||
          item?.image ||
          item?.iconurl ||
          ''

      }));

    console.log(
      'ALL PAGE SUBCATEGORIES:',
      this.subcategories
    );

  } catch (error) {

    console.error(
      'Subcategory loading error:',
      error
    );

    this.subcategories = [];
  }
}
  async loadResults(): Promise<void> {
    try {
      const params =
        new URLSearchParams();

      if (this.searchText) {
        params.set(
          'keyword',
          this.searchText
        );
      }

      if (this.selectedType !== 'all') {
        params.set(
          'listingType',
          this.selectedType
        );
      }

      if (this.selectedCategoryId) {
        params.set(
          'categoryId',
          this.selectedCategoryId
        );
      }

      if (this.selectedSubcategoryId) {
        params.set(
          'subcategoryId',
          this.selectedSubcategoryId
        );
      }

      const query =
        params.toString();

      const endpoint =
        query
          ? `/posts?${query}`
          : '/posts';

      const response: any =
        await firstValueFrom(
          this.api.get(endpoint)
        );

      const postList =
        Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.posts)
          ? response.posts
          : Array.isArray(response)
          ? response
          : [];

      this.results =
        postList.map(
          (item: any) =>
            this.mapPost(item)
        );

      this.filteredResults =
        [...this.results];

    } catch (error) {
      console.error(
        'Post loading error:',
        error
      );

      this.results = [];
      this.filteredResults = [];
    }
  }

  private mapPost(item: any): any {
    const category =
      typeof item?.categoryId === 'object'
        ? item.categoryId
        : null;

    const subcategory =
      typeof item?.subcategoryId === 'object'
        ? item.subcategoryId
        : null;

    return {
      ...item,

      postid: String(
        item?._id ||
        item?.postid ||
        ''
      ),

      categoryid: String(
        category?._id ||
        item?.categoryId ||
        item?.categoryid ||
        ''
      ),

      subcategoryid: String(
        subcategory?._id ||
        item?.subcategoryId ||
        item?.subcategoryid ||
        ''
      ),

      displayTitle:
        item?.title ||
        'Untitled',

      displayPrice:
        Number(item?.price || 0),

      displayCategory:
        category?.categoryName ||
        item?.category ||
        'Category',

      displayType:
        String(
          item?.listingType ||
          item?.adtype ||
          'product'
        ).toLowerCase(),

      mainImage:
        this.getMainImage(item),

      displayLocation:
        this.buildLocation(item),

      createdon:
        item?.createdAt ||
        item?.createdon ||
        null
    };
  }

  async selectCategory(
    id: string | null
  ): Promise<void> {
    this.showCategoryDropdown = false;

    await this.router.navigate(['/search'], {
      queryParams: {
        q: this.searchText || null,
        type: this.selectedType,
        categoryId: id,
        subcategoryId: null
      }
    });
  }

  async selectSubcategory(
    subcategory: SubcategoryItem
  ): Promise<void> {
    await this.router.navigate(['/search'], {
      queryParams: {
        q: this.searchText || null,
        type: this.selectedType,
        categoryId:
          this.selectedCategoryId,
        subcategoryId:
          subcategory.subcategoryid
      }
    });
  }

  async showAllSubcategoryPosts(): Promise<void> {
    await this.router.navigate(['/search'], {
      queryParams: {
        q: this.searchText || null,
        type: this.selectedType,
        categoryId:
          this.selectedCategoryId,
        subcategoryId: null
      }
    });
  }

  getSelectedCategory():
    CategoryItem | undefined {
    return this.categories.find(
      (category) =>
        String(category.categoryid) ===
        String(this.selectedCategoryId)
    );
  }

  applyFilters(): void {
    const search =
      this.searchText
        .trim()
        .toLowerCase();

    const location =
      this.locationText
        .trim()
        .toLowerCase();

    let data =
      [...this.results];

    if (search) {
      data = data.filter((item: any) => {
        const searchableText = [
          item?.displayTitle,
          item?.description,
          item?.displayCategory,
          item?.subcategoryId?.subcategoryName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(search);
      });
    }

    if (location) {
      data = data.filter((item: any) => {
        const locationText = [
          item?.displayLocation,
          item?.customFields?.full_address,
          item?.customFields?.area,
          item?.customFields?.district,
          item?.location?.address,
          item?.location?.city,
          item?.location?.state
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return locationText.includes(location);
      });
    }

    if (this.minPrice !== null) {
      data = data.filter(
        (item: any) =>
          Number(item.displayPrice || 0) >=
          Number(this.minPrice)
      );
    }

    if (this.maxPrice !== null) {
      data = data.filter(
        (item: any) =>
          Number(item.displayPrice || 0) <=
          Number(this.maxPrice)
      );
    }

    if (this.sortBy === 'Newest') {
      data.sort(
        (a: any, b: any) =>
          new Date(
            b.createdon || 0
          ).getTime() -
          new Date(
            a.createdon || 0
          ).getTime()
      );
    }

    if (this.sortBy === 'Oldest') {
      data.sort(
        (a: any, b: any) =>
          new Date(
            a.createdon || 0
          ).getTime() -
          new Date(
            b.createdon || 0
          ).getTime()
      );
    }

    if (this.sortBy === 'Price Low') {
      data.sort(
        (a: any, b: any) =>
          Number(a.displayPrice || 0) -
          Number(b.displayPrice || 0)
      );
    }

    if (this.sortBy === 'Price High') {
      data.sort(
        (a: any, b: any) =>
          Number(b.displayPrice || 0) -
          Number(a.displayPrice || 0)
      );
    }

    this.filteredResults = data;
    this.cdr.detectChanges();
  }

  async searchNow(): Promise<void> {
    await this.router.navigate(['/search'], {
      queryParams: {
        q:
          this.searchText.trim() ||
          null,
        type:
          this.selectedType,
        categoryId:
          this.selectedCategoryId,
        subcategoryId:
          this.selectedSubcategoryId
      }
    });
  }

  async resetFilters(): Promise<void> {
    this.searchText = '';
    this.locationText = '';
    this.selectedRadiusKm = 5;
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'Newest';

    await this.router.navigate(['/search'], {
      queryParams: {
        type:
          this.selectedType
      }
    });
  }

  goToAll(): void {
    this.router.navigate(['/search'], {
      queryParams: {
        type: 'all'
      }
    });
  }

selectType(
  type: 'product' | 'service'
): void {

  if (type === 'product') {

    this.router.navigate(
      ['/products'],
      {
        queryParams: {
          type: 'product'
        }
      }
    );

    return;
  }

  this.router.navigate(
    ['/service-list'],
    {
      queryParams: {
        type: 'service'
      }
    }
  );

}

  goToJobs(): void {
    this.router.navigate(['/job']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.location.back();
  }

  toggleMobileFilters(): void {
    this.showMobileFilters =
      !this.showMobileFilters;

    if (typeof document !== 'undefined') {
      document.body.style.overflow =
        this.showMobileFilters
          ? 'hidden'
          : '';
    }
  }

  closeMobileFilters(): void {
    this.showMobileFilters = false;

    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  applyMobileFilters(): void {
    this.applyFilters();
    this.closeMobileFilters();
  }

  async resetMobileFilters(): Promise<void> {
    await this.resetFilters();
    this.closeMobileFilters();
  }

  toggleProfileMenu(
    event: MouseEvent
  ): void {
    event.stopPropagation();

    this.showProfileMenu =
      !this.showProfileMenu;
  }

  @HostListener('document:click')
  closeProfileOutside(): void {
    this.showProfileMenu = false;
  }

  goToLogin(): void {
    this.showProfileMenu = false;
    this.router.navigate(['/login']);
  }

  goToProfileMenu(): void {
    this.showProfileMenu = false;

    if (!this.isLoggedInUser) {
      this.redirectToLogin('profile');
      return;
    }

    this.router.navigate([
      '/seller-profile'
    ]);
  }

  goToOrders(): void {
    this.showProfileMenu = false;

    if (!this.isLoggedInUser) {
      this.redirectToLogin('orders');
      return;
    }

    this.router.navigate(['/orders']);
  }

  goToFavorites(): void {
    this.showProfileMenu = false;

    if (!this.isLoggedInUser) {
      this.redirectToLogin('wishlist');
      return;
    }

    this.router.navigate(['/favt']);
  }

  goToNotifications(): void {
    this.showProfileMenu = false;

    if (!this.isLoggedInUser) {
      this.redirectToLogin('notification');
      return;
    }

    this.router.navigate([
      '/notification'
    ]);
  }

  goToChatFromDropdown(): void {
    this.showProfileMenu = false;

    if (!this.isLoggedInUser) {
      this.redirectToLogin('chats');
      return;
    }

    this.router.navigate(['/chats']);
  }

  goToMyPosts(): void {
    this.showProfileMenu = false;

    if (!this.isLoggedInUser) {
      this.redirectToLogin('my-posts');
      return;
    }

    this.router.navigate(['/my-posts']);
  }

  logoutFromDropdown(): void {
    this.showProfileMenu = false;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.isLoggedInUser = false;

    this.router.navigate(['/login']);
  }

  private redirectToLogin(
    page: string
  ): void {
    this.router.navigate(['/login'], {
      state: {
        redirectTo: page
      }
    });
  }

  buildLocation(item: any): string {
    return (
      item?.customFields?.full_address ||
      item?.customFields?.area ||
      item?.customFields?.district ||
      item?.location?.address ||
      item?.location?.city ||
      item?.location?.state ||
      'Location not available'
    );
  }

  getDistrict(item: any): string {
    return (
      item?.customFields?.district ||
      item?.location?.city ||
      item?.location?.state ||
      item?.customFields?.area ||
      'Location not available'
    );
  }

  getMainImage(item: any): string {
    if (
      Array.isArray(item?.images) &&
      item.images.length > 0
    ) {
      return item.images[0];
    }

    if (item?.image_url) {
      return item.image_url;
    }

    if (
      Array.isArray(item?.image_urls) &&
      item.image_urls.length > 0
    ) {
      return item.image_urls[0];
    }

    return 'assets/no-image.png';
  }
openDetails(item: any): void {
  const id =
    item?.postid ||
    item?._id;

  if (!id) {
    return;
  }

  this.router.navigate([
    '/details',
    id
  ]);
}

get isSearchPage(): boolean {
  return (
    this.router.url.startsWith('/search') ||
    this.router.url.startsWith('/all-listings')
  );
}

}
  
