import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SearchResults } from '../search-results/search-results';
import { Category } from '../categories/categories';
import { Subcategories } from '../subcategories/subcategories';
import { Filters } from '../filters/filters';
import { Router } from '@angular/router';

interface CategoryItem {
  _id?: string;
  categoryid: string;
  categoryname: string;
  category_type?: string | null;
  isactive?: boolean | null;
  sortorder?: number | null;
}

@Component({
  selector: 'app-service-list',
  standalone: true,

imports: [
  CommonModule,
  RouterModule,
  Filters,
  Category,
  Subcategories, SearchResults
],

  templateUrl: './service-list.html',
  styleUrl: './service-list.css'
})
export class ServiceList {
showSubcategories = false;

selectedCategory: any = null;
  isFilterOpen = false;
  services: any[] = [];
isLoading = false;

filteredServices: any[] = [];

isLoadingServices = false;
onCategorySelected(category: any): void {

  console.log(
    'Selected Service Category:',
    category
  );

  this.selectedCategory = category;
  this.showSubcategories = true;

  const selectedCategoryId =
    String(
      category?._id ||
      category?.categoryid ||
      category?.id ||
      ''
    );

  if (!selectedCategoryId) {
    this.filteredServices = [
      ...this.services
    ];

    return;
  }

  this.filteredServices =
    this.services.filter((service: any) => {

      const serviceCategoryId =
        String(
          service?.categoryId?._id ||
          service?.categoryId ||
          ''
        );

      return (
        serviceCategoryId ===
        selectedCategoryId
      );
    });
}
private readonly apiUrl = environment.apiUrl;

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilter(): void {
    this.isFilterOpen = false;
  }

onFiltersApplied(filters: any): void {

  const searchText =
    String(filters?.searchText || '')
      .trim()
      .toLowerCase();

  const selectedCategoryId =
    String(filters?.selectedCategoryId || '');

  const minPrice =
    Number(filters?.minPrice || 0);

  const maxPrice =
    Number(filters?.maxPrice || 0);

  const locationText =
    String(filters?.locationText || '')
      .trim()
      .toLowerCase();

  this.filteredServices =
    this.services.filter((service: any) => {

      const title =
        String(
          service?.title ||
          service?.displayTitle ||
          ''
        ).toLowerCase();

      const description =
        String(
          service?.description ||
          service?.serviceDescription ||
          ''
        ).toLowerCase();

      const categoryId =
        String(
          service?.categoryId?._id ||
          service?.categoryId ||
          ''
        );

      const subcategoryId =
        String(
          service?.subcategoryId?._id ||
          service?.subcategoryId ||
          ''
        );

      const price =
        Number(
          service?.price ||
          service?.displayPrice ||
          0
        );

      const location =
        [
          service?.location?.address,
          service?.location?.area,
          service?.location?.city,
          service?.location?.district,
          service?.location?.state,
          service?.displayLocation
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        description.includes(searchText);

      const matchesCategory =
        !selectedCategoryId ||
        categoryId === selectedCategoryId ||
        subcategoryId === selectedCategoryId;

      const matchesMinPrice =
        !minPrice ||
        price >= minPrice;

      const matchesMaxPrice =
        !maxPrice ||
        price <= maxPrice;

      const matchesLocation =
        !locationText ||
        location.includes(locationText);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesLocation
      );
    });

  this.isFilterOpen = false;
}


onFiltersReset(): void {

  this.filteredServices = [
    ...this.services
  ];

  this.isFilterOpen = false;
}
constructor(
  private router: Router,
  private http: HttpClient,
  private cdr: ChangeDetectorRef
) {}

viewService(service: any): void {
  const id =
    service?._id ||
    service?.postid ||
    service?.id;

  if (!id) {
    console.error(
      'Service ID missing:',
      service
    );

    return;
  }

  this.router.navigate([
    '/details',
    id
  ]);
}
ngOnInit(): void {
  this.loadServices();
}


async loadServices(): Promise<void> {
  this.isLoadingServices = true;

  try {
    const response: any = await this.http
      .get<any>(
        `${this.apiUrl}/posts?listingType=service`
      )
      .toPromise();

    const services =
      this.extractServiceArray(response);

    this.services = services.map(
      (service: any) => ({
        ...service,

        postid:
          service?._id ||
          service?.postid ||
          '',

        mainImage:
          this.getServiceImage(service),

        displayTitle:
          service?.title ||
          'Untitled Service',

        displayCategory:
          service?.subcategoryId?.subcategoryName ||
          service?.categoryId?.categoryName ||
          service?.category ||
          'Service',

        displayPrice:
          Number(service?.price || 0),

        displayLocation:
          [
            service?.location?.city,
            service?.location?.state
          ]
            .filter(Boolean)
            .join(', ') ||
          service?.location?.address ||
          'Location',

        displayType: 'service'
      })
    );

    this.filteredServices = [
      ...this.services
    ];

    console.log(
      'Mongo service data:',
      this.services
    );
  } catch (error) {
    console.error(
      'Error loading Mongo services:',
      error
    );

    this.services = [];
    this.filteredServices = [];
  } finally {
    this.isLoadingServices = false;
    this.cdr.detectChanges();
  }
}

getServiceImage(service: any): string {

  if (
    Array.isArray(service?.images) &&
    service.images.length > 0
  ) {
    return this.getMediaUrl(service.images[0]);
  }

  if (service?.image_url) {
    return this.getMediaUrl(service.image_url);
  }

  return 'assets/images/no-image.png';
}
private getMediaUrl(url: string): string {

  if (!url) {
    return 'assets/images/no-image.png';
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  const backendUrl =
    this.apiUrl.replace('/api', '');

  return `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
}
getServiceTitle(service: any): string {
  return (
    service?.displayTitle ||
    service?.title ||
    'Untitled Service'
  );
}


getServiceCategory(service: any): string {
  return (
    service?.displayCategory ||
    service?.category ||
    'Service'
  );
}

getServiceLocation(service: any): string {

  const city =
    service?.location?.city || '';

  const state =
    service?.location?.state || '';

  const address =
    service?.location?.address || '';

  return (
    [city, state]
      .filter(Boolean)
      .join(', ') ||
    address ||
    service?.displayLocation ||
    'Location'
  );

}

getServicePrice(service: any): number {
  return Number(
    service?.displayPrice ??
    service?.price ??
    0
  );
}


openServiceDetails(service: any): void {
const serviceId =
  service?._id ||
  service?.postid ||
  service?.id;

  if (!serviceId) {
    console.error(
      'Service ID missing:',
      service
    );

    return;
  }

this.router.navigate([
  '/details',
  serviceId
]);
}


onServiceImageError(event: Event): void {
  const image =
    event.target as HTMLImageElement;

  image.src =
    'assets/images/no-image.png';
}


trackByService(
  index: number,
  service: any
): string {
  return String(
    service?._id ||
    service?.postid ||
    service?.id ||
    index
  );
}

private extractServiceArray(response: any): any[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.posts)) {
    return response.posts;
  }

  if (Array.isArray(response?.services)) {
    return response.services;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.posts)) {
    return response.data.posts;
  }

  if (Array.isArray(response?.data?.services)) {
    return response.data.services;
  }

  return [];
}

onSubcategorySelected(subcategory: any): void {

  console.log(
    'Selected Service Subcategory:',
    subcategory
  );

  const selectedSubcategoryId =
    String(
      subcategory?._id ||
      subcategory?.subcategoryid ||
      subcategory?.id ||
      ''
    );

  if (!selectedSubcategoryId) {
    return;
  }

  this.filteredServices =
    this.services.filter((service: any) => {

      const serviceSubcategoryId =
        String(
          service?.subcategoryId?._id ||
          service?.subcategoryId ||
          ''
        );

      return (
        serviceSubcategoryId ===
        selectedSubcategoryId
      );
    });
}


onSubcategoryBack(): void {

  this.showSubcategories = false;
  this.selectedCategory = null;

  this.filteredServices = [
    ...this.services
  ];
}

}