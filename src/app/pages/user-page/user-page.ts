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

showLoginPopup = false;
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


address: this.getPostLocation(firstPost),

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
get isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

onWhatsAppClick(): void {
  if (!this.isLoggedIn) {
    this.router.navigate(['/login']);
    return;
  }

  this.whatsapp();
}


getDistrict(post: any): string {
  const district =
    post?.customFields?.district ||
    post?.location?.district ||
    post?.district;

  if (typeof district === 'string' && district.trim()) {
    return district.trim();
  }

  const address = this.getPostLocation(post);

  if (address === 'Location not available') {
    return address;
  }

  // Fallback for addresses formatted as:
  // Area, District, Tamil Nadu, India
  const parts = address.split(',').map((p: string) => p.trim());

  if (parts.length >= 3) {
    return parts[parts.length - 3].replace(/\s+\d{6}$/, '');
  }

  return 'Location not available';
}

getPostLocation(post: any): string {

  const fields = post?.customFields || {};

  const fullAddress =
    fields.full_address ||
    post?.full_address ||
    post?.location?.address ||
    post?.location?.full_address ||
    post?.address;

  if (typeof fullAddress === 'string' && fullAddress.trim()) {
    return fullAddress.trim();
  }

  const city =
    fields.city ||
    post?.location?.city ||
    post?.city;

  const state =
    fields.state ||
    post?.location?.state ||
    post?.state;

  const location = [city, state]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(', ');

  return location || 'Location not available';
}
onContactClick(type: 'call' | 'whatsapp'): void {

  if (!this.isLoggedIn) {
    this.showLoginPopup = true;
    return;
  }

  if (!this.user()?.phone) {
    return;
  }

  if (type === 'call') {
    this.callUser();
  } else {
    this.whatsapp();
  }
}
}