import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { supabase } from '../../../supabaseClient';
import { SupabaseService } from '../../services/supabase.service';
import { SearchResults } from '../search-results/search-results';
import { Category } from '../categories/categories';
import { Subcategories } from '../subcategories/subcategories';
import { Filters } from '../filters/filters';
import { Router } from '@angular/router';

interface CategoryItem {
  categoryid: number;
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
onCategorySelected(category:any){

  console.log(
    "Selected Service Category",
    category
  );

  this.selectedCategory = category;

  this.showSubcategories = true;

}

private readonly apiUrl = environment.apiUrl;

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilter(): void {
    this.isFilterOpen = false;
  }

  onFiltersApplied(filters: any): void {
    console.log('Service filters:', filters);
  }

  onFiltersReset(): void {
    console.log('Service filters reset');
  }

constructor(
  private router: Router,
  private supabaseService: SupabaseService
) {}

viewService(service: any): void {
  const id = service?._id || service?.id;

  if (!id) {
    return;
  }

  this.router.navigate(['/post-view', id]);
}
ngOnInit(): void {
  this.loadServices();
}


async loadServices(): Promise<void> {
  this.isLoadingServices = true;

  try {
    const { data, error } = await supabase
      .from('post')
      .select(`
        postid,
        title,
        description,
        price,
        location,
        areaid,
        cityid,
        image_url,
        image_urls,
        category,
        categoryid,
        subcategoryid,
        adtype,
        isactive,
        status,
        createdon
      `)
      .eq('adtype', 'service')
      .eq('isactive', true)
      .eq('status', 'Active')
      .order('createdon', {
        ascending: false
      });

    if (error) {
      throw error;
    }

    console.log('SERVICE DATA:', data);

    this.services = (data || []).map(
      (service: any) => ({
        ...service,

        mainImage: this.getServiceImage(service),

        displayTitle:
          service?.title ||
          'Untitled Service',

        displayCategory:
          service?.category ||
          'Service',

        displayPrice:
          Number(service?.price || 0),

        displayLocation:
          service?.location ||
          'Location',

        displayType: 'service'
      })
    );

    this.filteredServices = [
      ...this.services
    ];
  } catch (error) {
    console.error(
      'Error loading services:',
      error
    );

    this.services = [];
    this.filteredServices = [];
  } finally {
    this.isLoadingServices = false;
  }
}

getServiceImage(service: any): string {
  if (
    Array.isArray(service?.image_urls) &&
    service.image_urls.length > 0
  ) {
    return service.image_urls[0];
  }

  return (
    service?.image_url ||
    'assets/images/no-image.png'
  );
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

  const location =
    service?.location ||
    service?.displayLocation ||
    '';

  if (!location) {
    return 'Location';
  }

  const parts = location.split(',');

  // show district only
  if (parts.length >= 3) {
    return parts[2].trim();
  }

  return parts[0].trim();

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
    service?.postid ||
    service?._id ||
    service?.id;

  if (!serviceId) {
    console.error(
      'Service ID missing:',
      service
    );

    return;
  }

  this.router.navigate([
    '/post-view',
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
): string | number {
  return (
    service?.postid ||
    service?._id ||
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



}