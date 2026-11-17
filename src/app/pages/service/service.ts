import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  Input
} from '@angular/core';

import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { SnackbarService } from '../../services/snackbar.service';
import { ApiService } from '../../services/api.service';

import {
  PostDraftService,
  ServiceBlockDraft
} from '../../services/post-draft.service';

import { LocationPickerComponent } from '../location-picker/location-picker';

import {
  LocationSearchService,
  AppLocationResult
} from '../../services/location-search';

import {
  Category,
  Subcategory
} from '../../services/category.types';

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LocationPickerComponent
  ],
  templateUrl: './service.html',
  styleUrls: ['./service.css']
})
export class Service implements OnInit {
  @Input() adminEditPostId: string | null = null;
  @Input() adminUser: any = null;

  showSuccess = false;
  isSubmitting = false;
  isEditMode = false;
  editPostId: string | null = null;
  isPageLoading = true;

  adType = '';
  lockedAdType = '';

  categories: Category[] = [];
  subcategoriesList: Subcategory[] = [];

  selectedMapLocation: AppLocationResult | null = null;

  existingMainImageUrl = '';
  existingImageUrls: string[] = [];
  existingVideoUrls: string[] = [];

  mainPhotoPreview: string | null = null;
  otherImagePreviews: string[] = [];

  private typingTimer: any;

  mainAd = {
    title: '',
    price: null as number | null,
    description: '',
    category: '',
    subcategory: '',

    country: 'India',
    state: '',
    district: '',
    area: '',

    contactphone: '',
    whatsappnumber: '',

    mainPhoto: null as File | null,
    otherImages: [] as File[],
    videos: [] as File[],

    full_address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    place_name: '',
    location_source: 'google'
  };

  serviceBlocks: ServiceBlockDraft[] = [
    {
      title: '',
      price: null,
      image: null
    }
  ];

  constructor(
    private router: Router,
    private postDraftService: PostDraftService,
    private api: ApiService,
    private locationSearchService: LocationSearchService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private location: Location,
    private snackbar: SnackbarService
  ) {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private showAlert(
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ): void {
    this.snackbar.show(message, type);
  }

  goToSubscriptionPlans(): void {
    this.router.navigate(['/subscription-plan']);
  }

  goToFeatureAd(): void {
    if (!this.editPostId) {
      this.showAlert('Post id not found');
      return;
    }

    const finalType =
      this.lockedAdType || this.adType || 'service';

    if (this.isBrowser()) {
      const featureEditContext = {
        postId: Number(this.editPostId),
        adType: finalType,

        postData: {
          postid: Number(this.editPostId),
          userid: null,

          title: this.mainAd.title?.trim() || '',
          description: this.mainAd.description?.trim() || '',
          price: this.mainAd.price ?? 0,

          category: this.mainAd.category || '',
          subcategory: this.mainAd.subcategory || '',

          conditiontype: finalType,
          adtype: finalType,

          contactphone: this.mainAd.contactphone || '',
          whatsappnumber: this.mainAd.whatsappnumber || '',

          location: this.mainAd.full_address || '',
          address: this.mainAd.full_address || '',
          full_address: this.mainAd.full_address || '',

          latitude: this.mainAd.latitude,
          longitude: this.mainAd.longitude,

          place_name: this.mainAd.place_name || '',
          location_source:
            this.mainAd.location_source || 'google',

          country: this.mainAd.country || 'India',
          state: this.mainAd.state || '',
          district: this.mainAd.district || '',
          area: this.mainAd.area || '',

          image_url: this.existingMainImageUrl || '',
          image_urls: this.existingImageUrls || [],
          video_urls: this.existingVideoUrls || [],

          catalog:
            finalType === 'service'
              ? this.buildCatalogDraft()
              : []
        }
      };

      localStorage.setItem(
        'feature_edit_post_context',
        JSON.stringify(featureEditContext)
      );
    }

    this.router.navigate(
      ['/featured-plan'],
      {
        state: {
          postId: Number(this.editPostId),
          adType: finalType
        }
      }
    );
  }

  async ngOnInit(): Promise<void> {
    this.ngZone.run(() => {
      this.isPageLoading = true;
      this.cdr.detectChanges();
    });

    if (this.adminUser) {
      this.mainAd.contactphone =
        this.adminUser.phone || '';

      this.mainAd.whatsappnumber =
        this.adminUser.phone || '';
    }

    try {
      const routeId =
        this.route.snapshot.paramMap.get('id');

      const navStateId =
        typeof history !== 'undefined' &&
        history.state?.postId
          ? String(history.state.postId)
          : null;

      const id = this.adminEditPostId
        ? String(this.adminEditPostId)
        : routeId || navStateId;

      this.editPostId = id;
      this.isEditMode = !!id;

      try {
        const categoriesResult: any = await this.api
          .get('/categories')
          .toPromise();

        this.ngZone.run(() => {
          this.categories =
            categoriesResult.data || [];

          this.cdr.detectChanges();
        });
      } catch (error) {
        console.error(
          'Error loading categories:',
          error
        );

        this.ngZone.run(() => {
          this.categories = [];
          this.cdr.detectChanges();
        });
      }

      // CREATE MODE
      if (!id) {
        this.ngZone.run(() => {
          this.adType = 'service';
          this.lockedAdType = '';
          this.isPageLoading = false;

          this.cdr.detectChanges();
        });

        return;
      }

      // EDIT MODE
      let data: any = null;
      let error: any = null;

      try {
       const postRequest =
  this.adminUser || this.adminEditPostId
    ? this.api.getAdmin(`/posts/${id}`)
    : this.api.get(`/posts/${id}`);

const postResult: any = await postRequest.toPromise();
        data = postResult?.data;
      } catch (err) {
        console.error(
          'Error loading post for edit:',
          err
        );

        error = err;
      }

      if (error) {
        this.showAlert('Error loading post');
        this.router.navigate(['/my-posts']);
        return;
      }

      if (!data) {
        this.showAlert('Post not found');
        this.router.navigate(['/my-posts']);
        return;
      }

      this.ngZone.run(() => {
        this.patchFormFromPost(data);
        this.cdr.detectChanges();
      });

      try {
        await this.rebuildEditDropdowns(data);
      } catch (err) {
        console.error(
          'Error rebuilding edit dropdowns:',
          err
        );
      }

      try {
        this.ngZone.run(() => {
          this.rebuildSelectedMapLocation();
          this.cdr.detectChanges();
        });
      } catch (err) {
        console.error(
          'Error rebuilding selected map location:',
          err
        );
      }
    } catch (error) {
      console.error(
        'Error initializing page:',
        error
      );

      this.showAlert('Error opening edit page');
      this.router.navigate(['/my-posts']);
    } finally {
      this.ngZone.run(() => {
        this.isPageLoading = false;
        this.cdr.detectChanges();
      });

      setTimeout(() => {
        this.ngZone.run(() => {
          this.isPageLoading = false;
          this.cdr.detectChanges();
        });
      }, 0);
    }
  }

  get isServiceType(): boolean {
    return this.adType === 'service';
  }

  get isProductType(): boolean {
    return this.adType === 'product';
  }

  private safeParseArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.filter(
        (item: any) =>
          typeof item === 'string' && item.trim()
      );
    }

    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);

        return Array.isArray(parsed)
          ? parsed.filter(
              (item: any) =>
                typeof item === 'string' && item.trim()
            )
          : [];
      } catch {
        return [];
      }
    }

    return [];
  }

  private patchFormFromPost(data: any): void {
    this.mainAd.title = data.title || '';
    this.mainAd.description = data.description || '';
    this.mainAd.price = data.price ?? null;

    this.mainAd.category = data.category || '';
    this.mainAd.subcategory = data.subcategory || '';

    this.mainAd.contactphone = String(
      data.contactphone ||
      data.contactPhone ||
      data.sellerId?.mobile ||
      data.sellerId?.phone ||
      ''
    );

    this.mainAd.whatsappnumber = String(
      data.whatsappnumber ||
      data.whatsappNumber ||
      data.sellerId?.whatsappnumber ||
      ''
    );

    const savedLocation =
      data.location &&
      typeof data.location === 'object'
        ? data.location
        : null;

    this.mainAd.full_address =
      data.full_address ||
      savedLocation?.address ||
      data.address ||
      '';

    this.mainAd.latitude =
      data.latitude ??
      savedLocation?.latitude ??
      null;

    this.mainAd.longitude =
      data.longitude ??
      savedLocation?.longitude ??
      null;

    this.mainAd.place_name =
      data.place_name ||
      savedLocation?.address ||
      '';

    this.mainAd.location_source =
      data.location_source || 'google';

    this.mainAd.country =
      data.country ||
      savedLocation?.country ||
      'India';

    this.mainAd.state =
      data.state ||
      savedLocation?.state ||
      '';

    this.mainAd.district =
      data.district ||
      savedLocation?.city ||
      '';

    this.mainAd.area =
      data.area ||
      savedLocation?.city ||
      '';

    this.existingImageUrls =
      Array.isArray(data.images)
        ? data.images
        : [];

    this.existingVideoUrls =
      Array.isArray(data.videos)
        ? data.videos
        : [];

    this.existingMainImageUrl =
      this.existingImageUrls.length > 0
        ? this.existingImageUrls[0]
        : '';

    const dbType = String(
      data.listingType ||
      data.adtype ||
      data.conditiontype ||
      'service'
    ).trim().toLowerCase();

    this.adType =
      dbType === 'product' ? 'product' : 'service';

    this.lockedAdType = this.adType;

    if (this.adType === 'service') {
      if (
        Array.isArray(data.catalog) &&
        data.catalog.length > 0
      ) {
        this.serviceBlocks = data.catalog.map(
          (item: any) => ({
            title: item?.title || '',
            price: item?.price ?? null,
            image: null
          })
        );
      } else {
        this.serviceBlocks = [
          {
            title: '',
            price: null,
            image: null
          }
        ];
      }
    } else {
      this.serviceBlocks = [];
    }
  }

  private async rebuildEditDropdowns(
    data: any
  ): Promise<void> {
    const getId = (value: any): string =>
      String(
        value && typeof value === 'object'
          ? value._id || value.id || ''
          : value || ''
      );

    const getName = (value: any): string =>
      typeof value === 'string'
        ? value
        : String(
            value?.categoryName ||
            value?.subcategoryName ||
            value?.name ||
            ''
          );

    const savedCategoryId = getId(data.categoryId);
    const savedCategoryName = getName(data.category);

    const selectedCategory = this.categories.find(
      (category: any) =>
        getId(category._id) === savedCategoryId ||
        category.categoryName === savedCategoryName
    );

    if (!selectedCategory) {
      console.warn('Saved category not found:', {
        savedCategoryId,
        savedCategoryName
      });

      this.subcategoriesList = [];
      return;
    }

    this.mainAd.category =
      selectedCategory.categoryName;

    try {
      const result: any = await this.api
        .get(
          `/subcategories?categoryId=${selectedCategory._id}&type=${this.adType}`
        )
        .toPromise();

      this.subcategoriesList = result?.data || [];

      const savedSubcategoryId =
        getId(data.subcategoryId);

      const savedSubcategoryName =
        getName(data.subcategory);

      const selectedSubcategory =
        this.subcategoriesList.find(
          (subcategory: any) =>
            getId(subcategory._id) === savedSubcategoryId ||
            subcategory.subcategoryName === savedSubcategoryName
        );

      if (selectedSubcategory) {
        this.mainAd.subcategory =
          selectedSubcategory.subcategoryName;
      } else {
        console.warn('Saved subcategory not found:', {
          savedSubcategoryId,
          savedSubcategoryName
        });
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error(
        'Subcategory loading failed:',
        error
      );

      this.subcategoriesList = [];
    }
  }

  private rebuildSelectedMapLocation(): void {
    if (
      this.mainAd.latitude != null &&
      this.mainAd.longitude != null &&
      this.mainAd.full_address
    ) {
      this.selectedMapLocation = {
        placeId: '',
        displayName: this.mainAd.full_address,
        lat: Number(this.mainAd.latitude),
        lon: Number(this.mainAd.longitude),
        name: this.mainAd.place_name || '',
        city: this.mainAd.district || '',
        state: this.mainAd.state || '',
        country: this.mainAd.country || '',
        postalCode: ''
      };
    }
  }

  async onAdTypeChange(): Promise<void> {
    if (this.isEditMode) {
      this.adType =
        this.lockedAdType || this.adType;

      return;
    }

    this.mainAd.category = '';
    this.mainAd.subcategory = '';
    this.subcategoriesList = [];

    try {
      const result: any = await this.api
        .get(`/categories?type=${this.adType}`)
        .toPromise();

      this.categories = result.data || [];

      this.cdr.detectChanges();
    } catch (error) {
      console.error(
        'Category loading error:',
        error
      );

      this.categories = [];
    }

    if (this.adType === 'product') {
      this.serviceBlocks = [];
    } else if (this.serviceBlocks.length === 0) {
      this.serviceBlocks = [
        {
          title: '',
          price: null,
          image: null
        }
      ];
    }
  }

  async onCategoryChange(): Promise<void> {
    this.mainAd.subcategory = '';
    this.subcategoriesList = [];

    const selected = this.categories.find(
      category =>
        category.categoryName === this.mainAd.category
    );

    if (!selected) {
      return;
    }

    const result: any = await this.api
      .get(
        `/subcategories?categoryId=${selected._id}&type=${this.adType}`
      )
      .toPromise();

    const subcategories = result.data || [];

    this.subcategoriesList = subcategories.map(
      (subcategory: any) => ({
        _id: String(subcategory._id),
        categoryId: String(selected._id),

        subcategoryName:
          subcategory.subcategoryName,

        slug: subcategory.slug || '',
        icon: subcategory.icon || '',
        image: subcategory.image || '',
        description: subcategory.description || '',
        sortOrder: subcategory.sortOrder || 0,
        isActive: subcategory.isActive ?? true,
        availableIn: subcategory.availableIn || []
      })
    );
  }

  addAnotherService(): void {
    if (this.adType !== 'service') {
      return;
    }

    this.serviceBlocks.push({
      title: '',
      price: null,
      image: null
    });
  }

  removeService(index: number): void {
    if (this.adType !== 'service') {
      return;
    }

    this.serviceBlocks.splice(index, 1);
  }

onMainPhotoChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;

  this.mainAd.mainPhoto = file;
  this.mainPhotoPreview = null;

  if (!file) {
    this.cdr.detectChanges();
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    this.ngZone.run(() => {
      this.mainPhotoPreview = reader.result as string;
      this.cdr.detectChanges();
    });
  };

  reader.onerror = () => {
    this.ngZone.run(() => {
      this.showAlert('Unable to preview this image', 'error');
      this.cdr.detectChanges();
    });
  };

  reader.readAsDataURL(file);
}
  onOtherImagesChange(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.mainAd.otherImages =
      input.files ? Array.from(input.files) : [];

    this.otherImagePreviews =
      this.mainAd.otherImages.map(
        file => URL.createObjectURL(file)
      );
  }

  onVideosChange(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.mainAd.videos =
      input.files ? Array.from(input.files) : [];
  }

  onServiceImageChange(
    event: Event,
    index: number
  ): void {
    if (this.adType !== 'service') {
      return;
    }

    const input =
      event.target as HTMLInputElement;

    this.serviceBlocks[index].image =
      input.files && input.files.length
        ? input.files[0]
        : null;
  }

  removeExistingMainImage(): void {
    this.existingMainImageUrl = '';
  }

  removeExistingOtherImage(index: number): void {
    this.existingImageUrls.splice(index, 1);

    this.existingImageUrls = [
      ...this.existingImageUrls
    ];

    if (
      !this.existingMainImageUrl &&
      this.existingImageUrls.length > 0
    ) {
      this.existingMainImageUrl =
        this.existingImageUrls[0];
    }
  }

  removeExistingVideo(index: number): void {
    this.existingVideoUrls.splice(index, 1);

    this.existingVideoUrls = [
      ...this.existingVideoUrls
    ];
  }

 private async uploadToR2(
  file: File,
  folder: string
): Promise<string> {
  const response: any = await this.api
    .uploadImage(
      file,
      folder,
      !!this.adminUser || !!this.adminEditPostId
    )
    .toPromise();

  const url = response?.publicUrl || response?.url;

  if (!url) {
    throw new Error(
      response?.message || 'Image upload failed'
    );
  }

  return url;
}

  private async uploadMultipleToR2(
    files: File[],
    folder: string
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const uploaded = await this.uploadToR2(
        file,
        folder
      );

      if (uploaded) {
        uploadedUrls.push(uploaded);
      }
    }

    return uploadedUrls;
  }

  onMapLocationSelected(
    location: AppLocationResult
  ): void {
    this.selectedMapLocation = location;

    this.mainAd.country =
      location.country || this.mainAd.country;

    this.mainAd.state =
      location.state || this.mainAd.state;

    this.mainAd.district =
      location.city || this.mainAd.district;

    this.mainAd.area =
      location.displayName || this.mainAd.area;

    this.mainAd.full_address =
      location.displayName || this.mainAd.full_address;

    this.mainAd.latitude = Number(location.lat);
    this.mainAd.longitude = Number(location.lon);

    this.mainAd.place_name =
      location.name ||
      location.city ||
      this.mainAd.place_name;

    this.mainAd.location_source = 'google';
  }

  onAddressTyping(): void {
    if (
      !this.mainAd.full_address ||
      this.mainAd.full_address.trim().length < 5
    ) {
      return;
    }

    clearTimeout(this.typingTimer);

    this.typingTimer = setTimeout(() => {
      this.triggerAutoGeocode();
    }, 700);
  }

  async triggerAutoGeocode(): Promise<void> {
    const query =
      this.mainAd.full_address?.trim();

    if (!query || query.length < 5) {
      return;
    }

    try {
      const results =
        await this.locationSearchService.searchLocations(query);

      if (
        !Array.isArray(results) ||
        results.length === 0
      ) {
        return;
      }

      const item = results[0];

      if (!item) {
        return;
      }

      this.mainAd.latitude = Number(item.lat);
      this.mainAd.longitude = Number(item.lon);

      this.mainAd.full_address =
        item.displayName || this.mainAd.full_address;

      this.mainAd.country =
        item.country || this.mainAd.country;

      this.mainAd.state =
        item.state || this.mainAd.state;

      this.mainAd.district =
        item.city || this.mainAd.district;

      this.mainAd.area =
        item.displayName || this.mainAd.area;

      this.mainAd.place_name =
        item.name ||
        item.city ||
        this.mainAd.place_name;

      this.mainAd.location_source = 'google';

      this.selectedMapLocation = {
        placeId: item.placeId ?? '',
        displayName: item.displayName ?? '',
        lat: Number(item.lat),
        lon: Number(item.lon),
        name: item.name ?? '',
        city: item.city || '',
        state: item.state || '',
        country: item.country || '',
        postalCode: item.postalCode || ''
      };
    } catch (error) {
      console.error(
        'Auto geocode error:',
        error
      );
    }
  }

  confirmLocation(): void {
    if (!this.mainAd.full_address?.trim()) {
      this.showAlert('Please enter full address');
      return;
    }

    if (
      this.mainAd.latitude == null ||
      this.mainAd.longitude == null
    ) {
      this.showAlert(
        'Please move pin or select location on map'
      );

      return;
    }

    this.showAlert(
      'Location confirmed',
      'success'
    );
  }

  private validateForm(): boolean {
    if (!this.mainAd.title.trim()) {
      this.showAlert('Enter title', 'error');
      return false;
    }

    if (!this.mainAd.description.trim()) {
      this.showAlert('Enter description');
      return false;
    }

    if (!this.mainAd.category) {
      this.showAlert('Select category');
      return false;
    }

    if (!this.mainAd.subcategory) {
      this.showAlert('Select subcategory');
      return false;
    }

    if (
      this.mainAd.contactphone &&
      !/^\d{10}$/.test(this.mainAd.contactphone)
    ) {
      this.showAlert(
        'Phone number must be exactly 10 digits'
      );

      return false;
    }

    if (
      this.mainAd.whatsappnumber &&
      !/^\d{10}$/.test(this.mainAd.whatsappnumber)
    ) {
      this.showAlert(
        'WhatsApp number must be exactly 10 digits'
      );

      return false;
    }

    return true;
  }

  private async buildCatalogDraft(): Promise<any[]> {
    if (this.adType !== 'service') {
      return [];
    }

    const catalog: any[] = [];

    for (const block of this.serviceBlocks) {
      let imageUrl = '';

      if (block.image) {
        const uploaded = await this.uploadToR2(
          block.image,
          'service-catalog'
        );

        if (uploaded) {
          imageUrl = uploaded;
        }
      }

      catalog.push({
        title: block.title?.trim() || '',
        price: block.price ?? null,
        image: imageUrl
      });
    }

    return catalog;
  }

  async submitByType(
    flowType: 'normal' | 'featured' = 'normal'
  ): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    if (!this.isEditMode && !this.validateForm()) {
      return;
    }

    if (!this.isEditMode && flowType === 'featured') {
      this.showAlert(
        'Please post your product or service first. After posting, you can feature the ad later.'
      );

      return;
    }

    this.isSubmitting = true;

    try {
     const isAdminEditing = !!this.adminEditPostId;

const isAdminPosting =
  !!this.adminUser || isAdminEditing;

const token = localStorage.getItem(
  isAdminPosting ? 'adminToken' : 'token'
);

const user = this.adminUser
  ? this.adminUser.rawUser || this.adminUser
  : isAdminEditing
    ? {}
    : JSON.parse(localStorage.getItem('user') || '{}');

const effectiveUserId = String(
  this.adminUser
    ? this.adminUser._id || this.adminUser.id || ''
    : user._id || ''
);

if (!token) {
  this.showAlert(
    isAdminPosting
      ? 'Admin session expired. Please log in again.'
      : 'Please login first',
    'error'
  );

  if (!isAdminPosting) {
    this.router.navigate(['/login']);
  }

  return;
}

if (!this.isEditMode && !effectiveUserId) {
  this.showAlert('Selected user id not found', 'error');
  return;
}
      

      const selectedCategory = this.categories.find(
        category =>
          category.categoryName === this.mainAd.category
      );

      const selectedSubcategory =
        this.subcategoriesList.find(
          subcategory =>
            subcategory.subcategoryName === this.mainAd.subcategory
        );

      if (!selectedCategory || !selectedSubcategory) {
        this.showAlert(
          'Please select a valid category and subcategory before continuing.',
          'error'
        );

        return;
      }

      // EDIT EXISTING POST
      if (this.isEditMode && this.editPostId) {
        const finalType =
          this.lockedAdType || this.adType;

        let updatedMainImageUrl =
          this.existingMainImageUrl;

        if (this.mainAd.mainPhoto) {
          const uploaded = await this.uploadToR2(
            this.mainAd.mainPhoto,
            'products'
          );

          if (uploaded) {
            updatedMainImageUrl = uploaded;
          }
        }

        let updatedOtherImageUrls = [
          ...this.existingImageUrls
        ];

        if (this.mainAd.otherImages.length > 0) {
          const uploadedOthers =
            await this.uploadMultipleToR2(
              this.mainAd.otherImages,
              'products'
            );

          updatedOtherImageUrls = [
            ...updatedOtherImageUrls,
            ...uploadedOthers
          ];
        }

        let updatedVideoUrls = [
          ...this.existingVideoUrls
        ];

        if (this.mainAd.videos.length > 0) {
          const uploadedVideos =
            await this.uploadMultipleToR2(
              this.mainAd.videos,
              'videos'
            );

          updatedVideoUrls = [
            ...updatedVideoUrls,
            ...uploadedVideos
          ];
        }

        const updatePayload: any = {
          categoryId: selectedCategory._id,
          subcategoryId: selectedSubcategory._id,

          title: this.mainAd.title.trim(),
          description: this.mainAd.description.trim(),
          price: this.mainAd.price ?? 0,
          currencycode: 'INR',

          adtype: finalType,
          conditiontype: finalType,

          contactphone:
            this.mainAd.contactphone || '',

          whatsappnumber:
            this.mainAd.whatsappnumber || '',

          category: this.mainAd.category || '',
          subcategory: this.mainAd.subcategory || '',

          location: {
            address: this.mainAd.full_address || '',
            city: this.mainAd.district || '',
            state: this.mainAd.state || '',
            country: this.mainAd.country || 'India',
            pincode: '',
            latitude: this.mainAd.latitude,
            longitude: this.mainAd.longitude
          },

          address: this.mainAd.full_address,
          latitude: this.mainAd.latitude,
          longitude: this.mainAd.longitude,
          full_address: this.mainAd.full_address,
          place_name: this.mainAd.place_name,
          location_source: this.mainAd.location_source,

          country: this.mainAd.country,
          state: this.mainAd.state,
          district: this.mainAd.district,
          area: this.mainAd.area,

       image_url: updatedMainImageUrl || '',
image_urls: updatedOtherImageUrls,

images: Array.from(
  new Set(
    [
      updatedMainImageUrl,
      ...updatedOtherImageUrls
    ].filter(Boolean)
  )
),

video_url: updatedVideoUrls[0] || '',
video_urls: updatedVideoUrls,
videos: updatedVideoUrls,

          catalog:
            finalType === 'service'
              ? await this.buildCatalogDraft()
              : [],

          custom_fields: {
            country: this.mainAd.country,
            state: this.mainAd.state,
            district: this.mainAd.district,
            area: this.mainAd.area,
            full_address: this.mainAd.full_address,
            latitude: this.mainAd.latitude,
            longitude: this.mainAd.longitude,
            place_name: this.mainAd.place_name
          }
        };

        localStorage.setItem(
          'edit_post_payload',
          JSON.stringify({
            postId: this.editPostId,
            payload: updatePayload,
            flow: 'edit'
          })
        );

        await this.router.navigate(
          [
            isAdminPosting
              ? '/admin/post-custom-fields'
              : '/custom-fields'
          ],
          {
            state: {
              postId: this.editPostId,

              categoryId:
                String(selectedCategory._id),

              categoryName:
                this.mainAd.category,

              subcategoryId:
                String(selectedSubcategory._id),

              subcategoryName:
                this.mainAd.subcategory,

              listingType:
                this.lockedAdType || this.adType,

              type:
                this.lockedAdType || this.adType,
flow: 'edit',
isAdminPosting,
selectedUser:
  this.adminUser?.rawUser ||
  this.adminUser ||
  null
              
            }
          }
        );

        return;
      }

      // CREATE NEW POST
      let mainImageUrl = '';
      let otherImageUrls: string[] = [];
      let videoUrls: string[] = [];

      if (this.mainAd.mainPhoto) {
        const uploaded = await this.uploadToR2(
          this.mainAd.mainPhoto,
          'products'
        );

        if (uploaded) {
          mainImageUrl = uploaded;
        }
      }

      if (this.mainAd.otherImages.length > 0) {
        otherImageUrls =
          await this.uploadMultipleToR2(
            this.mainAd.otherImages,
            'products'
          );
      }

      if (this.mainAd.videos.length > 0) {
        videoUrls =
          await this.uploadMultipleToR2(
            this.mainAd.videos,
            'videos'
          );
      }

      const rawPayload: any = {
        sellerId: String(effectiveUserId),

        categoryId: selectedCategory._id,
        subcategoryId: selectedSubcategory._id,

        title: this.mainAd.title.trim(),
        description: this.mainAd.description.trim(),
        price: this.mainAd.price ?? 0,
        currencycode: 'INR',

        adtype: this.adType,
        conditiontype: this.adType,
        listingType: this.adType,

        status: 'Processing',
        isfeatured: false,
        is_featured: false,
        featured_plan_id: null,
        featured_plan_name: null,
        isactive: false,

        contactname:
          this.adminUser?.name ||
          user.fullName ||
          '',

        contactphone:
          this.adminUser?.phone ||
          this.mainAd.contactphone ||
          '',

        contactemail:
          this.adminUser?.email ||
          user.email ||
          '',

        whatsappnumber:
          this.adminUser?.phone ||
          this.mainAd.whatsappnumber ||
          '',

        image_url: mainImageUrl,
        image_urls: otherImageUrls,
        video_url: videoUrls[0] || '',
        video_urls: videoUrls,

        category: this.mainAd.category || '',
        subcategory: this.mainAd.subcategory || '',

        location: {
          address:
            this.mainAd.full_address?.trim() || '',

          city:
            this.mainAd.district?.trim() || '',

          state:
            this.mainAd.state?.trim() || '',

          country:
            this.mainAd.country || 'India',

          pincode:
            this.selectedMapLocation?.postalCode || '',

          latitude: this.mainAd.latitude,
          longitude: this.mainAd.longitude
        },

        address: this.mainAd.full_address,
        latitude: this.mainAd.latitude,
        longitude: this.mainAd.longitude,
        full_address: this.mainAd.full_address,
        place_name: this.mainAd.place_name,
        location_source: this.mainAd.location_source,

        country: this.mainAd.country,
        state: this.mainAd.state,
        district: this.mainAd.district,
        area: this.mainAd.area,

        catalog: await this.buildCatalogDraft(),

        custom_fields: {
          country: this.mainAd.country,
          state: this.mainAd.state,
          district: this.mainAd.district,
          area: this.mainAd.area,
          full_address: this.mainAd.full_address,
          latitude: this.mainAd.latitude,
          longitude: this.mainAd.longitude,
          place_name: this.mainAd.place_name
        }
      };

      this.postDraftService.setDraft({
        rawPost: rawPayload,
        mainPhoto: this.mainAd.mainPhoto,
        otherImages: this.mainAd.otherImages,
        videos: this.mainAd.videos,
        serviceBlocks: this.serviceBlocks,
        flowType: 'normal',
        postId: null,
        userId: String(effectiveUserId)
      });

      if (this.isBrowser()) {
        localStorage.setItem(
          'pending_post_payload',
          JSON.stringify(rawPayload)
        );

        localStorage.setItem(
          'pending_service_catalog_payload',
          JSON.stringify(this.buildCatalogDraft())
        );

        localStorage.setItem(
          'pending_post_flow',
          'normal'
        );

        localStorage.setItem(
          'pending_post_type',
          this.adType
        );

        localStorage.setItem(
          'pending_post_userid',
          String(effectiveUserId)
        );
      }

      // Admin posts stay inside the admin layout.
      await this.router.navigate(
        [
          isAdminPosting
            ? '/admin/post-custom-fields'
            : '/custom-fields'
        ],
        {
          state: {
            categoryId: selectedCategory._id,
            categoryName: this.mainAd.category,

            subcategoryId: selectedSubcategory._id,
            subcategoryName: this.mainAd.subcategory,

            listingType: this.adType,
            type: this.adType,

            flow: 'normal',

            isAdminPosting,

            selectedUser:
              this.adminUser?.rawUser ||
              this.adminUser ||
              null
          }
        }
      );
    } catch (error) {
      console.error(
        'Error preparing post:',
        error
      );

this.showAlert(
  (error as any)?.error?.message ||
  (error as any)?.message ||
  'Error preparing post',
  'error'
);
    } finally {
      this.isSubmitting = false;

      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    }
  }

  goBack(): void {
    this.location.back();
  }
}