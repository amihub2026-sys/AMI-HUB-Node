import {
  Component,
  ElementRef,
  ViewChild,
  signal,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';


@Component({
  selector:'app-categories',
  standalone:true,
  imports:[
    CommonModule
  ],
templateUrl: './categories.html',
styleUrls: ['./categories.css']
})
export class Category implements OnInit {
  @ViewChild('categorySlider')
  categorySlider!: ElementRef<HTMLDivElement>;
  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ){}
  // CATEGORY DATA

  browseCategories = signal<any[]>([]);

  productCategories = signal<any[]>([]);

  serviceCategories = signal<any[]>([]);

  isCategoriesLoading = signal(false);
  ngOnInit(){

    this.loadBrowseCategories();

  }
  // LOAD CATEGORY DATA
  async loadBrowseCategories() {
    this.isCategoriesLoading.set(true);
    try {
      const data =
      await this.supabaseService.getAllBrowseCategories();
      const allCategories =
      (data || [])
      .filter(
        (item:any)=>item?.isactive === true
      );
      this.browseCategories.set(
        allCategories
      );
      this.productCategories.set(
        allCategories.filter(
          (item:any)=>
          item.category_type === 'product'
        )

      );
      this.serviceCategories.set(
        allCategories.filter(
          (item:any)=>
          item.category_type === 'service'
        )
      );
    }
    catch(error){
      console.error(
        "Error loading categories",
        error
      );
      this.browseCategories.set([]);
      this.productCategories.set([]);
      this.serviceCategories.set([]);
    }
    finally{
      this.isCategoriesLoading.set(false);
    }
  }
  // CATEGORY IMAGE
  getCategoryImage(category:any):string {
    return (

      category?.iconurl ||

      category?.image_url ||

      'assets/icons/default.png'
    );
  }
  // CATEGORY SLIDER

  slideCategories(
    direction:'left'|'right'
  ){
    if(!this.categorySlider){
      return;
    }
    const slider =
    this.categorySlider.nativeElement;
    const scrollAmount =
    slider.clientWidth * 0.75;
    slider.scrollBy({
      left:
      direction === 'right'
      ? scrollAmount
      : -scrollAmount,
      behavior:'smooth'
    });
  }
  // OPEN CATEGORY
  openCategory(category:any){
    const categoryName =
    (
      category?.categoryname || ''
    ).toLowerCase();
    // JOB
    if(categoryName === 'job'){
      this.router.navigate(['/job']);
      return;
    }
    // SERVICE
    if(category?.category_type === 'service'){
      this.router.navigate(
        ['/service-list'],
        {
          queryParams:{
            category:
            category.categoryid
          }
        }
      );
      return;
    }
    // PRODUCT
    if(category?.category_type === 'product'){
      this.router.navigate(
        ['/products'],
        {
          queryParams:{
            category:
            category.categoryid
          }
        }
      );
      return;
    }
    // DEFAULT SEARCH
    this.router.navigate(
      ['/search'],
      {
        queryParams:{
          category:
          category.categoryid,
          type:'all'
        }
      }

    );
  }
  // IMAGE ERROR FALLBACK
  onCategoryImageError(
    event:Event
  ){
    const image =
    event.target as HTMLImageElement;
    image.src =
    'assets/category-icons/default-category.png';
  }

  // PRODUCT CATEGORY

  openProductCategory(category:any){


    this.router.navigate(

      ['/products'],

      {
        queryParams:{
          category:
          category.categoryid
        }
      }

    );


  }

  // SERVICE CATEGORY

  openServiceCategory(category:any){


    this.router.navigate(

      ['/service-list'],

      {
        queryParams:{
          category:
          category.categoryid
        }
      }

    );


  }


}