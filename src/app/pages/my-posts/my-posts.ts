import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SnackbarService } from '../../services/snackbar.service';
@Component({
  selector: 'app-my-posts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-posts.html',
  styleUrls: ['./my-posts.css']
})
export class MyPosts implements OnInit {
  posts = signal<any[]>([]);
  isLoading = signal(true);

 constructor(
  private router: Router,
   private api: ApiService,
  private snackbar: SnackbarService   // 🔥 ADD THIS
) {}

  async ngOnInit(): Promise<void> {
    await this.loadCurrentUserPosts();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

private showAlert(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  this.snackbar.show(message, type);
}

  private showConfirm(message: string): boolean {
    if (this.isBrowser()) {
      return confirm(message);
    }
    return false;
  }
getDistrict(post: any): string {

  if (!post) {
    return '';
  }

  if (post.district) {
    return post.district;
  }

  if (post.city) {
    return post.city;
  }

  const location =
    post.location ||
    post.address ||
    '';

  if (!location) {
    return '';
  }

  const parts = location.split(',');

  return parts.length >= 2
    ? parts[parts.length - 2].trim()
    : parts[0].trim();

}
  private mergePosts(...postLists: any[][]): any[] {
    const map = new Map<any, any>();

    for (const list of postLists) {
      for (const post of list || []) {
        const key = post?._id;
        if (key != null && !map.has(key)) {
          map.set(key, post);
        }
      }
    }

    return Array.from(map.values());
  }
getDescription(post:any):string {

  if(!post){
    return 'Quality service and best products available';
  }


  return (
    post.description ||
    post.additional_description ||
    post.details ||
    post.about ||
    'Quality service and best products available'
  );

}
async loadCurrentUserPosts(): Promise<void> {

this.isLoading.set(true);

this.api.get<any>('/posts/my-posts')
.subscribe({

next:(res)=>{

console.log(
"MY POSTS FROM MONGO:",
res
);


this.posts.set(
res.data || []
);


this.isLoading.set(false);

},


error:(err)=>{

console.error(
"LOAD POSTS ERROR:",
err
);


this.posts.set([]);

this.isLoading.set(false);

}


});


}

getMainImage(post:any):string{

if(
post?.images &&
Array.isArray(post.images) &&
post.images.length > 0
){

return post.images[0];

}


return 'assets/no-image.png';

}

  getAdType(post: any): string {
    const type = String(
      post?.adtype || post?.conditiontype || 'service'
    ).toLowerCase().trim();

    return type === 'product' ? 'product' : 'service';
  }

  isFeatured(post: any): boolean {
    return !!(post?.isfeatured || post?.is_featured);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/no-image.png';
    }
  }

  openDetails(post: any): void {
    if (!post?._id){
      return;
    }

    this.router.navigate(['/details', String(post._id)]);
  }

  async editPost(post: any, event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    if (!post?._id) {
      console.warn('Missing postid for edit:', post);
      this.showAlert('Post id not found');
      return;
    }



    const success = await this.router.navigate(['/edit-post', String(post._id)]);

    if (!success) {
      console.error('Navigation failed for edit post:', post.postid);
      this.showAlert('Failed to open edit page');
    }
  }

  private buildFeaturePostPayload(post: any): any {
    return {
      ...post,
      postid: Number(post?._id),
      userid: post?.userid ?? null,
      title: post?.title ?? '',
      description: post?.description ?? '',
      price: Number(post?.price ?? 0),
      currencycode: post?.currencycode || 'INR',
      categoryid: post?.categoryid ?? null,
      subcategoryid: post?.subcategoryid ?? null,
      conditiontype: post?.conditiontype || post?.adtype || this.getAdType(post),
      adtype: post?.adtype || post?.conditiontype || this.getAdType(post),
      status: post?.status || 'Active',
      isactive: post?.isactive ?? true,
      image_url: post?.image_url || '',
      image_urls: Array.isArray(post?.image_urls) ? post.image_urls : [],
      video_url: post?.video_url || '',
      video_urls: Array.isArray(post?.video_urls) ? post.video_urls : [],
      contactname: post?.contactname || '',
      contactemail: post?.contactemail || '',
      contactphone: post?.contactphone || '',
      whatsappnumber: post?.whatsappnumber || '',
      location: post?.location || '',
      cityid: post?.cityid ?? null,
      areaid: post?.areaid ?? null,
      full_address: post?.full_address || '',
      latitude: post?.latitude ?? null,
      longitude: post?.longitude ?? null,
      custom_fields: post?.custom_fields ?? null,
      isfeatured: false,
      is_featured: false,
      featured_plan_id: null,
      featured_plan_name: null
    };
  }

  async featurePost(post: any, event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    if (!post?._id) {
      console.warn('Missing postid for feature:', post);
      this.showAlert('Post id not found');
      return;
    }

    if (this.isFeatured(post)) {
      this.showAlert('This post is already featured');
      return;
    }

    const adType = this.getAdType(post);
    const featurePayload = this.buildFeaturePostPayload(post);

    try {
      if (this.isBrowser()) {
        localStorage.setItem(
          'pending_post_payload',
          JSON.stringify(featurePayload)
        );

        localStorage.setItem('pending_post_flow', 'featured');
        localStorage.setItem('pending_post_type', adType);
        localStorage.setItem(
          'pending_post_userid',
          String(featurePayload?.userid ?? '')
        );
      }



      const success = await this.router.navigate(['/featured-plan'], {
        state: {
          postId: Number(post._id),
          adType: adType,
          postDetails: featurePayload
        }
      });

      if (!success) {
        console.error('Navigation failed for featured post:', post._id);
        this.showAlert('Failed to open featured plan');
      }
    } catch (error) {
      console.error('Error preparing featured flow:', error);
      this.showAlert('Failed to open featured plan');
    }
  }

async removePost(post:any, event:MouseEvent):Promise<void>{

event.preventDefault();
event.stopPropagation();
event.stopImmediatePropagation?.();


if(!post?._id){

  this.showAlert(
    'Post id not found',
    'error'
  );

  return;

}


const confirmed =
this.showConfirm(
'Are you sure you want to remove this post?'
);


if(!confirmed){
  return;
}



this.api.delete(
`/posts/${post._id}`
)
.subscribe({

next:(res:any)=>{


this.posts.set(
this.posts().filter(
(item)=>item._id !== post._id
)
);


this.snackbar.show(
'Post removed successfully',
'success'
);


},


error:(err)=>{

console.error(
"DELETE ERROR:",
err
);


this.snackbar.show(
'Failed to remove post',
'error'
);


}


});


}
trackByPostId(index:number, post:any){

return post?._id || index;

}
}
