import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';

interface AdminUserBoostPlanItem {
  boost_purchase_id: string;
 userid: string | null;
  auth_user_id: string | null;
post_id: string | null;
  ad_type: string | null;
  boost_plan_id: string;
  boost_name: string | null;
  amount: number;
  paymentstatus: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  startdate: string | null;
  enddate: string | null;
  isactive: boolean;
  createdon: string | null;
  startLabel: string;
  endLabel: string;
  createdLabel: string;
  statusLabel: 'Active' | 'Expired' | 'Inactive';
}

@Component({
  selector: 'app-admin-user-boost-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user-boost-plans.html',
  styleUrls: ['./admin-user-boost-plans.css'],
})
export class AdminUserBoostPlansComponent implements OnInit {
  @Input() searchQuery = '';

  currentPage = 1;
  itemsPerPage = 5;

  allUserBoostPlans: AdminUserBoostPlanItem[] = [];
  loading = false;

constructor(
  private api: ApiService,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit(): void {
    this.fetchUserBoostPlans();
  }



  get filteredUserBoostPlans(): AdminUserBoostPlanItem[] {
    const q = this.searchQuery.trim().toLowerCase();

    if (!q) return this.allUserBoostPlans;

    return this.allUserBoostPlans.filter((item) =>
      String(item.userid ?? '').includes(q) ||
      String(item.auth_user_id ?? '').toLowerCase().includes(q) ||
      String(item.post_id ?? '').toLowerCase().includes(q)||
      String(item.ad_type ?? '').toLowerCase().includes(q) ||
      String(item.boost_plan_id ?? '').toLowerCase().includes(q) ||
      String(item.boost_name ?? '').toLowerCase().includes(q) ||
      String(item.paymentstatus ?? '').toLowerCase().includes(q)
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUserBoostPlans.length / this.itemsPerPage) || 1;
  }

  get paginatedUserBoostPlans(): AdminUserBoostPlanItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUserBoostPlans.slice(start, start + this.itemsPerPage);
  }

fetchUserBoostPlans(): void {
  this.loading = true;

  this.api.get<any>('/boost-plans/user-purchases').subscribe({
    next: (res: any) => {
      console.log('BOOST PURCHASE RESPONSE:', res);

      const data = res?.data || [];

this.allUserBoostPlans = data.map((item: any) => ({
  boost_purchase_id: String(item._id || ''),

  userid: item.userId?._id
    ? String(item.userId._id)
    : null,

  auth_user_id: item.userId?._id
    ? String(item.userId._id)
    : null,

  post_id: item.postId?._id
    ? String(item.postId._id)
    : null,

  ad_type: item.postId?.listingType || null,

  boost_plan_id: item.boostPlanId?._id
    ? String(item.boostPlanId._id)
    : '',

  boost_name: item.boostPlanId?.boostName || null,

  amount: Number(item.amount || 0),

  paymentstatus: item.paymentStatus || null,

  razorpay_payment_id: item.razorpayPaymentId || null,

  razorpay_order_id: item.razorpayOrderId || null,

  startdate: item.startDate || null,

  enddate: item.endDate || null,

  isactive: Boolean(item.isActive),

  createdon: item.createdAt || null,

  startLabel: this.formatDate(item.startDate),

  endLabel: this.formatDate(item.endDate),

  createdLabel: this.formatDate(item.createdAt),

  statusLabel: this.getStatusLabel(
    Boolean(item.isActive),
    item.endDate || null
  )
}));

      this.loading = false;
      this.currentPage = 1;
      this.cdr.detectChanges();
    },

    error: (err) => {
      console.error('BOOST PURCHASE LOAD ERROR:', err);

      this.allUserBoostPlans = [];
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  trackByBoost(index: number, item: AdminUserBoostPlanItem): string {
    return item.boost_purchase_id;
  }

  private getStatusLabel(
    isactive: boolean,
    enddate: string | null
  ): 'Active' | 'Expired' | 'Inactive' {
    if (!isactive) return 'Inactive';
    if (!enddate) return 'Inactive';

    return new Date(enddate) >= new Date() ? 'Active' : 'Expired';
  }

  private formatDate(value: string | null): string {
    if (!value) return '-';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('en-IN');
  }
}