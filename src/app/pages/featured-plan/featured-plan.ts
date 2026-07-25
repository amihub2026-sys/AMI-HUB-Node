import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-featured-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './featured-plan.html',
  styleUrl: './featured-plan.css',
})
export class FeaturedPlan implements OnInit {

  postId: string = '';
  adType: 'service' | 'product' | 'job' = 'service';

  isSaving = false;
  isLoading = false;

  postDetails: any = null;
  boostPlans: any[] = [];

  constructor(
    private router: Router,
    private api: ApiService
  ) {
    const nav = this.router.getCurrentNavigation();
    const navState = nav?.extras?.state || {};

    const historyState =
      typeof window !== 'undefined'
        ? window.history.state || {}
        : {};

    this.postId = String(
      navState['postId'] ||
      historyState['postId'] ||
      ''
    );

const incomingType = String(
  navState['adType'] ||
  historyState['adType'] ||
  ''
)
  .toLowerCase()
  .trim();

this.adType =
  incomingType === 'product'
    ? 'product'
    : incomingType === 'job'
    ? 'job'
    : 'service';

    this.postDetails =
      navState['postDetails'] ||
      historyState['postDetails'] ||
      this.getStoredPendingPost();

    if (!this.postId && this.postDetails) {
      this.postId = String(
        this.postDetails?._id ||
        this.postDetails?.postid ||
        this.postDetails?.id ||
        ''
      );
    }

    if (this.postDetails) {
      const type = String(
        this.postDetails?.listingType ||
        this.postDetails?.adtype ||
        this.postDetails?.conditiontype ||
        this.adType
      )
        .toLowerCase()
        .trim();

      this.adType =
  type === 'product'
    ? 'product'
    : type === 'job'
    ? 'job'
    : 'service';

      this.postDetails = {
        ...this.postDetails,

        _id:
          this.postDetails?._id ||
          this.postId,

        postid:
          this.postDetails?.postid ||
          this.postId,

        listingType:
          this.postDetails?.listingType ||
          this.adType,

adtype: this.adType,
conditiontype: this.adType
      };
    }
  }

  ngOnInit(): void {
    this.loadBoostPlans();
  }

  loadBoostPlans(): void {
    this.isLoading = true;

    this.api.get('/boost-plans').subscribe({
      next: (response: any) => {
        this.boostPlans = (response?.data || [])
          .filter((plan: any) => plan.isActive === true)
          .sort(
            (a: any, b: any) =>
              Number(a.price || 0) - Number(b.price || 0)
          );

        this.isLoading = false;
      },

      error: (error: any) => {
        console.error('Boost plans load error:', error);

        this.boostPlans = [];
        this.isLoading = false;
      }
    });
  }

  private getStoredPendingPost(): any {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = localStorage.getItem('pending_post_payload');

      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error reading pending_post_payload:', error);
      return null;
    }
  }

  private storePendingPost(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.postDetails || !this.postId) {
      return;
    }

    const payload = {
      ...this.postDetails,

      _id:
        this.postDetails?._id ||
        this.postId,

      postid:
        this.postDetails?.postid ||
        this.postId,

      listingType:
        this.postDetails?.listingType ||
        this.adType,

adtype: this.adType,
conditiontype: this.adType
    };

    localStorage.setItem(
      'pending_post_payload',
      JSON.stringify(payload)
    );

    localStorage.setItem(
      'pending_post_flow',
      'featured'
    );

    localStorage.setItem(
      'pending_post_type',
      this.adType
    );

    const userId =
      payload?.sellerId?._id ||
      payload?.sellerId ||
      payload?.userId ||
      payload?.userid ||
      '';

    if (userId) {
      localStorage.setItem(
        'pending_post_userid',
        String(userId)
      );
    }
  }

  choosePlan(plan: any): void {
    if (this.isSaving) {
      return;
    }

    if (!this.postId) {
      alert('Post details not found. Please go back and try again.');
      return;
    }

    if (!plan?._id) {
      alert('Invalid boost plan selected.');
      return;
    }

    try {
      this.isSaving = true;

      this.storePendingPost();

      const selectedPlan = {
        _id: String(plan._id),

        boostPlanId:
          plan.boostPlanId,

        boostName:
          plan.boostName,

        price:
          Number(plan.price || 0),

        durationDays:
          Number(plan.durationDays || 1),

        isActive:
          plan.isActive,

        plan_id:
          String(plan._id),

        boost_plan_id:
          String(plan._id),

        featured_plan_id:
          String(plan._id),

        plan_name:
          plan.boostName,

        featured_plan_name:
          plan.boostName,

        amount:
          Number(plan.price || 0),

        duration_days:
          Number(plan.durationDays || 1),

        isfeatured: true,
        is_featured: true,

        ad_type:
          this.adType,

        postId:
          this.postId
      };

if (typeof window !== 'undefined') {
  localStorage.setItem(
    'selected_plan_payload',
    JSON.stringify(selectedPlan)
  );

  localStorage.removeItem('verified_payment_payload');
}

      this.router.navigate(['/payment'], {
        state: {
          postId: this.postId,
          adType: this.adType,
          postDetails: this.postDetails,
          selectedPlan
        }
      });

    } catch (error) {
      console.error('choosePlan error:', error);
      alert('Something went wrong');

    } finally {
      this.isSaving = false;
    }
  }
}