import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';


@Component({
  selector: 'app-subcategories',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './subcategories.html',

  styleUrl: './subcategories.css'
})
export class Subcategories implements OnChanges {
  @Input() selectedCategory:any;
 @Output()
subcategorySelected =
new EventEmitter<any>();


@Output()
back =
new EventEmitter<void>();

  subcategories:any[] = [];
  isLoading = false;
constructor(
  private api: ApiService
){}



  ngOnChanges(changes: SimpleChanges): void {


    if(
      changes['selectedCategory'] &&
      this.selectedCategory
    ){

      this.loadSubcategories();

    }

  }


loadSubcategories(){

  const categoryId =
  this.selectedCategory?._id;


  if(!categoryId){
    return;
  }


  this.isLoading = true;


  this.api.get<any>(
    `/subcategories/category/${categoryId}`
  )
  .subscribe({

    next:(res)=>{

      console.log(
        "MONGO SUBCATEGORIES:",
        res
      );


      this.subcategories =
      (res.data || [])
      .map((item:any)=>({

        ...item,

        // keep old html names
        subcategoryname:
        item.subcategoryName,

        iconurl:
        item.icon

      }));


      this.isLoading=false;

    },


    error:(err)=>{

      console.error(
        "SUBCATEGORY ERROR:",
        err
      );


      this.subcategories=[];

      this.isLoading=false;

    }

  });

}

  selectSubcategory(sub:any){


    this.subcategorySelected.emit(sub);


  }

backToCategories(){

  this.back.emit();

}

}