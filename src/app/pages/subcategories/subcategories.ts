import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
// import { ApiService } from '../../services/api.service';


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
  private supabaseService: SupabaseService
){}



  ngOnChanges(changes: SimpleChanges): void {


    if(
      changes['selectedCategory'] &&
      this.selectedCategory
    ){

      this.loadSubcategories();

    }

  }


async loadSubcategories(){
  const categoryId =
    this.selectedCategory?.categoryid;
  if(!categoryId){
    return;
  }
  this.isLoading = true;
  try {
   const data =
await this.supabaseService
.getSubcategoriesByCategory(categoryId);
    console.log(
      "SUBCATEGORIES:",
      data
    );
    this.subcategories =
    data || [];
  }
  catch(error){

    console.error(
      "Subcategory error",
      error
    );
    this.subcategories=[];
  }
  finally{

    this.isLoading=false;

  }

}



  selectSubcategory(sub:any){


    this.subcategorySelected.emit(sub);


  }

backToCategories(){

  this.back.emit();

}

}