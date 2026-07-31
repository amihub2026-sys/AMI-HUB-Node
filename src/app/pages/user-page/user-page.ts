import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({

selector:'app-user-page',

standalone:true,

imports:[
  CommonModule
],

templateUrl:'./user-page.html',

styleUrls:[
 './user-page.css'
]

})


export class UserPage implements OnInit {


userId='';


user = signal<any>(null);


products = signal<any[]>([]);

services = signal<any[]>([]);

jobs = signal<any[]>([]);



loading = signal(true);


constructor(
 private route:ActivatedRoute,
 private router:Router,
 private api:ApiService
){}
ngOnInit(){

this.userId =
this.route.snapshot.paramMap.get('id') || '';


this.loadUserPage();


}

async loadUserPage(){

try{

this.loading.set(true);


this.api
.get<any>(
 `/posts/seller/${this.userId}`
)
.subscribe({

next:(res:any)=>{


const posts = res.data || [];


if(posts.length){


const firstPost = posts[0];


// USER DETAILS

this.user.set({

name:
firstPost.sellerId?.fullName ||
'User',


phone:
firstPost.sellerId?.mobile ||
'',


email:
firstPost.sellerId?.email ||
'',


address:
firstPost.customFields?.full_address ||
'Location not available',


image:
firstPost.sellerId?.image ||
'assets/icons/user.png'

});



// PRODUCTS

this.products.set(

posts.filter((p:any)=>

p.listingType === 'product'

)

);



// SERVICES

this.services.set(

posts.filter((p:any)=>

p.listingType === 'service'

)

);



// JOBS

this.jobs.set(

posts.filter((p:any)=>

p.listingType === 'job'

)

);


}


this.loading.set(false);


},


error:(err)=>{

console.log(
"SELLER POSTS ERROR",
err
);

this.loading.set(false);

}


});


}

catch(err){

console.log(err);

this.loading.set(false);

}


}
callUser(){

window.location.href=
'tel:'+this.user()?.phone;

}



whatsapp(){

window.open(
'https://wa.me/'+this.user()?.phone,
'_blank'
);

}



openPost(id:any){

this.router.navigate([
'/post-view',
id
]);

}



}