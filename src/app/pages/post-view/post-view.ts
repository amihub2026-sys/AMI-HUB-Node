import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SnackbarService } from '../../services/snackbar.service';
@Component({
  selector: 'app-post-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-view.html',
  styleUrls: ['./post-view.css']
})
export class PostViewComponent implements OnInit {

  private readonly apiUrl = `${environment.apiUrl}/posts`;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  private showAlert(
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) {
    this.snackbar.show(message, type);
  }
selectMedia(type: 'image' | 'video', url: string) {
  this.selectedMedia.set({ type, url });

  if (type === 'video') {
    this.showVideoPlayButton.set(true);
  }
}

  toggleReviewForm() {
    const next = !this.showReviewForm();
    this.showReviewForm.set(next);

    if (next) {
      this.selectedRating = 0;
      this.hoverRating = 0;
      this.reviewText = '';
      this.reviewImages = [];
      this.reviewVideo = null;
      
    }
  }

playMainVideo(video: HTMLVideoElement) {
  video.play();
  this.showVideoPlayButton.set(false);
}
  showVideoPopup = signal(false);
popupVideoUrl = signal('');

openVideoPopup(video: string) {
  this.popupVideoUrl.set(video);
  this.showVideoPopup.set(true);
}

closeVideoPopup() {
  this.showVideoPopup.set(false);
  this.popupVideoUrl.set('');
}

  toggleReportForm() {
    this.showReportForm.set(!this.showReportForm());
  }

  submitReport() {
    if (!this.reportText.trim()) {
      this.showAlert('Please enter report message', 'error');
      return;
    }

    const post = this.postData();

    if (!post?.postid) {
      alert('Post not found');
      return;
    }



    this.showAlert('Report submitted successfully!', 'success');

    this.reportText = '';
    this.showReportForm.set(false);
  }

  selectedRating = 0;
  hoverRating = 0;
  averageRating = signal(0);
  reviews = signal<any[]>([]);
  isReviewSubmitting = signal(false);
  isReviewsLoading = signal(false);
loadFailed = signal(false);
  postId = '';
  postData = signal<any | null>(null);
  isLoading = signal(false);
  currentUserId = signal<string>('');

  selectedMedia = signal<{ type: 'image' | 'video'; url: string }>({
    type: 'image',
    url: ''
  });

  showReviewForm = signal(false);
  reviewText = '';
  reviewImages: string[] = [];
  reviewVideo: string | null = null;
reviewsToShow = 2;
showAllReviews = false;
  showReportForm = signal(false);
  reportText = '';
  showFullDescription = false;

 constructor(
  private route: ActivatedRoute,
  private router: Router,
  private http: HttpClient,
  private sanitizer: DomSanitizer,
  private snackbar: SnackbarService,
  private location: Location
) {}
async ngOnInit(): Promise<void> {
  this.postId = this.route.snapshot.paramMap.get('id') || '';

  if (!this.postId) {
    console.error('Post id not found in route');
    this.loadFailed.set(true);
    return;
  }

  this.loadCurrentUser();

  await this.loadPost();
}
private loadCurrentUser(): void {
  const userData = localStorage.getItem('user');

  if (!userData) {
    this.currentUserId.set('');
    return;
  }

  try {
    const user = JSON.parse(userData);

    this.currentUserId.set(
      String(user?._id || user?.id || '')
    );
  } catch (error) {
    console.error('Invalid user data in localStorage:', error);
    this.currentUserId.set('');
  }
}

  setRating(star: number) {
    this.selectedRating = star;
  }

  setHoverRating(star: number) {
    this.hoverRating = star;
  }

  clearHoverRating() {
    this.hoverRating = 0;
  }

  calculateAverageRating(reviews: any[] = []) {
    if (!reviews.length) {
      this.averageRating.set(0);
      return;
    }

    const ratings = reviews
      .map((r: any) => Number(r?.rating || 0))
      .filter((r: number) => r > 0);

    if (!ratings.length) {
      this.averageRating.set(0);
      return;
    }

    const total = ratings.reduce((sum: number, value: number) => sum + value, 0);
    this.averageRating.set(Math.round(total / ratings.length));
  }
async removePost(): Promise<void> {
  const post = this.postData();

  if (!post?.postid) {
    this.showAlert('Post not found', 'error');
    return;
  }

  const confirmDelete = confirm(
    'Are you sure you want to remove this post?'
  );

  if (!confirmDelete) return;

  const token = localStorage.getItem('token');

  if (!token) {
    this.showAlert('Please login first', 'error');
    this.router.navigate(['/login']);
    return;
  }

  try {
    const response: any = await this.http
      .delete<any>(
        `${this.apiUrl}/${post.postid}`,
        {
          headers: this.getAuthHeaders()
        }
      )
      .toPromise();

    if (!response?.success) {
      throw new Error(
        response?.message || 'Failed to remove post'
      );
    }

    this.showAlert(
      'Post removed successfully',
      'success'
    );

    this.router.navigate(['/my-posts']);
  } catch (error: any) {
    console.error('Delete post error:', error);

    this.showAlert(
      error?.error?.message ||
      error?.message ||
      'Failed to remove post',
      'error'
    );
  }
}
isMyPost(): boolean {

  const post = this.postData();

  return String(post?.userid || '') === String(this.currentUserId() || '');
}
toggleReviews(): void {
  this.showAllReviews = !this.showAllReviews;
}
toggleDescription(): void {
  this.showFullDescription = !this.showFullDescription;
}
async loadReviews(): Promise<void> {
  this.isReviewsLoading.set(false);
  this.reviews.set([]);
  this.averageRating.set(0);
}
async loadPost(): Promise<void> {
  this.isLoading.set(true);
  this.loadFailed.set(false);
  this.postData.set(null);

  try {
    const response: any = await this.http
      .get<any>(`${this.apiUrl}/${this.postId}`)
      .toPromise();

    const data = response?.data;

    if (!response?.success || !data) {
      this.loadFailed.set(true);
      return;
    }

    const imageList: string[] = Array.isArray(data.images)
      ? data.images.map((url: string) => this.getMediaUrl(url))
      : [];

    const videoList: string[] = Array.isArray(data.videos)
      ? data.videos.map((url: string) => this.getMediaUrl(url))
      : [];

    const seller =
      typeof data.sellerId === 'object'
        ? data.sellerId
        : null;

    const category =
      typeof data.categoryId === 'object'
        ? data.categoryId
        : null;

    const subcategory =
      typeof data.subcategoryId === 'object'
        ? data.subcategoryId
        : null;

    const mappedPost = {
      ...data,

      postid: data._id,
      userid: seller?._id || data.sellerId,

      images: imageList,
      videos: videoList,

      sellerName:
        seller?.fullName ||
        data.contact?.name ||
        'Seller',

sellerImage: seller?.profileImage
  ? this.getMediaUrl(seller.profileImage)
  : 'assets/icons/user.png',

      sellerPhone:
        data.contact?.mobile ||
        seller?.mobile ||
        '',

      sellerEmail:
        data.contact?.email ||
        seller?.email ||
        '',

      whatsappNumber:
        data.contact?.whatsapp ||
        data.contact?.mobile ||
        seller?.mobile ||
        '',

      category:
        category?.categoryName ||
        '',

      subcategory:
        subcategory?.subcategoryName ||
        '',

      locationText: this.buildLocation(data),

      displayAddress: this.buildDisplayAddress(data),

      categoryText: this.buildCategoryText({
        category: category?.categoryName,
        subcategory: subcategory?.subcategoryName
      }),

      detailItems: this.buildMongoDetailItems(
        data,
        category,
        subcategory,
        seller
      ),

      latitude:
        this.toNumberOrNull(data.location?.latitude),

      longitude:
        this.toNumberOrNull(data.location?.longitude)
    };

    this.postData.set(mappedPost);

    if (mappedPost.images.length > 0) {
      this.selectedMedia.set({
        type: 'image',
        url: mappedPost.images[0]
      });
    } else if (mappedPost.videos.length > 0) {
      this.selectedMedia.set({
        type: 'video',
        url: mappedPost.videos[0]
      });
    } else {
      this.selectedMedia.set({
        type: 'image',
        url: 'assets/no-image.png'
      });
    }

    await this.countPostView();

    // Enable after creating the reviews API.
    // await this.loadReviews();

  } catch (error) {
    console.error('Error loading post details:', error);

    this.postData.set(null);
    this.loadFailed.set(true);
  } finally {
    this.isLoading.set(false);
  }
}
private getMediaUrl(url: string): string {
  if (!url) {
    return 'assets/no-image.png';
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  const backendUrl =
    environment.apiUrl.replace('/api', '');

  return `${backendUrl}${
    url.startsWith('/') ? url : `/${url}`
  }`;
}
private async countPostView(): Promise<void> {
  try {
    await this.http.post(
      `${this.apiUrl}/${this.postId}/view`,
      {},
      {
        headers: this.getAuthHeaders()
      }
    ).toPromise();
  } catch (error) {
    console.error('View count error:', error);
  }
}
buildLocation(data: any): string {
  const city = data?.location?.city || '';
  const state = data?.location?.state || '';
  const address = data?.location?.address || '';

  if (city && state) {
    return `${city}, ${state}`;
  }

  return city || state || address || 'Location not available';
}

buildDisplayAddress(data: any): string {
  const location = data?.location || {};

  const parts = [
    location.address,
    location.city,
    location.state,
    location.country,
    location.pincode
  ].filter(Boolean);

  return parts.length
    ? parts.join(', ')
    : 'Location not available';
}
  buildCategoryText(data: any): string {
    const category = String(data?.category || '').trim();
    const subcategory = String(data?.subcategory || '').trim();

    if (category && subcategory) return `${category} • ${subcategory}`;
    if (category) return category;
    if (subcategory) return subcategory;

    return '';
  }

buildMongoDetailItems(
  data: any,
  category: any,
  subcategory: any,
  seller: any
): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];

  const categoryText = [
    category?.categoryName,
    subcategory?.subcategoryName
  ]
    .filter(Boolean)
    .join(' • ');

  if (categoryText) {
    items.push({
      label: 'Category',
      value: categoryText
    });
  }

  if (data?.listingType) {
    items.push({
      label: 'Type',
      value:
        String(data.listingType).charAt(0).toUpperCase() +
        String(data.listingType).slice(1)
    });
  }

  if (data?.status) {
    items.push({
      label: 'Status',
      value:
        String(data.status).charAt(0).toUpperCase() +
        String(data.status).slice(1)
    });
  }

  const sellerName =
    seller?.fullName ||
    data?.contact?.name;

  if (sellerName) {
    items.push({
      label: 'Seller',
      value: sellerName
    });
  }

  const address = this.buildDisplayAddress(data);

  if (address !== 'Location not available') {
    items.push({
      label: 'Address',
      value: address
    });
  }

  return items;
}

  getNormalizedCatalog(catalog: any): Array<{ title: string; price: number | null; imageUrl: string }> {
    if (!Array.isArray(catalog)) return [];

    return catalog
      .map((item: any) => ({
        title: String(item?.title || '').trim(),
        price:
          item?.price !== undefined && item?.price !== null && item?.price !== ''
            ? Number(item.price)
            : null,
        imageUrl: String(item?.imageUrl || item?.image_url || '').trim()
      }))
      .filter((item: any) => item.title || item.price !== null || item.imageUrl);
  }

isServicePost(): boolean {
  return String(
    this.postData()?.listingType || ''
  ).toLowerCase() === 'service';
}
  hasCatalog(): boolean {
    const post = this.postData();
    return Array.isArray(post?.catalogItems) && post.catalogItems.length > 0;
  }
  currentImageIndex = 0;

showVideoPlayButton = signal(true);

getAllMedia() {
  const post = this.postData();

  return [
    ...(post?.images || []).map((url: string) => ({
      type: 'image' as const,
      url
    })),
    ...(post?.videos || []).map((url: string) => ({
      type: 'video' as const,
      url
    }))
  ];
}


nextMedia() {
  const media = this.getAllMedia();
  if (!media.length) return;

  const index = media.findIndex(x => x.url === this.selectedMedia().url);
  const nextIndex = (index + 1) % media.length;

  this.selectMedia(media[nextIndex].type, media[nextIndex].url);
}

prevMedia() {
  const media = this.getAllMedia();
  if (!media.length) return;

  const index = media.findIndex(x => x.url === this.selectedMedia().url);
  const prevIndex = (index - 1 + media.length) % media.length;

  this.selectMedia(media[prevIndex].type, media[prevIndex].url);
}




  toNumberOrNull(value: any): number | null {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  hasCoordinates(): boolean {
    const post = this.postData();
    return post?.latitude !== null && post?.latitude !== undefined &&
           post?.longitude !== null && post?.longitude !== undefined;
  }

  mapEmbedUrl(): SafeResourceUrl {
    const post = this.postData();

    if (!post || !this.hasCoordinates()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    const lat = Number(post.latitude);
    const lng = Number(post.longitude);
    const delta = 0.01;

    const url =
      `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openMap() {
    const post = this.postData();
    if (!post) return;

    if (this.hasCoordinates()) {
      const lat = Number(post.latitude);
      const lng = Number(post.longitude);
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
      return;
    }

    const query = encodeURIComponent(
  post.displayAddress ||
  post.locationText ||
  ''
);
    if (query) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    } else {
      alert('Location not available');
    }
  }

callSeller() {

  const token = localStorage.getItem('token');

  if(!token){

    this.showAlert(
      'Please login to contact seller',
      'info'
    );

    this.router.navigate(['/login'],{
      state:{
        redirectTo:'post-view',
        postId:this.postId
      }
    });

    return;
  }


  const post = this.postData();


  if (!post?.sellerPhone) {

    this.showAlert(
      'Phone number not available',
      'error'
    );

    return;

  }


  window.location.href =
  'tel:' + post.sellerPhone;

}
whatsappSeller(): void {


  const token = localStorage.getItem('token');


  if(!token){

    this.showAlert(
      'Please login to contact seller',
      'info'
    );


    this.router.navigate(['/login'],{

      state:{
        redirectTo:'post-view',
        postId:this.postId
      }

    });


    return;

  }



  const post = this.postData();



  let phone = String(
    post?.whatsappNumber || ''
  ).replace(/\D/g,'');



  if(!phone){

    this.showAlert(
      'WhatsApp number not available',
      'error'
    );

    return;

  }



  if(phone.length === 10){

    phone = `91${phone}`;

  }



  window.open(
    `https://wa.me/${phone}`,
    '_blank'
  );


}
  sharePost() {
    const post = this.postData();
    const shareUrl = window.location.href;
    const shareText = `Check this product: ${post?.title || 'Product'}`;

    if ((navigator as any).share) {
      (navigator as any).share({
        title: post?.title || 'Product',
        text: shareText,
        url: shareUrl
      }).catch(() => {});
      return;
    }

    navigator.clipboard.writeText(shareUrl);
    this.showAlert('Link copied successfully!', 'success');
  }
async addToCart(): Promise<void> {
  const token = localStorage.getItem('token');

  if (!token) {
    this.showAlert('Please login first', 'error');
    this.router.navigate(['/login']);
    return;
  }

  this.showAlert(
    'Cart API will be connected next',
    'info'
  );
}
async addToFavorites(): Promise<void> {
  const token = localStorage.getItem('token');

  if (!token) {
    this.showAlert('Please login first', 'error');
    this.router.navigate(['/login']);
    return;
  }

  this.showAlert(
    'Favorites API will be connected next',
    'info'
  );
}

async chatSeller(): Promise<void> {
  const userId = this.currentUserId();

  if (!userId) {
    this.showAlert('Please login first', 'error');
    this.router.navigate(['/login']);
    return;
  }

  const post = this.postData();

  if (!post?.userid) {
    this.showAlert('Seller not available', 'error');
    return;
  }

  if (String(post.userid) === String(userId)) {
    this.showAlert(
      'You cannot chat with your own post',
      'info'
    );
    return;
  }

  this.router.navigate(['/chats'], {
    queryParams: {
      postId: post.postid,
      sellerId: post.userid
    }
  });
}
  onImageSelected(event: any) {
    const files = event?.target?.files;
    this.reviewImages = [];

    if (!files?.length) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.reviewImages.push(e.target.result);
      };

      reader.readAsDataURL(files[i]);
    }
  }

  onVideoSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      this.reviewVideo = e.target.result;
    };

    reader.readAsDataURL(file);
  }
async submitReview(): Promise<void> {
  const token = localStorage.getItem('token');

  if (!token) {
    this.showAlert('Please login first', 'error');
    this.router.navigate(['/login']);
    return;
  }

  this.showAlert(
    'Review API will be connected next',
    'info'
  );
}
goBack(): void {
  if (window.history.length > 1) {
    this.location.back();
  } else {
    this.router.navigate(['/']);
  }
}


openUserPage(userid:any){

  if(!userid){
    console.log("Seller userid missing");
    return;
  }


  this.router.navigate([
    '/user-page',
    userid
  ]);

}
}
