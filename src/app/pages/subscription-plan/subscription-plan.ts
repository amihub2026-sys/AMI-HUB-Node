import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SnackbarService } from '../../services/snackbar.service';
import { ApiService } from '../../services/api.service';
interface SubscriptionPlanItem {

  subscriptionplanid: string;

  planId: string;

  planName: string;

  price: number;

  validity: number;

  postLimit: number;

  adLimit: number;

  remaining: number;

  isActive: boolean;

}
@Component({
  selector: 'app-subscription-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-plan.html',
  styleUrls: ['./subscription-plan.css'],
})
export class SubscriptionPlan implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  showSuccess = false;
  selectedPlan = '';
  isSaving = false;
  isLoadingPlans = false;
  flowType: 'normal' | 'featured' = 'normal';

  successTitle = 'Your post is posted successfully!';
  successMessage = 'Your plan is activated successfully.';

  plans: SubscriptionPlanItem[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    private snackbar: SnackbarService,
    private api: ApiService
  ) {}

ngOnInit(): void {
    const flow = this.route.snapshot.queryParamMap.get('flow');
    this.flowType = flow === 'featured' ? 'featured' : 'normal';

    if (!this.isBrowser) return;

    this.loadPlans();
  }

  goHome(): void {
    this.showSuccess = false;
    this.cd.detectChanges();
    this.router.navigate(['/']);
  }

private loadPlans(): void {

  this.isLoadingPlans = true;

  try {

    this.api.get<any>(
      '/subscription-plans/active'
    )
    .subscribe({

      next:(res:any)=>{


this.plans =
(res.data || []).map((item:any)=>({

subscriptionplanid:item._id,

planId:item.planId,

planName:item.planName,

price:Number(item.price || 0),

validity:Number(item.validity || 30),

postLimit:Number(item.postLimit || 0),

adLimit:Number(item.adLimit || 0),

remaining:Number(item.remaining || 0),

isActive:Boolean(item.isActive)

}));


        this.isLoadingPlans = false;

        this.cd.detectChanges();


      },


      error:(err)=>{

        console.error(
          "PLAN LOAD ERROR",
          err
        );

        this.isLoadingPlans=false;

      }

    });


  }
  catch(err){

    console.error(err);

    this.isLoadingPlans=false;

  }

}

  getPlanFeatures(planName: string): string[] {
    const name = (planName || '').toLowerCase();

    if (name === 'basic' || name === 'basic plan') {
      return ['Access to core features', 'Basic support', 'Single user'];
    }

    if (name === 'starter' || name === 'starter plan') {
      return ['All Basic features', 'Priority support', 'Up to 5 ads'];
    }

    if (name === 'premium' || name === 'premium plan') {
      return ['Extended plan validity', 'Higher ad limit', 'Priority usage'];
    }

    if (name === 'pro' || name === 'pro plan') {
      return ['Maximum ad limit', 'Longest validity', 'Full access benefits'];
    }

    return ['Plan benefits included'];
  }

  isFeaturedCard(planName: string): boolean {
    const name = (planName || '').toLowerCase();
    return name === 'starter' || name === 'starter plan';
  }

  async selectPlan(plan: SubscriptionPlanItem): Promise<void> {
    if (this.isSaving) return;

    if (!this.isBrowser) {
      this.snackbar.show('Please try again in browser.', 'error');
      return;
    }

    const pendingPostPayload = localStorage.getItem('pending_post_payload');

    if (!pendingPostPayload) {
      this.snackbar.show('Session expired. Please fill the form again.', 'error');
      this.router.navigate(['/service']);
      return;
    }

    this.ngZone.run(() => {
      this.isSaving = true;
      this.selectedPlan = plan.planName;
      this.showSuccess = false;
      this.cd.detectChanges();
    });

    try {
      const planId = plan.planId;

const planPayload = {

  subscriptionplanid: plan.subscriptionplanid,

  plan_id: plan.planId,

  plan_name: plan.planName,

  amount: plan.price,

  price: plan.price,

  duration_days: plan.validity,

  validitydays: plan.validity,


  total_ads:
    plan.adLimit || plan.postLimit || 1,


  remaining_ads:
    plan.remaining || 0,


  isfeatured:
    this.flowType === 'featured',


  featured_plan_id:
    this.flowType === 'featured'
      ? planId
      : null,


  featured_plan_name:
    this.flowType === 'featured'
      ? plan.planName
      : null,


  flow_type:
    this.flowType

};

      localStorage.setItem('selected_plan_payload', JSON.stringify(planPayload));

      this.ngZone.run(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      });

      this.router.navigate(['/payment']);
    } catch (err) {
      console.error('PLAN SELECT ERROR:', err);

      this.ngZone.run(() => {
        this.isSaving = false;
        this.selectedPlan = '';
        this.showSuccess = false;
        this.cd.detectChanges();
      });

      this.snackbar.show('Something went wrong. Please try again.', 'error');
    }
  }
}