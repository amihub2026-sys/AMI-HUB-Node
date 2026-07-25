import { Component, OnInit, HostListener,ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { Category } from '../categories/categories';
import { Subcategories } from '../subcategories/subcategories';
import { Router } from '@angular/router';
import { SearchResults } from '../search-results/search-results';
import {
  Filters,
  FilterState
} from '../filters/filters';



interface ProductCardItem {
  _id: string;
  postid?: string;

  title?: string | null;
  description?: string | null;
  price?: number | string | null;

  images?: string[];
  videos?: string[];

  categoryId?: any;
  subcategoryId?: any;
  sellerId?: any;

  listingType?: string | null;
  status?: string | null;
  isActive?: boolean;

  location?: any;
  contact?: any;

  createdAt?: string | null;
  updatedAt?: string | null;

  mainImage: string;
  displayTitle: string;
  displayPrice: number;
  displayCategory: string;
  displayLocation: string;
  displayType: string;

  categoryid?: string | null;
  subcategoryid?: string | null;
  categoryname?: string | null;
  subcategoryname?: string | null;

  district?: string | null;
  userid?: string | null;

  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
}

interface CategoryItem {
  _id: string;
  categoryid: string;
  categoryname: string;
  categoryName?: string;
  category_type?: string | null;
  categoryType?: string | null;
  isactive?: boolean | null;
  isActive?: boolean | null;
  sortorder?: number | null;
  sortOrder?: number | null;
}

interface SubcategoryItem {
  _id: string;
  subcategoryid: string;
  categoryid: string;
  subcategoryname: string;

  subcategoryName?: string;
  categoryId?: string | any;

  iconurl?: string | null;
  icon?: string | null;

  isactive?: boolean | null;
  isActive?: boolean | null;

  sortorder?: number | null;
  sortOrder?: number | null;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
imports: [
 CommonModule,
 RouterModule,
 FormsModule,
 Category,
 Subcategories,
  Filters,
  SearchResults
],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  private readonly postsApiUrl =
  `${environment.apiUrl}/posts`;

private readonly categoriesApiUrl =
  `${environment.apiUrl}/categories`;

private readonly subcategoriesApiUrl =
  `${environment.apiUrl}/subcategories`;

private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('token');

  return new HttpHeaders({
    Authorization: token ? `Bearer ${token}` : ''
  });
}
  
  showSubcategories = false;
  isFilterOpen = false;
  currentUserId = signal<string>('');
  posts = signal<any[]>([]);
  displayedPosts = signal<any[]>([]);
  isLoading = signal(false);
  hasMore = signal(true);

  subcategories = signal<SubcategoryItem[]>([]);
  categoriesData: CategoryItem[] = [];
  allSubcategories: SubcategoryItem[] = [];
results: ProductCardItem[] = [];
selectedCategory: any = null;

onCategorySelected(category:any){

  console.log(
    "Selected Category",
    category
  );


  this.selectedCategory = category;

  this.showSubcategories = true;

}

filteredResults: ProductCardItem[] = [];
  private page = 0;
  private readonly pageSize = 20;

  private selectedLocation: any = null;
  selectedRadiusKm = 50;
  locationText = '';

  searchText = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy = 'Newest';

selectedCategoryId: string | number | null = null;
  selectedSubcategoryId: string | number | null = null;
  selectedCategoryName = '';

constructor(
  private route: ActivatedRoute,
  private location: Location,
  private router: Router,
  private cdr: ChangeDetectorRef,
  private http: HttpClient
) {}
  async ngOnInit(): Promise<void> {
this.loadCurrentUser();
    this.loadSelectedLocationAndRadius();
   await Promise.all([
  this.loadCategories(),
  this.loadAllSubcategories(),
  this.loadResults()
]);

this.route.queryParams.subscribe(async (params) => {
  this.selectedCategoryId = params['category']
    ? String(params['category'])
    : null;

  this.selectedSubcategoryId =
    params['subcategory']
      ? String(params['subcategory'])
      : null;

  this.searchText =
    (params['q'] || '').toString().trim();

  this.subcategories.set([]);
  this.selectedCategoryName = '';

  if (this.selectedCategoryId) {
    const selectedCategory =
      this.categoriesData.find(
        (c) =>
          String(c.categoryid) ===
          String(this.selectedCategoryId)
      );

    this.selectedCategoryName =
      selectedCategory?.categoryname || '';

    await this.loadSubcategories(
      this.selectedCategoryId
    );
  }

  if (this.searchText) {
    await this.syncSearchWithCategoryAndSubcategory();
  }

  this.applyFilters();
});
  }
private loadCurrentUser(): void {
  const userData = localStorage.getItem('user');

  if (!userData) {
    this.currentUserId.set('');
    return;
  }

  try {
    const user = JSON.parse(userData);

    this.currentUserId.set(
      String(user?._id || user?.id || '')
    );
  } catch (error) {
    console.error(
      'Invalid user data in localStorage:',
      error
    );

    this.currentUserId.set('');
  }
}

async loadResults(): Promise<void> {
  this.isLoading.set(true);
  this.cdr.detectChanges();

  try {
    const params = new HttpParams()
      .set('listingType', 'product')
      .set('page', '1')
      .set('limit', '20');

    const response: any = await this.http
      .get<any>(
        this.postsApiUrl,
        {
          params,
          headers: this.getAuthHeaders()
        }
      )
      .toPromise();

    const rawPosts =
      response?.data?.posts ||
      response?.posts ||
      response?.data ||
      [];

    const posts = Array.isArray(rawPosts)
      ? rawPosts
      : [];

    const mapped: ProductCardItem[] =
      posts.map((item: any) =>
        this.mapMongoPost(item)
      );

    this.results = mapped;
    this.filteredResults = [...mapped];

    this.posts.set(mapped);
    this.displayedPosts.set(mapped);

    this.page = 1;
    this.hasMore.set(mapped.length >= this.pageSize);
  } catch (error) {
    console.error(
      'Error loading Mongo product cards:',
      error
    );

    this.results = [];
    this.filteredResults = [];

    this.posts.set([]);
    this.displayedPosts.set([]);

    this.hasMore.set(false);
  } finally {
    this.isLoading.set(false);
    this.cdr.detectChanges();
  }
}
private mapMongoPost(item: any): ProductCardItem {
  const category =
    typeof item?.categoryId === 'object'
      ? item.categoryId
      : null;

  const subcategory =
    typeof item?.subcategoryId === 'object'
      ? item.subcategoryId
      : null;

  const seller =
    typeof item?.sellerId === 'object'
      ? item.sellerId
      : null;

  const categoryId =
    category?._id ||
    item?.categoryId ||
    '';

  const subcategoryId =
    subcategory?._id ||
    item?.subcategoryId ||
    '';

  const categoryName =
    category?.categoryName ||
    item?.categoryName ||
    item?.category ||
    'Category';

  const subcategoryName =
    subcategory?.subcategoryName ||
    item?.subcategoryName ||
    item?.subcategory ||
    '';

  const city = item?.location?.city || '';
  const state = item?.location?.state || '';
  const address = item?.location?.address || '';

  const displayLocation =
    [city, state].filter(Boolean).join(', ') ||
    address ||
    'Location not available';

  return {
    ...item,

    _id: String(item?._id || ''),
    postid: String(item?._id || ''),

    userid: String(
      seller?._id ||
      item?.sellerId ||
      ''
    ),

    categoryid: String(categoryId),
    subcategoryid: String(subcategoryId),

    categoryname: categoryName,
    subcategoryname: subcategoryName,

    mainImage: this.getMainImage(item),

    displayTitle:
      item?.title || 'Untitled',

    displayPrice:
      Number(item?.price || 0),

    displayCategory:
      subcategoryName || categoryName,

    displayLocation,

    displayType:
      String(
        item?.listingType || 'product'
      ).toLowerCase(),

    district:
      city || state || address || null,

    latitude:
      this.toNumberOrNull(
        item?.location?.latitude
      ),

    longitude:
      this.toNumberOrNull(
        item?.location?.longitude
      )
  };
}
private toNumberOrNull(value: any): number | null {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}
buildLocation(item: any): string {
  if (item?.location) {
    return item.location;
  }

  const parts: string[] = [];

  if (item?.areaid) {
    parts.push(`Area ${item.areaid}`);
  }

  if (item?.cityid) {
    parts.push(`City ${item.cityid}`);
  }

  return parts.length
    ? parts.join(', ')
    : 'Location not available';
}
getDistrict(item: any): string {
  return (
    item?.district ||
    item?.location
      ?.split(',')[3]
      ?.trim() ||
    item?.displayLocation ||
    'Location'
  );
}
openDetails(item: ProductCardItem): void {
  const id = item?._id || item?.postid;

  if (!id) {
    console.error(
      'Mongo post id missing:',
      item
    );
    return;
  }

  this.router.navigate([
    '/details',
    id
  ]);
}
  private loadSelectedLocationAndRadius(): void {
    if (typeof window === 'undefined') return;

    const savedRadius = localStorage.getItem('selectedRadiusKm');
    if (savedRadius && !isNaN(Number(savedRadius))) {
      this.selectedRadiusKm = Number(savedRadius);
    }else {
  this.selectedRadiusKm = 50;
}

    const savedLocation = localStorage.getItem('amh_selected_location');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        this.selectedLocation = {
          ...parsed,
          lat: parsed?.lat != null ? Number(parsed.lat) : null,
          lon: parsed?.lon != null ? Number(parsed.lon) : null,
        };

        this.locationText =
          parsed?.name ||
          parsed?.address ||
          parsed?.place_name ||
          parsed?.city ||
          '';
      } catch (error) {
        console.error('Failed to parse selected location:', error);
        this.selectedLocation = null;
      }
    }
  }
async loadCategories(): Promise<void> {
  try {
    const response: any = await this.http
      .get<any>(this.categoriesApiUrl)
      .toPromise();

    const rawCategories =
      response?.data?.categories ||
      response?.categories ||
      response?.data ||
      [];

    const categories = Array.isArray(rawCategories)
      ? rawCategories
      : [];

    this.categoriesData = categories.map(
      (item: any) => ({
        ...item,

        _id: String(item?._id || ''),

        categoryid: String(item?._id || ''),

        categoryname:
          item?.categoryName ||
          item?.categoryname ||
          '',

        category_type:
          item?.categoryType ||
          item?.category_type ||
          null,

        isactive:
          item?.isActive ??
          item?.isactive ??
          true,

        sortorder: Number(
          item?.sortOrder ??
          item?.sortorder ??
          0
        )
      })
    );
  } catch (error) {
    console.error(
      'Error loading Mongo categories:',
      error
    );

    this.categoriesData = [];
  }
}
onFiltersApplied(filters: FilterState): void {
  console.log('Applied filters:', filters);

  // Call your API or filter the product list here.
}

onFiltersReset(): void {
  console.log('Filters reset');

  // Reload all products here.
}
selectSubcategory(subcategory: any): void {

  console.log('Selected Subcategory:', subcategory);

  this.selectedSubcategoryId =
    subcategory?.subcategoryid ||
    subcategory?._id ||
    null;


  // reload/filter your products here

}
async loadAllSubcategories(): Promise<void> {
  try {
    const response: any = await this.http
      .get<any>(this.subcategoriesApiUrl)
      .toPromise();

    const rawSubcategories =
      response?.data?.subcategories ||
      response?.subcategories ||
      response?.data ||
      [];

    const subcategories =
      Array.isArray(rawSubcategories)
        ? rawSubcategories
        : [];

    this.allSubcategories =
      subcategories.map((item: any) => {
        const categoryId =
          typeof item?.categoryId === 'object'
            ? item.categoryId?._id
            : item?.categoryId;

        return {
          ...item,

          _id: String(item?._id || ''),

          subcategoryid:
            String(item?._id || ''),

          categoryid:
            String(categoryId || ''),

          subcategoryname:
            item?.subcategoryName ||
            item?.subcategoryname ||
            '',

          iconurl:
            this.getMediaUrl(
              item?.icon ||
              item?.iconurl ||
              ''
            ),

          isactive:
            item?.isActive ??
            item?.isactive ??
            true,

          sortorder: Number(
            item?.sortOrder ??
            item?.sortorder ??
            0
          )
        };
      });
  } catch (error) {
    console.error(
      'Error loading Mongo subcategories:',
      error
    );

    this.allSubcategories = [];
  }
}
async loadSubcategories(
  categoryId: string | number | null
): Promise<void> {
  if (!categoryId) {
    this.subcategories.set([]);
    return;
  }

  const filtered = this.allSubcategories.filter(
    (sub: any) =>
      String(sub.categoryid) === String(categoryId)
  );

  this.subcategories.set(filtered);
}

  async onSearchTextChange(): Promise<void> {
    await this.syncSearchWithCategoryAndSubcategory();
    this.applyFilters();
  }

  async syncSearchWithCategoryAndSubcategory(): Promise<void> {
    const keyword = this.searchText.trim().toLowerCase();

    if (!keyword) {
      this.selectedCategoryId = null;
      this.selectedSubcategoryId = null;
      this.selectedCategoryName = '';
      this.subcategories.set([]);
      return;
    }

    const matchedCategory = this.categoriesData.find(
      (c) =>
        (c.categoryname || '').toString().trim().toLowerCase() === keyword
    );

    if (matchedCategory) {
      this.selectedCategoryId = Number(matchedCategory.categoryid);
      this.selectedSubcategoryId = null;
      this.selectedCategoryName = matchedCategory.categoryname || '';
      await this.loadSubcategories(this.selectedCategoryId);
      return;
    }

    const matchedSubcategory = this.allSubcategories.find(
      (s) =>
        (s.subcategoryname || '').toString().trim().toLowerCase() === keyword
    );

    if (matchedSubcategory) {
      this.selectedCategoryId = Number(matchedSubcategory.categoryid);
this.selectedSubcategoryId =
  String(matchedSubcategory.subcategoryid);

      const selectedCategory = this.categoriesData.find(
        (c) => Number(c.categoryid) === Number(matchedSubcategory.categoryid)
      );

      this.selectedCategoryName = selectedCategory?.categoryname || '';
      await this.loadSubcategories(this.selectedCategoryId);
      return;
    }

    const matchedPostByCategory = this.posts().find((post) => {
      const categoryName = (
        post?.category ??
        post?.categoryname ??
        ''
      )
        .toString()
        .trim()
        .toLowerCase();

      return categoryName.includes(keyword);
    });

    if (matchedPostByCategory) {
      const matchedCategoryFromPost = this.categoriesData.find((c) => {
        const categoryName = (c.categoryname || '')
          .toString()
          .trim()
          .toLowerCase();

        return categoryName === (
          matchedPostByCategory?.category ??
          matchedPostByCategory?.categoryname ??
          ''
        )
          .toString()
          .trim()
          .toLowerCase();
      });

      if (matchedCategoryFromPost) {
        this.selectedCategoryId = Number(matchedCategoryFromPost.categoryid);
        this.selectedSubcategoryId = null;
        this.selectedCategoryName = matchedCategoryFromPost.categoryname || '';
        await this.loadSubcategories(this.selectedCategoryId);
      }
    }
  }

  async onCategoryChange(): Promise<void> {
    this.selectedCategoryId = this.selectedCategoryId
      ? Number(this.selectedCategoryId)
      : null;

    this.selectedSubcategoryId = null;

    const selectedCategory = this.categoriesData.find(
      (c) => Number(c.categoryid) === Number(this.selectedCategoryId)
    );

    this.selectedCategoryName = selectedCategory?.categoryname || '';
    this.searchText = selectedCategory?.categoryname || '';

    await this.loadSubcategories(this.selectedCategoryId);
    this.applyFilters();
  }



  showAllSubcategoryPosts(): void {
    this.selectedSubcategoryId = null;

    const selectedCategory = this.categoriesData.find(
      (c) => Number(c.categoryid) === Number(this.selectedCategoryId)
    );

    this.searchText = selectedCategory?.categoryname || '';
    this.applyFilters();
  }

  private hasValidCoordinates(value: any): boolean {
    return (
      value &&
      value.lat != null &&
      value.lon != null &&
      !isNaN(Number(value.lat)) &&
      !isNaN(Number(value.lon))
    );
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const earthRadiusKm = 6371;

    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  private processPostsWithDistance(posts: any[]): any[] {
    if (!this.hasValidCoordinates(this.selectedLocation)) {
      return posts.map((post: any) => ({
        ...post,
        distanceKm: null,
      }));
    }

    const originLat = Number(this.selectedLocation.lat);
    const originLon = Number(this.selectedLocation.lon);

    return posts.map((post: any) => {
      const postLat =
        post?.latitude != null
          ? Number(post.latitude)
          : post?.lat != null
          ? Number(post.lat)
          : null;

      const postLon =
        post?.longitude != null
          ? Number(post.longitude)
          : post?.lon != null
          ? Number(post.lon)
          : null;

      const hasPostCoords =
        postLat != null &&
        postLon != null &&
        !isNaN(postLat) &&
        !isNaN(postLon);

      if (!hasPostCoords) {
        return {
          ...post,
          distanceKm: null,
        };
      }

      const distanceKm = this.calculateDistanceKm(
        originLat,
        originLon,
        postLat,
        postLon
      );

      return {
        ...post,
        distanceKm: Number(distanceKm.toFixed(1)),
      };
    });
  }

  applyFilters(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedRadiusKm', String(this.selectedRadiusKm));
    }

    let data = [...this.posts()];
    if (this.currentUserId()) {

  data = data.filter((post) =>
    String(post?.userid || '') !== String(this.currentUserId())
  );

}

    const search = this.searchText.trim().toLowerCase();
    const locationSearch = this.locationText.trim().toLowerCase();

    const selectedCategory = this.categoriesData.find(
      (c) => Number(c.categoryid) === Number(this.selectedCategoryId)
    );
    const selectedCategoryName = (
      selectedCategory?.categoryname || ''
    ).toLowerCase();

    const selectedSubcategory = this.subcategories().find(
      (s) => Number(s.subcategoryid) === Number(this.selectedSubcategoryId)
    );
    const selectedSubcategoryName = (
      selectedSubcategory?.subcategoryname || ''
    ).toLowerCase();

    if (search) {
      data = data.filter((post) => {
        const haystack = [
          post?.title,
          post?.description,
          post?.category,
          post?.categoryname,
          post?.subcategory,
          post?.subcategoryname,
          post?.location,
          post?.address,
          post?.area,
          post?.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    if (locationSearch) {
      data = data.filter((post) => {
        const locationHaystack = [
          post?.location,
          post?.address,
          post?.area,
          post?.city,
          post?.full_address,
          post?.place_name,
        ]
          .filter(Boolean)
          .join(' ')

          .toLowerCase();

        return locationHaystack.includes(locationSearch);
      });
    }

    if (this.hasValidCoordinates(this.selectedLocation) && this.selectedRadiusKm > 0) {
      data = data.filter((post) => {
        const postLat =
          post?.latitude != null
            ? Number(post.latitude)
            : post?.lat != null
            ? Number(post.lat)
            : null;

        const postLon =
          post?.longitude != null
            ? Number(post.longitude)
            : post?.lon != null
            ? Number(post.lon)
            : null;

        const hasPostCoords =
          postLat != null &&
          postLon != null &&
          !isNaN(postLat) &&
          !isNaN(postLon);

        if (!hasPostCoords) return false;

        const distanceKm = this.calculateDistanceKm(
          Number(this.selectedLocation.lat),
          Number(this.selectedLocation.lon),
          postLat,
          postLon
        );

        return distanceKm <= this.selectedRadiusKm;
      });
    }

    if (this.selectedCategoryId !== null) {
      data = data.filter((post) => {
        const postCategoryId = Number(
          post?.categoryid ?? post?.category_id ?? 0
        );

        const postCategoryName = (
          post?.category ??
          post?.categoryname ??
          ''
        )
          .toString()
          .trim()
          .toLowerCase();

        return (
          postCategoryId === Number(this.selectedCategoryId) ||
          postCategoryName === selectedCategoryName
        );
      });
    }

    if (this.selectedSubcategoryId !== null) {
      data = data.filter((post) => {
        const postSubcategoryId = Number(
          post?.subcategoryid ?? post?.subcategory_id ?? 0
        );

        const postSubcategoryName = (
          post?.subcategory ??
          post?.subcategoryname ??
          ''
        )
          .toString()
          .trim()
          .toLowerCase();

        return (
          postSubcategoryId === Number(this.selectedSubcategoryId) ||
          postSubcategoryName === selectedSubcategoryName
        );
      });
    }

    if (
      this.minPrice !== null &&
      this.minPrice !== undefined &&
      this.minPrice !== 0
    ) {
      data = data.filter(
        (post) => Number(post?.price || 0) >= Number(this.minPrice)
      );
    }

    if (
      this.maxPrice !== null &&
      this.maxPrice !== undefined &&
      this.maxPrice !== 0
    ) {
      data = data.filter(
        (post) => Number(post?.price || 0) <= Number(this.maxPrice)
      );
    }

    if (this.sortBy === 'Newest') {
      data.sort((a, b) => {
        const aTime = new Date(a?.createdon || 0).getTime();
        const bTime = new Date(b?.createdon || 0).getTime();
        return bTime - aTime;
      });
    } else if (this.sortBy === 'Oldest') {
      data.sort((a, b) => {
        const aTime = new Date(a?.createdon || 0).getTime();
        const bTime = new Date(b?.createdon || 0).getTime();
        return aTime - bTime;
      });
    } else if (this.sortBy === 'Price Low to High') {
      data.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
    } else if (this.sortBy === 'Price High to Low') {
      data.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
    }

    this.displayedPosts.set(data);
  }

  resetFilters(): void {
    this.searchText = '';
    this.locationText = this.selectedLocation?.name ||
      this.selectedLocation?.address ||
      this.selectedLocation?.place_name ||
      this.selectedLocation?.city ||
      '';
    this.selectedCategoryId = null;
    this.selectedSubcategoryId = null;
    this.selectedCategoryName = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'Newest';
    this.selectedRadiusKm = 50;
    this.subcategories.set([]);

    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedRadiusKm', String(this.selectedRadiusKm));
    }

    this.applyFilters();
  }
async loadMorePosts(): Promise<void> {
  if (this.isLoading() || !this.hasMore()) {
    return;
  }

  this.isLoading.set(true);

  try {
    const nextPage = this.page + 1;

    const params = new HttpParams()
      .set('listingType', 'product')
      .set('page', String(nextPage))
      .set('limit', String(this.pageSize));

    const response: any = await this.http
      .get<any>(
        this.postsApiUrl,
        {
          params,
          headers: this.getAuthHeaders()
        }
      )
      .toPromise();

    const rawPosts =
      response?.data?.posts ||
      response?.posts ||
      response?.data ||
      [];

    let newPosts: ProductCardItem[] =
      Array.isArray(rawPosts)
        ? rawPosts.map((post: any) =>
            this.mapMongoPost(post)
          )
        : [];

    newPosts =
      this.processPostsWithDistance(
        newPosts
      );

    if (newPosts.length < this.pageSize) {
      this.hasMore.set(false);
    }

    const existingIds = new Set(
      this.posts().map((post: any) =>
        String(post?._id || '')
      )
    );

    const uniqueNewPosts =
      newPosts.filter(
        (post: any) =>
          !existingIds.has(
            String(post?._id || '')
          )
      );

    const allPosts = [
      ...this.posts(),
      ...uniqueNewPosts
    ];

    this.posts.set(allPosts);

    this.results = allPosts;
    this.filteredResults = [...allPosts];

    this.page = nextPage;

    this.applyFilters();
  } catch (error) {
    console.error(
      'Error loading more Mongo products:',
      error
    );

    this.hasMore.set(false);
  } finally {
    this.isLoading.set(false);
  }
}
  getShortLocation(post: any): string {
    const location =
      post?.location || post?.address || post?.area || post?.city || '';

    if (!location) return '';

    const parts = location
      .split(',')
      .map((p: string) => p.trim())
      .filter(Boolean);

    return parts.slice(0, 2).join(', ');
  }

  @HostListener('window:scroll')
  async onScroll(): Promise<void> {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 300;

    if (scrollPosition >= threshold) {
      await this.loadMorePosts();
    }
  }
  private getMediaUrl(url: string): string {
  if (!url) {
    return 'assets/no-image.png';
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  const backendUrl =
    environment.apiUrl.replace('/api', '');

  return `${backendUrl}${
    url.startsWith('/') ? url : `/${url}`
  }`;
}

getMainImage(post: any): string {
  const image =
    Array.isArray(post?.images) &&
    post.images.length > 0
      ? post.images[0]
      : post?.image_url ||
        post?.imageUrl ||
        '';

  return this.getMediaUrl(image);
}

  trackByPostId(index: number, post: any): number {
    return post.postid;
  }
  /* ADD THIS */
toggleFilter() {
  this.isFilterOpen = !this.isFilterOpen;
}
goBack(): void {
  this.location.back();
}

}