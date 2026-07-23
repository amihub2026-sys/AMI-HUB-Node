import {
  Component,
  ElementRef,
  ViewChild,
  signal,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Output, EventEmitter } from '@angular/core';


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
  @Output()
categorySelected = new EventEmitter<any>();
  @ViewChild('categorySlider')
  categorySlider!: ElementRef<HTMLDivElement>;
constructor(
  private router: Router,
  private api: ApiService
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
async loadBrowseCategories(){

  this.isCategoriesLoading.set(true);

  this.api.get<any>('/categories')
  .subscribe({

    next:(res)=>{

      console.log(
        "MONGO CATEGORIES:",
        res
      );

const allCategories =
(res.data || [])
.filter(
(item:any)=>
item.isActive === true
)
.map((item:any)=>({

  ...item,

  // keep old html names
  categoryname: item.categoryName,
  iconurl: item.icon,
  image_url: item.image

}));


      this.browseCategories.set(
        allCategories
      );


this.productCategories.set(
  allCategories.filter(
    (item:any)=>
    item.availableIn?.includes('product')
  )
);


this.serviceCategories.set(
  allCategories.filter(
    (item:any)=>
    item.availableIn?.includes('service')
  )
);


      this.isCategoriesLoading.set(false);

    },


    error:(err)=>{

      console.error(
        "CATEGORY LOAD ERROR:",
        err
      );


      this.browseCategories.set([]);

      this.productCategories.set([]);

      this.serviceCategories.set([]);

      this.isCategoriesLoading.set(false);

    }

  });

}
  // CATEGORY IMAGE
getCategoryImage(category:any):string {

  return (
    category?.icon ||
    category?.image ||
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
openCategory(cat:any){

  this.categorySelected.emit(cat);

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

      ['/product-list'],

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