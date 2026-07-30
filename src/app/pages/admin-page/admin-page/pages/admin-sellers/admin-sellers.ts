import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../../services/api.service';


@Component({
  selector:'app-admin-sellers',
  standalone:true,
  imports:[
    CommonModule
  ],
  templateUrl:'./admin-sellers.html',
  styleUrls:['./admin-sellers.css']
})
export class AdminSellersComponent implements OnInit {

sellers:any[]=[];

selectedSeller:any = null;

isLoading=false;


constructor(
 private apiService:ApiService
){}



ngOnInit(){

 this.loadSellers();

}



loadSellers(){

this.isLoading=true;


this.apiService
.get('/admin/sellers')
.subscribe({

next:(res:any)=>{

console.log("SELLERS API RESPONSE:", res);

this.sellers = res.data || [];

console.log("SELLERS ARRAY:", this.sellers);

this.isLoading=false;

},


error:(err:any)=>{

console.log(err);

this.isLoading=false;

}

});


}
viewSeller(seller:any){

  this.selectedSeller = seller;

  console.log(
    "SELLER DETAILS:",
    this.selectedSeller
  );

}
viewSellerDetails(id:string){

  this.apiService
  .get(`/admin/sellers/${id}`)
  .subscribe({

    next:(res:any)=>{

      console.log(
        "SELLER FULL DETAILS:",
        res
      );


      this.selectedSeller = res.data;


    },

    error:(err:any)=>{

      console.log(err);

    }

  });

}
removeSeller(id:string){

  const confirmDelete = confirm(
    "Are you sure you want to remove this seller?"
  );


  if(!confirmDelete){
    return;
  }


  this.apiService
  .put(
    `/admin/sellers/${id}/remove`,
    {}
  )
  .subscribe({

    next:(res:any)=>{

      console.log(
        "REMOVE RESPONSE:",
        res
      );


      // refresh seller list

      this.loadSellers();


      // close details if removed seller selected

      this.selectedSeller = null;


    },


    error:(err:any)=>{

      console.log(
        "REMOVE ERROR:",
        err
      );

    }

  });


}
}