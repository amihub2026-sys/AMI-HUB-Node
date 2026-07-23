import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { supabase } from '../../../supabaseClient';


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
 private router:Router
){}



ngOnInit(){

this.userId =
this.route.snapshot.paramMap.get('id') || '';


this.loadUserPage();


}





async loadUserPage(){


try{


this.loading.set(true);


// GET POSTS OF USER

const {data:posts,error}=

await supabase

.from('post')

.select('*')

.eq('userid',this.userId);



if(error){

console.log(error);

return;

}



if(posts && posts.length){



const firstPost = posts[0];


// USER DETAILS FROM POST


this.user.set({

name:
firstPost.contactname || 'User',


phone:
firstPost.contactphone || '',


email:
firstPost.contactemail || '',


address:
firstPost.full_address ||
firstPost.address ||
firstPost.location ||
'Location not available',


image:
firstPost.sellerImage ||
'assets/icons/user.png'


});




// PRODUCTS

this.products.set(

posts.filter((p:any)=>

String(
p.conditiontype ||
p.adtype
)
.toLowerCase()
==='product'

)

);



// SERVICES

this.services.set(

posts.filter((p:any)=>

String(
p.conditiontype ||
p.adtype
)
.toLowerCase()
==='service'

)

);



// JOBS

this.jobs.set(

posts.filter((p:any)=>

String(
p.conditiontype ||
p.adtype
)
.toLowerCase()
==='job'

)

);



}



}

catch(err){

console.log(err);

}

finally{

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