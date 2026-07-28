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
async onCategorySelected(category: any): Promise<void> {

  console.log(
    'Selected Product Category:',
    category
  );

  if (!category) {
    return;
  }

  const categoryId = String(
    category?._id ||
    category?.categoryid ||
    category?.id ||
    ''
  );

  if (!categoryId) {
    console.error(
      'Product category ID missing:',
      category
    );
    return;
  }

  this.selectedCategory = category;
  this.selectedCategoryId = categoryId;
  this.selectedSubcategoryId = null;

  await this.loadSubcategories(categoryId);

  console.log(
    'Loaded product subcategories:',
    this.subcategories()
  );

  this.showSubcategories = true;

  this.applyFilters();
  this.cdr.detectChanges();
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

    const categoryId = params['category']
      ? String(params['category'])
      : null;

    const subcategoryId = params['subcategory']
      ? String(params['subcategory'])
      : null;

    const queryText =
      String(params['q'] || '').trim();

    this.selectedCategoryId = categoryId;
    this.selectedSubcategoryId = subcategoryId;
    this.searchText = queryText;

    if (categoryId) {

      const category =
        this.categoriesData.find(
          (item) =>
            String(item.categoryid) ===
            String(categoryId)
        );

      if (category) {
        this.selectedCategory = category;
        this.selectedCategoryName =
          category.categoryname || '';

        this.showSubcategories = true;

        await this.loadSubcategories(categoryId);
      }

    } else {

      // Normal Products page must show categories
      this.showSubcategories = false;
      this.selectedCategory = null;
      this.selectedCategoryName = '';
      this.subcategories.set([]);
    }

    if (queryText) {
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

    if (typeof item.location === 'string') {
      return item.location;
    }

    return [
      item?.location?.area,
      item?.location?.city,
      item?.location?.district,
      item?.location?.state
    ]
      .filter(Boolean)
      .join(', ') || 'Location not available';
  }

  return (
    item?.displayLocation ||
    item?.address ||
    item?.city ||
    'Location not available'
  );
}
getDistrict(item: any): string {

  return (
    item?.location?.district ||
    item?.location?.city ||
    item?.location?.state ||
    item?.district ||
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

 this.locationText = '';
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

    this.categoriesData = categories
      .map((item: any) => ({
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
      }))
      .filter((category: CategoryItem) => {
        const type = String(
          category.category_type || ''
        )
          .trim()
          .toLowerCase();

        return (
          category.isactive !== false &&
          type === 'product'
        );
      })
      .sort(
        (a: CategoryItem, b: CategoryItem) =>
          Number(a.sortorder || 0) -
          Number(b.sortorder || 0)
      );

    console.log(
      'Common product categories:',
      this.categoriesData
    );
  } catch (error) {
    console.error(
      'Error loading Mongo product categories:',
      error
    );

    this.categoriesData = [];
  }
}
onFiltersApplied(filters: FilterState): void {

  this.searchText =
    String(filters?.searchText || '').trim();

  this.locationText =
    String(filters?.locationText || '').trim();

  this.minPrice =
    filters?.minPrice !== null &&
    filters?.minPrice !== undefined
      ? Number(filters.minPrice)
      : null;

  this.maxPrice =
    filters?.maxPrice !== null &&
    filters?.maxPrice !== undefined
      ? Number(filters.maxPrice)
      : null;

  this.selectedCategoryId =
    filters?.selectedCategoryId
      ? String(filters.selectedCategoryId)
      : this.selectedCategoryId;

  this.sortBy =
    filters?.sortBy || 'Newest';

  this.applyFilters();
  this.isFilterOpen = false;
}


onFiltersReset(): void {

  this.searchText = '';
  this.minPrice = null;
  this.maxPrice = null;
  this.sortBy = 'Newest';

  this.selectedCategoryId = null;
  this.selectedSubcategoryId = null;

  this.showSubcategories = false;
  this.selectedCategory = null;

  this.applyFilters();
  this.isFilterOpen = false;
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
      this.selectedCategoryId =
  String(matchedCategory.categoryid);
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
      this.selectedCategoryId =
  String(matchedSubcategory.categoryid);
this.selectedSubcategoryId =
  String(matchedSubcategory.subcategoryid);

      const selectedCategory = this.categoriesData.find(
       (c) =>
  String(c.categoryid) ===
  String(matchedSubcategory.categoryid)
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
        this.selectedCategoryId =
  String(matchedCategoryFromPost.categoryid);
        this.selectedSubcategoryId = null;
        this.selectedCategoryName = matchedCategoryFromPost.categoryname || '';
        await this.loadSubcategories(this.selectedCategoryId);
      }
    }
  }

async onCategoryChange(): Promise<void> {

  this.selectedCategoryId =
    this.selectedCategoryId
      ? String(this.selectedCategoryId)
      : null;

  this.selectedSubcategoryId = null;

  const selectedCategory =
    this.categoriesData.find(
      (c) =>
        String(c.categoryid) ===
        String(this.selectedCategoryId)
    );

  this.selectedCategoryName =
    selectedCategory?.categoryname || '';

  this.searchText =
    selectedCategory?.categoryname || '';

  await this.loadSubcategories(
    this.selectedCategoryId
  );

  this.applyFilters();
}
  showAllSubcategoryPosts(): void {
    this.selectedSubcategoryId = null;

const selectedCategory =
  this.categoriesData.find(
    (c) =>
      String(c.categoryid) ===
      String(this.selectedCategoryId)
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



    const search = this.searchText.trim().toLowerCase();
    const locationSearch = this.locationText.trim().toLowerCase();

 const selectedCategory =
  this.categoriesData.find(
    (c) =>
      String(c.categoryid) ===
      String(this.selectedCategoryId)
  );
    const selectedCategoryName = (
      selectedCategory?.categoryname || ''
    ).toLowerCase();

const selectedSubcategory =
  this.subcategories().find(
    (s) =>
      String(s.subcategoryid) ===
      String(this.selectedSubcategoryId)
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

  post?.location?.address,
  post?.location?.area,
  post?.location?.city,
  post?.location?.district,
  post?.location?.state,

  post?.displayLocation,
  post?.address,
  post?.area,
  post?.city
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
  post?.location?.address,
  post?.location?.area,
  post?.location?.city,
  post?.location?.district,
  post?.location?.state,

  post?.displayLocation,
  post?.address,
  post?.area,
  post?.city,
  post?.full_address,
  post?.place_name
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

        if (!hasPostCoords) return true;

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
const postCategoryId =
  String(
    post?.categoryid ??
    post?.categoryId?._id ??
    post?.categoryId ??
    ''
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
          postCategoryId === String(this.selectedCategoryId) ||
          postCategoryName === selectedCategoryName
        );
      });
    }

    if (this.selectedSubcategoryId !== null) {
      data = data.filter((post) => {
const postSubcategoryId =
  String(
    post?.subcategoryid ??
    post?.subcategoryId?._id ??
    post?.subcategoryId ??
    ''
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
         postSubcategoryId === String(this.selectedSubcategoryId)||
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

    const aTime = new Date(
      a?.createdAt ||
      a?.createdon ||
      0
    ).getTime();

    const bTime = new Date(
      b?.createdAt ||
      b?.createdon ||
      0
    ).getTime();

    return bTime - aTime;
  });

} else if (this.sortBy === 'Oldest') {

  data.sort((a, b) => {

    const aTime = new Date(
      a?.createdAt ||
      a?.createdon ||
      0
    ).getTime();

    const bTime = new Date(
      b?.createdAt ||
      b?.createdon ||
      0
    ).getTime();

    return aTime - bTime;
  });

} else if (this.sortBy === 'Price Low to High') {

  data.sort(
    (a, b) =>
      Number(a?.price || 0) -
      Number(b?.price || 0)
  );

} else if (this.sortBy === 'Price High to Low') {

  data.sort(
    (a, b) =>
      Number(b?.price || 0) -
      Number(a?.price || 0)
  );
}

  

this.displayedPosts.set(data);
this.cdr.detectChanges();
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

  if (typeof post?.location === 'string') {

    const parts = post.location
      .split(',')
      .map((part: string) => part.trim())
      .filter(Boolean);

    return parts.slice(0, 2).join(', ');
  }

  return [
    post?.location?.area,
    post?.location?.city,
    post?.location?.district,
    post?.location?.state
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
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

trackByPostId(index: number, post: any): string {
  return String(
    post?._id ||
    post?.postid ||
    index
  );
}
  /* ADD THIS */
toggleFilter() {
  this.isFilterOpen = !this.isFilterOpen;
}
goBack(): void {
  this.location.back();
}
onSubcategorySelected(subcategory: any): void {

  console.log(
    'Selected Product Subcategory:',
    subcategory
  );

  this.selectedSubcategoryId =
    String(
      subcategory?._id ||
      subcategory?.subcategoryid ||
      subcategory?.id ||
      ''
    );

  this.applyFilters();
}


onSubcategoryBack(): void {

  this.showSubcategories = false;
  this.selectedCategory = null;
  this.selectedCategoryId = null;
  this.selectedSubcategoryId = null;

  this.applyFilters();
}
}