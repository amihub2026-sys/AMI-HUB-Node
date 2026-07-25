import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  signal,
  ChangeDetectorRef,
  NgZone,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Category } from '../categories/categories';
interface CategoryItem {
  categoryid: number;
  categoryname: string;
  category_type?: string | null;
  isactive?: boolean | null;
  sortorder?: number | null;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, Category, RouterModule]
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
@ViewChild('categorySlider')
categorySlider!: ElementRef<HTMLDivElement>;
constructor(
  public router: Router,
  private api: ApiService,
  private cdr: ChangeDetectorRef,
  private ngZone: NgZone
) {}

  goToAllCategories() {
    this.router.navigate(['/all-categories']);
  }

  goToProducts() {
    this.router.navigate(['/products']);
  }

 

  goToSubscriptionPlan() {
    this.router.navigateByUrl('/subscription-plan');
  }
  jobs:any[] = [];
  currentSlide = 0;
  totalSlides = 3;
  autoSlideInterval: any;
  slidesArray = Array(this.totalSlides);

  customersCount = 0;
  productsCount = 0;
  servicesCount = 0;
  sellersCount = 0;

  animatedCustomersCount = 0;
  animatedProductsCount = 0;
  animatedServicesCount = 0;
  animatedSellersCount = 0;

  counterInterval: any;

  readonly targetCustomersCount = 1500;
  readonly targetProductsCount = 910;
  readonly targetServicesCount = 650;
  readonly targetSellersCount = 500;

  activeTab: string = 'all';
  searchQuery: string = '';
  recognition: any;
currentUserId = signal<string>('');
  trendingPosts = signal<any[]>([]);
  isTrendingLoading = signal(false);

  browseCategories = signal<any[]>([]);
  productCategories = signal<any[]>([]);
  serviceCategories = signal<any[]>([]);
  isCategoriesLoading = signal(false);

  featuredBusinesses = signal<any[]>([]);
  isFeaturedLoading = signal(false);

  latestProducts = signal<any[]>([]);
  isLatestLoading = signal(false);
   latestJobs:any[] = [];
  trendingOffset = signal(0);
  private trendingInterval: any;
  readonly visibleTrendingCount = 5;

async ngOnInit(): Promise<void> {

  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  );

  this.currentUserId.set(
    String(user?._id || user?.id || '')
  );

  this.loadLatestJobs();

  this.startAutoSlide();

  await this.loadBrowseCategories();
  await this.loadFeaturedBusinesses();
  await this.loadTrendingPosts();
  await this.loadNewProducts();
  await this.applyFavoriteStatus();

  this.startTrendingAutoScroll();
}

  ngAfterViewInit() {
    setTimeout(() => {
      this.cdr.detectChanges();
      this.startCounter();
    }, 100);
  }
  

async loadLatestJobs(): Promise<void> {
  try {
    const result: any = await this.api
      .get('/posts?listingType=job')
      .toPromise();

    const jobs = result?.data || [];

    this.latestJobs = jobs.slice(0, 5).map((job: any) => ({
      ...job,

      id: String(job._id || job.id || ''),
      job_title: job.job_title || job.title || '',
      company_name:
        job.company_name ||
        job.contactname ||
        job.sellerId?.fullName ||
        '',
      location:
        job.full_address ||
        job.location?.address ||
        job.location ||
        job.address ||
        '',
      salary: job.salary || job.price || 0,
      contact_email:
        job.contact_email ||
        job.contactemail ||
        job.sellerId?.email ||
        '',
      contact_phone:
        job.contact_phone ||
        job.contactphone ||
        job.sellerId?.mobile ||
        '',
      job_type: job.job_type || job.conditiontype || 'job',
      work_mode: job.work_mode || ''
    }));

    this.cdr.detectChanges();
  } catch (error) {
    console.error('Latest jobs error:', error);
    this.latestJobs = [];
  }
}
openJobDetails(job:any): void {

  console.log("Selected Job:", job);

  // navigate to job details page
  this.router.navigate([
    '/job-details',
    job.id
  ]);

}
async loadBrowseCategories(): Promise<void> {

  this.isCategoriesLoading.set(true);

  try {

    const response: any = await this.api
      .get('/categories')
      .toPromise();

    const allCategories = (response?.data || []).filter(
      (item: any) => item.isActive === true
    );

    this.browseCategories.set(allCategories);

    this.productCategories.set(
      allCategories.filter((item: any) =>
        item.availableIn?.includes('product')
      )
    );

    this.serviceCategories.set(
      allCategories.filter((item: any) =>
        item.availableIn?.includes('service')
      )
    );

  } catch (error) {

    console.error('Error loading categories', error);

    this.browseCategories.set([]);
    this.productCategories.set([]);
    this.serviceCategories.set([]);

  } finally {

    this.isCategoriesLoading.set(false);

  }

}
async loadTrendingPosts(): Promise<void> {

  this.isTrendingLoading.set(true);

  try {

    const response: any = await this.api
      .get('/posts?listingType=service&sort=popular')
      .toPromise();

    const posts = (response?.data || []).map((post: any) => ({
      ...post,

      postid: String(post._id || post.id || ''),

      image_url:
        post.image_url ||
        (Array.isArray(post.images) && post.images.length > 0
          ? post.images[0]
          : ''),

      image_urls:
        post.image_urls ||
        post.images ||
        [],

      location:
        post.location?.city ||
        post.location?.state ||
        post.location ||
        post.address ||
        '',

      userid:
        post.sellerId?._id ||
        post.sellerId ||
        ''
    }));

    this.trendingPosts.set(posts);
    this.trendingOffset.set(0);

  } catch (error) {

    console.error('Error loading service posts:', error);
    this.trendingPosts.set([]);

  } finally {

    this.isTrendingLoading.set(false);

  }
}
async loadFeaturedBusinesses(): Promise<void> {

  this.isFeaturedLoading.set(true);

  try {

    const response: any = await this.api
      .get('/posts?isFeatured=true')
      .toPromise();

    const posts = (response?.data || [])
      .slice(0, 8)
      .map((post: any) => ({
        ...post,

        postid: String(post._id || post.id || ''),

        image_url:
          post.image_url ||
          (Array.isArray(post.images) && post.images.length > 0
            ? post.images[0]
            : ''),

        image_urls:
          post.image_urls ||
          post.images ||
          [],

        location:
          post.location?.city ||
          post.location?.state ||
          post.location ||
          post.address ||
          '',

        userid:
          post.sellerId?._id ||
          post.sellerId ||
          ''
      }));

    this.featuredBusinesses.set(posts);

  } catch (error) {

    console.error('Error loading featured businesses:', error);
    this.featuredBusinesses.set([]);

  } finally {

    this.isFeaturedLoading.set(false);

  }
}
 goToJobs() {
  this.router.navigate(['/job']);
}
async loadNewProducts(): Promise<void> {

  this.isLatestLoading.set(true);

  try {

    const response: any = await this.api
      .get('/posts?listingType=product')
      .toPromise();

    const data = (response?.data || []).map((item: any) => ({

      ...item,

      postid: String(item._id || item.id || ''),

      image_url:
        item.image_url ||
        (Array.isArray(item.images) && item.images.length
          ? item.images[0]
          : ''),

      image_urls:
        item.image_urls ||
        item.images ||
        [],

      userid:
        item.sellerId?._id ||
        item.sellerId ||
        ''

    }));

    const featuredIds = new Set(
      this.featuredBusinesses().map(x => String(x.postid))
    );

    const hotIds = new Set(
      this.trendingPosts().map(x => String(x.postid))
    );

    this.latestProducts.set(
      data.filter((x: any) =>
        !featuredIds.has(String(x.postid)) &&
        !hotIds.has(String(x.postid))
      )
    );

  } catch (error) {

    console.error(error);
    this.latestProducts.set([]);

  } finally {

    this.isLatestLoading.set(false);

  }

}
async applyFavoriteStatus(): Promise<void> {

  const userId = this.currentUserId();

  if (!userId) {
    return;
  }

  this.featuredBusinesses.update((items: any[]) =>
    items.map((item: any) => ({
      ...item,
      isFavourite: false
    }))
  );

  this.trendingPosts.update((items: any[]) =>
    items.map((item: any) => ({
      ...item,
      isFavourite: false
    }))
  );

  this.latestProducts.update((items: any[]) =>
    items.map((item: any) => ({
      ...item,
      isFavourite: false
    }))
  );

  this.cdr.detectChanges();
}

  getCategoryImage(category: any): string {
    return (
      category?.iconurl ||
      category?.image_url ||
      'assets/icons/default.png'
    );
  }

  getFeaturedImage(post: any): string {
    const fallback = 'assets/ads/shop1.jpg';
    if (!post?.image_url) return fallback;
    const separator = post.image_url.includes('?') ? '&' : '?';
    return `${post.image_url}${separator}width=320&height=220&resize=cover&quality=70`;
  }

  getVisibleTrendingPosts() {
    const posts = this.trendingPosts();
    if (!posts.length) return [];

    if (posts.length <= this.visibleTrendingCount) return posts;

    const start = this.trendingOffset();
    const result = [];

    for (let i = 0; i < this.visibleTrendingCount; i++) {
      result.push(posts[(start + i) % posts.length]);
    }

    return result;
  }

  startTrendingAutoScroll() {
    this.stopTrendingAutoScroll();

    this.trendingInterval = setInterval(() => {
      const posts = this.trendingPosts();
      if (posts.length <= this.visibleTrendingCount) return;

      this.trendingOffset.update(value => (value + 1) % posts.length);
    }, 2500);
  }

  stopTrendingAutoScroll() {
    if (this.trendingInterval) {
      clearInterval(this.trendingInterval);
      this.trendingInterval = null;
    }
  }

  getTrendingImage(post: any): string {
    const fallback = 'assets/ads/shop1.jpg';
    if (!post?.image_url) return fallback;
    const separator = post.image_url.includes('?') ? '&' : '?';
    return `${post.image_url}${separator}width=320&height=220&resize=cover&quality=70`;
  }

  getLatestProductImage(post: any): string {
    const fallback = 'assets/ads/shop1.jpg';

    if (post?.image_url) {
      const separator = post.image_url.includes('?') ? '&' : '?';
      return `${post.image_url}${separator}width=320&height=220&resize=cover&quality=70`;
    }

    if (Array.isArray(post?.image_urls) && post.image_urls.length > 0) {
      const firstImage = post.image_urls[0];
      if (firstImage) {
        const separator = firstImage.includes('?') ? '&' : '?';
        return `${firstImage}${separator}width=320&height=220&resize=cover&quality=70`;
      }
    }

    return fallback;
  }
  
 getDistrict(business: any): string {

  if (!business) {
    return '';
  }

  // If district is already stored
  if (business.district) {
    return business.district;
  }

  // If city is stored
  if (business.city) {
    return business.city;
  }

  // Extract from address/location
  const location =
    business.location ||
    business.address ||
    '';

  if (!location) {
    return '';
  }

  const parts = location.split(',');

  // Example:
  // "12, Anna Nagar, Madurai, Tamil Nadu"
  // returns "Madurai"

  return parts.length >= 2
    ? parts[parts.length - 2].trim()
    : parts[0].trim();

}
  openDetails(post: any) {
    if (!post?.postid) return;
    this.router.navigate(['/details', post.postid]);
  }
async toggleFavourite(item: any, event: Event): Promise<void> {

  event.stopPropagation();

  const userId = this.currentUserId();

  if (!userId) {
    this.router.navigate(['/login']);
    return;
  }

  item.isFavourite = !item.isFavourite;

  this.cdr.detectChanges();
}
  slideCategories(direction: 'left' | 'right'): void {
  if (!this.categorySlider) {
    return;
  }

  const slider = this.categorySlider.nativeElement;

  const scrollAmount = slider.clientWidth * 0.75;

  slider.scrollBy({
    left: direction === 'right' ? scrollAmount : -scrollAmount,
    behavior: 'smooth'
  });
}

  openCategory(category: any) {

  const categoryName =
    (category?.categoryname || '').toLowerCase();

  // JOB CATEGORY
  if (categoryName === 'job') {
    this.router.navigate(['/job']);
    return;
  }

  // SERVICE CATEGORY
  if (category?.category_type === 'service') {
    this.router.navigate(['/service-list'], {
      queryParams: {
        category: category.categoryid
      }
    });
    return;
  }

  // PRODUCT CATEGORY
  if (category?.category_type === 'product') {
    this.router.navigate(['/products'], {
      queryParams: {
        category: category.categoryid
      }
    });
    return;
  }

  // DEFAULT SEARCH
  this.router.navigate(['/search'], {
    queryParams: {
      category: category.categoryid,
      type: 'all'
    }
  });
}

onCategoryImageError(event: Event): void {
  const image = event.target as HTMLImageElement;

  image.src = 'assets/category-icons/default-category.png';
}
  openProductCategory(category: any) {
    this.router.navigate(['/products'], {
      queryParams: { category: category.categoryid }
    });
  }

  openServiceCategory(category: any) {
    this.router.navigate(['/service-list'], {
      queryParams: { category: category.categoryid }
    });
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => this.nextSlide(), 3000);
  }

  pauseSlider() {
    clearInterval(this.autoSlideInterval);
  }

  resumeSlider() {
    this.startAutoSlide();
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
  }

  startCounter() {
    clearInterval(this.counterInterval);

    this.animatedCustomersCount = 1;
    this.animatedProductsCount = 1;
    this.animatedServicesCount = 1;
    this.animatedSellersCount = 1;

    this.customersCount = 1;
    this.productsCount = 1;
    this.servicesCount = 1;
    this.sellersCount = 1;

    this.cdr.detectChanges();

    this.ngZone.runOutsideAngular(() => {
      this.counterInterval = setInterval(() => {
        let changed = false;

        if (this.animatedCustomersCount < this.targetCustomersCount) {
          this.animatedCustomersCount++;
          changed = true;
        }

        if (this.animatedProductsCount < this.targetProductsCount) {
          this.animatedProductsCount++;
          changed = true;
        }

        if (this.animatedServicesCount < this.targetServicesCount) {
          this.animatedServicesCount++;
          changed = true;
        }

        if (this.animatedSellersCount < this.targetSellersCount) {
          this.animatedSellersCount++;
          changed = true;
        }

        this.customersCount = this.animatedCustomersCount;
        this.productsCount = this.animatedProductsCount;
        this.servicesCount = this.animatedServicesCount;
        this.sellersCount = this.animatedSellersCount;

        if (changed) {
          this.ngZone.run(() => {
            this.cdr.detectChanges();
          });
        }

        if (
          this.animatedCustomersCount >= this.targetCustomersCount &&
          this.animatedProductsCount >= this.targetProductsCount &&
          this.animatedServicesCount >= this.targetServicesCount &&
          this.animatedSellersCount >= this.targetSellersCount
        ) {
          clearInterval(this.counterInterval);
        }
      }, 30);
    });
  }

  selectTab(tab: string) {
    this.activeTab = tab;
    // this.searchQuery = '';

    if (tab === 'service-list') {
      this.router.navigate(['/service-list']);
      return;
    }

    if (tab === 'products') {
      this.router.navigate(['/products']);
      return;
    }
     if (tab === 'job') {
    this.router.navigate(['/job']);
  }

    this.router.navigate(['/search'], {
      queryParams: { type: 'all' }
    });
  }

goToPage() {
  const query = this.searchQuery?.trim() || '';

  this.router.navigate(['/search'], {
    queryParams: {
      q: query,
      type:
        this.activeTab === 'products'
          ? 'product'
          : this.activeTab === 'service-list'
          ? 'service'
          : 'all'
    }
  });
}

  goToAllProductCategories() {
    this.router.navigate(['/product-categories']);
  }

 goToAllDeals() {
  this.router.navigate(['/all-listings'], {
    queryParams: {
      type: 'all'
    }
  });
}
goToProduct() {
  this.router.navigate(['/search'], {
    queryParams: {
      type: 'product'
    }
  });
}
goToServices() {
  this.router.navigate(['/search'], {
    queryParams: {
      type: 'service'
    }
  });
}
  goToAllServiceCategories() {
    this.router.navigate(['/service-categories']);
  }

  getSearchPlaceholder() {
    if (this.activeTab === 'products') {
      return 'Search products like cars, mobiles, furniture...';
    }

    if (this.activeTab === 'services' || this.activeTab === 'service-list') {
      return 'Search services like plumbing, electrician, tutors...';
    }

    return 'Search products and services...';
  }

  startVoiceSearch() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support voice search.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.start();

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.searchQuery = transcript;
      this.goToPage();
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
    };
  }

  ngOnDestroy() {
    clearInterval(this.autoSlideInterval);
    clearInterval(this.counterInterval);
    this.stopTrendingAutoScroll();
  }
  isMyPost(post: any): boolean {
  return String(post?.userid || '') === String(this.currentUserId() || '');
}
  }
