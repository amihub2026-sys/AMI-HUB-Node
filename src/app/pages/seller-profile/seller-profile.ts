import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  ApiService
} from '../../services/api.service';

import {
  SnackbarService
} from '../../services/snackbar.service';


@Component({
  selector: 'app-seller-profile',
  standalone:true,
  imports:[
    CommonModule,
    FormsModule
  ],
  templateUrl:'./seller-profile.html',
  styleUrls:['./seller-profile.css']
})
export class SellerProfileComponent implements OnInit, OnDestroy {


private platformId = inject(PLATFORM_ID);


seller:any = {

  name:'',
  email:'',
  phone:'',
  username:'',
  password:'',

  accountType:'',
  category:'',

  profileImage:null,
  kycImage:null,
  qrCodeImage:null,

  rating:4,
  verified:false,
  termsAccepted:false

};


stars=[1,2,3,4,5];


accountTypes=[
  'Individual',
  'Business'
];


categories=[
  'Electronics',
  'Fashion',
  'Home & Living',
  'Automotive'
];


redirectTo='';

isLoading=false;

isEditMode=false;

showPassword=false;



constructor(
 private router:Router,
 private apiService:ApiService,
 private cdr:ChangeDetectorRef,
 private snackbar:SnackbarService
){}



ngOnInit(){

 if(!this.isBrowser()){
   return;
 }

 const nav =
 this.router.getCurrentNavigation();

 if(nav?.extras?.state){

  this.redirectTo =
  nav.extras.state['next'] || '';

 }


 this.loadSellerProfile();

}



ngOnDestroy(){

}



private isBrowser(){

 return isPlatformBrowser(
   this.platformId
 );

}



get submitButtonText(){

 return this.isEditMode
 ? 'Edit Profile'
 : 'Create Profile';

}



togglePassword(){

 this.showPassword =
 !this.showPassword;

}





loadSellerProfile(){

 this.isLoading=true;


 this.apiService
 .get('/profile/me')
 .subscribe({

 next:(res:any)=>{


 const profile=res.data;


 this.seller={


  name:profile.fullName || '',

  email:profile.email || '',

  phone:profile.mobile || '',

  username:profile.username || '',

  password:profile.password || '',


  accountType:
  profile.accountType || '',


  category:
  profile.category || '',


  profileImage:
  profile.profileImage || null,


  kycImage:
  profile.kycImage || null,


  qrCodeImage:
  profile.qrCodeImage || null,


  rating:
  profile.rating || 4,


  verified:
  profile.verified || false,


  termsAccepted:
  profile.termsAccepted || false


 };


 this.isEditMode=true;


 this.isLoading=false;

 this.cdr.detectChanges();


 },


 error:(err)=>{


 console.log(
 "No profile found"
 );


 this.isEditMode=false;


 this.isLoading=false;


 this.cdr.detectChanges();


 }


 });


}





uploadProfileImage(event:Event){

const input =
event.target as HTMLInputElement;


if(!input.files?.length)
return;


const file=input.files[0];


const reader=new FileReader();


reader.onload=()=>{

this.seller.profileImage =
reader.result;


this.cdr.detectChanges();

};


reader.readAsDataURL(file);


}





uploadKYC(event:Event){

const input =
event.target as HTMLInputElement;


if(!input.files?.length)
return;


const file=input.files[0];


const reader=new FileReader();


reader.onload=()=>{

this.seller.kycImage =
reader.result;


this.cdr.detectChanges();

};


reader.readAsDataURL(file);


}





uploadQR(event:Event){

const input =
event.target as HTMLInputElement;


if(!input.files?.length)
return;


const file=input.files[0];


const reader=new FileReader();


reader.onload=()=>{

this.seller.qrCodeImage =
reader.result;


this.cdr.detectChanges();

};


reader.readAsDataURL(file);


}





removeProfileImage(){

this.seller.profileImage=null;

}





submitProfile(){


if(!this.seller.termsAccepted){

 this.showMessage(
 'Accept Terms',
 'info'
 );

 return;

}



if(
 this.seller.phone &&
 !/^\d{10}$/.test(this.seller.phone)
){

 this.showMessage(
 'Phone number must be exactly 10 digits',
 'error'
 );

 return;

}



this.isLoading=true;



const payload={


fullName:
this.seller.name,


email:
this.seller.email,


mobile:
this.seller.phone,


username:
this.seller.username,


password:
this.seller.password,


accountType:
this.seller.accountType,


category:
this.seller.category,


profileImage:
this.seller.profileImage,


kycImage:
this.seller.kycImage,


qrCodeImage:
this.seller.qrCodeImage,


termsAccepted:
this.seller.termsAccepted


};




const request = this.isEditMode

?

this.apiService.put(
 '/profile/me',
 payload
)

:

this.apiService.post(
 '/profile',
 payload
);





request.subscribe({

next:(res:any)=>{


console.log(
"PROFILE SAVED",
res
);


this.isLoading=false;

this.isEditMode=true;


this.showMessage(
'Profile saved successfully',
'success'
);



if(this.redirectTo==='post-product'){

this.router.navigate(['/post-ad']);

}

else if(this.redirectTo==='post-service'){

this.router.navigate(['/service']);

}

else{

this.router.navigate(['/']);

}


},


error:(err)=>{


console.error(
"PROFILE ERROR",
err
);


this.isLoading=false;


this.showMessage(
'Failed to save profile',
'error'
);


}


});

}





private showMessage(
message:string,
type:'success'|'error'|'info'='info'
){

this.snackbar.show(
message,
type
);

}




goBack(event:Event){

event.preventDefault();

event.stopPropagation();

this.router.navigateByUrl('/home');

}


}
