import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';

interface AdminSubscriptionPlanItem {

subscriptionplanid: string;

planname:string;

description:string;

price:number;

validitydays:number;

postlimit:number;

isactive:boolean;

createdLabel:string;

plan_id:string;

ad_limit:number;

video_enabled:boolean;

remaining_ads:number;

is_active:boolean;

}
type SubscriptionStatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-subscriptions.html',
  styleUrls: ['./admin-subscriptions.css'],
})
export class AdminSubscriptionsComponent implements OnInit {
  @Input() searchQuery = '';
  currentPage = 1;
itemsPerPage = 5;

  subscriptionStatusFilter: SubscriptionStatusFilter = 'all';

  allSubscriptionPlans: AdminSubscriptionPlanItem[] = [];
  loading = false;
  saving = false;
 deletingId: string | null = null;

  showForm = false;
  isEditMode = false;
  editingPlanId: string | null = null;

  formModel = {
    planname: '',
    description: '',
    price: 0,
    validitydays: 30,
    postlimit: 1,
    isactive: true,
    plan_id: '',
    ad_limit: 1,
    video_enabled: false,
    is_active: true,
    remaining_ads: 1,
  };

constructor(
 private api: ApiService,
 private cdr: ChangeDetectorRef
){}

  ngOnInit(): void {
    this.fetchSubscriptionPlans();
  }
get totalPages(): number {
  return Math.ceil(this.filteredSubscriptionPlans.length / this.itemsPerPage) || 1;
}

get paginatedSubscriptionPlans(): AdminSubscriptionPlanItem[] {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  return this.filteredSubscriptionPlans.slice(start, start + this.itemsPerPage);
}

goToPage(page: number): void {
  if (page < 1 || page > this.totalPages) return;

  this.currentPage = page;
}
async fetchSubscriptionPlans(): Promise<void>{

this.loading=true;


this.api.get('/subscription-plans')
.subscribe({

next:(res:any)=>{


this.allSubscriptionPlans =
(res.data || []).map((item:any)=>({

subscriptionplanid:item._id,

planname:item.planName,

description:item.description || '',

price:item.price,

validitydays:item.validity,

postlimit:item.postLimit,

isactive:item.isActive,

is_active:item.isActive,

plan_id:item.planId,

ad_limit:item.adLimit,

video_enabled:item.videoEnabled,

remaining_ads:item.remaining,

createdLabel:this.formatDate(item.createdAt)

}));


this.loading=false;

this.cdr.detectChanges();

},


error:(err)=>{

console.error(
"LOAD PLANS ERROR",
err
);

this.loading=false;

}


});


}
 

  formatDate(value: string | null): string {
    if (!value) return '-';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  setSubscriptionStatusFilter(filter: SubscriptionStatusFilter): void {
    this.subscriptionStatusFilter = filter;
    this.cdr.detectChanges();
  }

  get filteredSubscriptionPlans(): AdminSubscriptionPlanItem[] {
    const q = this.searchQuery.trim().toLowerCase();

    return this.allSubscriptionPlans.filter((plan) => {
      const matchesSearch =
        !q ||
        String(plan.subscriptionplanid).toLowerCase().includes(q) ||
        String(plan.planname || '').toLowerCase().includes(q) ||
        String(plan.description || '').toLowerCase().includes(q) ||
        String(plan.plan_id || '').toLowerCase().includes(q) ||
        String(plan.price).toLowerCase().includes(q) ||
        String(plan.validitydays).toLowerCase().includes(q) ||
        String(plan.postlimit).toLowerCase().includes(q) ||
        String(plan.ad_limit).toLowerCase().includes(q) ||
        String(plan.remaining_ads).toLowerCase().includes(q);

      const isPlanActive = plan.isactive && plan.is_active;

      const matchesFilter =
        this.subscriptionStatusFilter === 'all' ||
        (this.subscriptionStatusFilter === 'active' && isPlanActive) ||
        (this.subscriptionStatusFilter === 'inactive' && !isPlanActive);

      return matchesSearch && matchesFilter;
    });
  }

  get totalSubscriptionPlansCount(): number {
    return this.allSubscriptionPlans.length;
  }

  get activeSubscriptionPlansCount(): number {
    return this.allSubscriptionPlans.filter(
      (plan) => plan.isactive && plan.is_active
    ).length;
  }

  get inactiveSubscriptionPlansCount(): number {
    return this.allSubscriptionPlans.filter(
      (plan) => !(plan.isactive && plan.is_active)
    ).length;
  }

  get videoEnabledPlansCount(): number {
    return this.allSubscriptionPlans.filter((plan) => plan.video_enabled).length;
  }

  openCreateForm(): void {
    this.isEditMode = false;
    this.editingPlanId = null;
    this.showForm = true;
    this.resetForm();
    this.cdr.detectChanges();
  }

  openEditForm(plan: AdminSubscriptionPlanItem): void {
    this.isEditMode = true;
    this.editingPlanId = plan.subscriptionplanid;
    this.showForm = true;
this.formModel = {
  planname: plan.planname || '',
  description: plan.description || '',
  price: Number(plan.price || 0),
  validitydays: Number(plan.validitydays || 0),
  postlimit: Number(plan.postlimit || 0),
  isactive: !!plan.isactive,
  plan_id: plan.plan_id || '',
  ad_limit: Number(plan.ad_limit || 0),
  video_enabled: !!plan.video_enabled,
  is_active: !!plan.is_active,
  remaining_ads: Number(plan.remaining_ads || 0),
};
    this.cdr.detectChanges();
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingPlanId = null;
    this.resetForm();
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.formModel = {
      planname: '',
      description: '',
      price: 0,
      validitydays: 30,
      postlimit: 1,
      isactive: true,
      plan_id: '',
      ad_limit: 1,
      video_enabled: false,
      is_active: true,
      remaining_ads: 1,
    };
    this.cdr.detectChanges();
  }

  async saveSubscription(): Promise<void> {
    if (!this.formModel.planname.trim()) {
      alert('Plan name is required.');
      this.cdr.detectChanges();
      return;
    }

    if (!this.formModel.plan_id.trim()) {
      alert('Plan ID is required.');
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    const payload = {
      planname: this.formModel.planname.trim(),
      description: this.formModel.description.trim(),
      price: Number(this.formModel.price || 0),
      validitydays: Number(this.formModel.validitydays || 0),
      postlimit: Number(this.formModel.postlimit || 0),
      isactive: !!this.formModel.isactive,
      plan_id: this.formModel.plan_id.trim(),
      ad_limit: Number(this.formModel.ad_limit || 0),
      video_enabled: !!this.formModel.video_enabled,
      is_active: !!this.formModel.is_active,
      remaining_ads: Number(this.formModel.remaining_ads || 0),
    };

try {

if(this.isEditMode && this.editingPlanId){

this.api.put(
  `/subscription-plans/${this.editingPlanId}`,
  {
    planName: this.formModel.planname,
    planId: this.formModel.plan_id,
    description: this.formModel.description,
    price: this.formModel.price,
    validity: this.formModel.validitydays,
    postLimit: this.formModel.postlimit,
    adLimit: this.formModel.ad_limit,
    remaining: this.formModel.remaining_ads,
    videoEnabled: this.formModel.video_enabled,
    isActive: this.formModel.isactive
  }
)
.subscribe(()=>{

  alert("Subscription plan updated successfully");

  this.closeForm();

  this.fetchSubscriptionPlans();

});
}
else {


this.api.post(
'/subscription-plans',
{
planName:this.formModel.planname,
planId:this.formModel.plan_id,
description:this.formModel.description,
price:this.formModel.price,
validity:this.formModel.validitydays,
postLimit:this.formModel.postlimit,
adLimit:this.formModel.ad_limit,
remaining:this.formModel.remaining_ads,
videoEnabled:this.formModel.video_enabled,
isActive:this.formModel.isactive
}
)
.subscribe(()=>{


alert(
"Subscription plan created successfully"
);


this.closeForm();

this.fetchSubscriptionPlans();


});


}
    } catch (err) {
      console.error('Save subscription plan exception:', err);
      alert('Something went wrong while saving subscription plan.');
      this.cdr.detectChanges();
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
async toggleSubscriptionStatus(
plan: AdminSubscriptionPlanItem
){

this.api.patch(
`/subscription-plans/${plan.subscriptionplanid}/status`,
{}
)
.subscribe(()=>{


plan.isactive = !plan.isactive;

plan.is_active = plan.isactive;


this.cdr.detectChanges();


});

}
async deleteSubscription(plan: AdminSubscriptionPlanItem): Promise<void> {

  const confirmed = confirm(
    `Are you sure you want to delete "${plan.planname}?"`
  );

  if (!confirmed) return;


  this.deletingId = plan.subscriptionplanid;


  this.api.delete(
    `/subscription-plans/${plan.subscriptionplanid}`
  )
  .subscribe(()=>{


    this.allSubscriptionPlans =
    this.allSubscriptionPlans.filter(
      item =>
      item.subscriptionplanid !== plan.subscriptionplanid
    );


    alert(
      "Subscription plan deleted successfully"
    );


    this.deletingId=null;

    this.cdr.detectChanges();


  });

}


// ADD HERE

trackBySubscription(
  index: number,
  plan: AdminSubscriptionPlanItem
): string {

  return plan.subscriptionplanid;

}

}
