import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../../services/api.service';

interface LocationData {
  state: string;
  districts: { name: string; areas: string[] }[];
}

@Component({
  selector: 'app-post-ad',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './post-ad.html',
  styleUrls: ['./post-ad.css']
})
export class PostAd implements OnInit {

 constructor(
  private router: Router,
  private apiService: ApiService
) {}

  // ---------------- Ad fields ----------------
  adTitle = '';
  category = '';
  subcategory = '';
  description = '';
  price: number | null = null;

  // ---------------- Location ----------------
  country = 'India';
  state: string | null = null;
  district: string | null = null;
  area: string | null = null;

  states: string[] = [];
  districts: string[] = [];
  areas: string[] = [];

  locationData: LocationData[] = [
    {
      state: 'Tamil Nadu',
      districts: [
        { name: 'Chennai', areas: ['Adyar','Velachery','T Nagar'] },
        { name: 'Coimbatore', areas: ['RS Puram','Peelamedu'] }
      ]
    }
  ];

  // ---------------- Categories ----------------
  categories: Record<string,string[]> = {
    Services:['Plumbing','Electrician'],
    Vehicles:['Cars','Bikes'],
    Electronics:['Mobiles','Laptops']
  };

  // ---------------- Media ----------------
  mainImage: File | null = null;
  additionalImages: File[] = [];
  video: File | null = null;

  mainImagePreview: string | null = null;
  additionalImagePreviews: string[] = [];
  videoPreview: string | null = null;

  ngOnInit() {
    this.states = this.locationData.map(x => x.state);
  }

  // ---------------- Location Change ----------------
  onStateChange() {
    const selected = this.locationData.find(x => x.state === this.state);
    this.districts = selected ? selected.districts.map(d => d.name) : [];
    this.district = null;
    this.areas = [];
  }

  onDistrictChange() {
    const stateData = this.locationData.find(x => x.state === this.state);
    const districtData = stateData?.districts.find(d => d.name === this.district);
    this.areas = districtData ? districtData.areas : [];
  }

  get categoryList() {
    return Object.keys(this.categories);
  }

  get subcategoryList() {
    return this.categories[this.category] || [];
  }

  onCategoryChange() {
    this.subcategory = '';
  }

  // ---------------- Media Handling ----------------
  onMainImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.mainImage = file;
      this.mainImagePreview = URL.createObjectURL(file);
    }
  }

  removeMainImage() {
    this.mainImage = null;
    this.mainImagePreview = null;
  }

  onAdditionalImagesSelected(event: any) {
    const files = Array.from(event.target.files || []) as File[];
    files.forEach(file => {
      this.additionalImages.push(file);
      this.additionalImagePreviews.push(URL.createObjectURL(file));
    });
  }

  removeAdditionalImage(i: number) {
    this.additionalImages.splice(i,1);
    this.additionalImagePreviews.splice(i,1);
  }

  onVideoSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.video = file;
      this.videoPreview = URL.createObjectURL(file);
    }
  }

  // ---------------- Submit Ad ----------------
  submitAd() {

  const token = localStorage.getItem('token');

  if(!token){
    alert("Please login first");
    this.router.navigate(['/login']);
    return;
  }


  if(!this.adTitle){
    alert("Title required");
    return;
  }


  const postData = {

    title:this.adTitle,

    categoryId:this.category,

    subcategoryId:this.subcategory || null,

    listingType:"product",

    description:this.description,

    price:this.price || 0,


    location:{
      country:this.country,
      state:this.state || "",
      city:this.district || "",
      address:this.area || ""
    },


    images:[],
    videos:[]


  };


  this.apiService
  .post(
    '/posts',
    postData
  )
  .subscribe({

    next:(res:any)=>{

      console.log(
        "POST CREATED",
        res
      );


      alert(
        "Ad Posted Successfully"
      );


      this.router.navigate([
        '/my-posts'
      ]);

    },


    error:(err:any)=>{

      console.error(
        "POST ERROR",
        err
      );


      alert(
        err.error?.message ||
        "Post failed"
      );

    }


  });


}
}
