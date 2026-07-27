import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../../../../services/api.service';

interface AdminUserOption {
  _id: string;
  fullName: string;
  username: string;
  mobile: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface AdminPlanOption {
  _id: string;
  planId: string;
  planName: string;
  price: number;
  validity: number;
  postLimit: number;
  adLimit: number;
  remaining: number;
  videoEnabled: boolean;
  isActive: boolean;
}

interface AdminUserSubscriptionItem {
  _id: string;

  userId: AdminUserOption | null;
  planId: AdminPlanOption | null;

  startDate: string | null;
  expiryDate: string | null;

  remainingPosts: number;
  remainingAds: number;

  status: 'active' | 'inactive' | 'expired';

  createdAt: string | null;
  updatedAt: string | null;

  userName: string;
  userMobile: string;
  userEmail: string;

  planName: string;
  planCode: string;
  planPrice: number;

  startLabel: string;
  expiryLabel: string;
  createdLabel: string;

  statusLabel: 'Active' | 'Inactive' | 'Expired';
}

type UserSubscriptionStatusFilter =
  | 'all'
  | 'active'
  | 'inactive'
  | 'expired';

@Component({
  selector: 'app-admin-user-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-user-subscriptions.html',
  styleUrls: ['./admin-user-subscriptions.css']
})
export class AdminUserSubscriptionsComponent implements OnInit {

  @Input() searchQuery = '';

  currentPage = 1;
  itemsPerPage = 5;

  userSubscriptionStatusFilter: UserSubscriptionStatusFilter = 'all';

  allUserSubscriptions: AdminUserSubscriptionItem[] = [];
  allUsers: AdminUserOption[] = [];
  allPlans: AdminPlanOption[] = [];

  loading = false;
  dropdownLoading = false;
  saving = false;

  deletingId: string | null = null;
  statusUpdatingId: string | null = null;

  showForm = false;
  isEditMode = false;
  editingId: string | null = null;

  formModel = {
    userId: '',
    planId: '',
    startDate: '',
    expiryDate: '',
    remainingPosts: 0,
    remainingAds: 0,
    status: 'active' as 'active' | 'inactive' | 'expired'
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchUserSubscriptions();
  }

  get totalPages(): number {
    return (
      Math.ceil(
        this.filteredUserSubscriptions.length / this.itemsPerPage
      ) || 1
    );
  }

  get paginatedUserSubscriptions(): AdminUserSubscriptionItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;

    return this.filteredUserSubscriptions.slice(
      start,
      start + this.itemsPerPage
    );
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private toDateTimeLocal(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private getStatusLabel(
    status: string,
    expiryDate: string | null
  ): 'Active' | 'Inactive' | 'Expired' {

    if (status === 'inactive') {
      return 'Inactive';
    }

    if (status === 'expired') {
      return 'Expired';
    }

    if (expiryDate) {
      const expiry = new Date(expiryDate);

      if (
        !Number.isNaN(expiry.getTime()) &&
        expiry.getTime() < Date.now()
      ) {
        return 'Expired';
      }
    }

    return 'Active';
  }

  private mapUserSubscription(
    item: any
  ): AdminUserSubscriptionItem {

    const populatedUser =
      item.userId &&
      typeof item.userId === 'object'
        ? item.userId
        : null;

    const populatedPlan =
      item.planId &&
      typeof item.planId === 'object'
        ? item.planId
        : null;

    const status =
      item.status === 'inactive' ||
      item.status === 'expired'
        ? item.status
        : 'active';

    return {
      _id: String(item._id || ''),

      userId: populatedUser,
      planId: populatedPlan,

      startDate: item.startDate || null,
      expiryDate: item.expiryDate || null,

      remainingPosts: Number(item.remainingPosts || 0),
      remainingAds: Number(item.remainingAds || 0),

      status,

      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,

      userName:
        populatedUser?.fullName ||
        populatedUser?.username ||
        'Unknown User',

      userMobile:
        populatedUser?.mobile || '',

      userEmail:
        populatedUser?.email || '',

      planName:
        populatedPlan?.planName || 'Unknown Plan',

      planCode:
        populatedPlan?.planId || '',

      planPrice:
        Number(populatedPlan?.price || 0),

      startLabel:
        this.formatDate(item.startDate || null),

      expiryLabel:
        this.formatDate(item.expiryDate || null),

      createdLabel:
        this.formatDate(item.createdAt || null),

      statusLabel:
        this.getStatusLabel(
          status,
          item.expiryDate || null
        )
    };
  }

  async fetchUserSubscriptions(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const response: any = await firstValueFrom(
        this.api.get('/subscriptions')
      );

      const rows = Array.isArray(response?.data)
        ? response.data
        : [];

      this.allUserSubscriptions = rows.map((item: any) =>
        this.mapUserSubscription(item)
      );

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
    } catch (error: any) {
      console.error(
        'LOAD USER SUBSCRIPTIONS ERROR:',
        error
      );

      alert(
        error?.error?.message ||
        'Failed to load user subscriptions.'
      );
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadUsersAndPlans(): Promise<void> {
    this.dropdownLoading = true;
    this.cdr.detectChanges();

    try {
      const [usersResponse, plansResponse]: any[] =
        await Promise.all([
          firstValueFrom(
            this.api.get('/admin/users')
          ),

          firstValueFrom(
            this.api.get('/subscription-plans')
          )
        ]);

      const usersData =
        usersResponse?.data?.users ||
        usersResponse?.users ||
        usersResponse?.data ||
        [];

      const plansData =
        plansResponse?.data || [];

      this.allUsers = (
        Array.isArray(usersData)
          ? usersData
          : []
      ).map((user: any) => ({
        _id: String(user._id || ''),
        fullName: user.fullName || '',
        username: user.username || '',
        mobile: user.mobile || '',
        email: user.email || '',
        role: user.role || 'user',
        isActive: user.isActive !== false
      }));

      this.allPlans = (
        Array.isArray(plansData)
          ? plansData
          : []
      ).map((plan: any) => ({
        _id: String(plan._id || ''),
        planId: plan.planId || '',
        planName: plan.planName || 'Unnamed Plan',
        price: Number(plan.price || 0),
        validity: Number(plan.validity || 30),
        postLimit: Number(plan.postLimit || 0),
        adLimit: Number(plan.adLimit || 0),
        remaining: Number(plan.remaining || 0),
        videoEnabled: Boolean(plan.videoEnabled),
        isActive: plan.isActive !== false
      }));
    } catch (error: any) {
      console.error(
        'LOAD USERS AND PLANS ERROR:',
        error
      );

      alert(
        error?.error?.message ||
        'Failed to load users or subscription plans.'
      );
    } finally {
      this.dropdownLoading = false;
      this.cdr.detectChanges();
    }
  }

  setUserSubscriptionStatusFilter(
    filter: UserSubscriptionStatusFilter
  ): void {
    this.userSubscriptionStatusFilter = filter;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  get filteredUserSubscriptions(): AdminUserSubscriptionItem[] {
    const query =
      this.searchQuery
        .trim()
        .toLowerCase();

    return this.allUserSubscriptions.filter((item) => {

      const matchesSearch =
        !query ||
        item._id.toLowerCase().includes(query) ||
        item.userName.toLowerCase().includes(query) ||
        item.userMobile.toLowerCase().includes(query) ||
        item.userEmail.toLowerCase().includes(query) ||
        item.planName.toLowerCase().includes(query) ||
        item.planCode.toLowerCase().includes(query) ||
        item.statusLabel.toLowerCase().includes(query);

      const matchesStatus =
        this.userSubscriptionStatusFilter === 'all' ||
        item.statusLabel.toLowerCase() ===
          this.userSubscriptionStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get totalUserSubscriptionsCount(): number {
    return this.allUserSubscriptions.length;
  }

  get activeUserSubscriptionsCount(): number {
    return this.allUserSubscriptions.filter(
      item => item.statusLabel === 'Active'
    ).length;
  }

  get expiredUserSubscriptionsCount(): number {
    return this.allUserSubscriptions.filter(
      item => item.statusLabel === 'Expired'
    ).length;
  }

  get inactiveUserSubscriptionsCount(): number {
    return this.allUserSubscriptions.filter(
      item => item.statusLabel === 'Inactive'
    ).length;
  }

  async openCreateForm(): Promise<void> {
    this.isEditMode = false;
    this.editingId = null;

    this.resetForm();

    this.showForm = true;
    this.cdr.detectChanges();

    await this.loadUsersAndPlans();
  }

  async openEditForm(
    item: AdminUserSubscriptionItem
  ): Promise<void> {

    this.isEditMode = true;
    this.editingId = item._id;

    this.formModel = {
      userId:
        item.userId?._id || '',

      planId:
        item.planId?._id || '',

      startDate:
        this.toDateTimeLocal(item.startDate),

      expiryDate:
        this.toDateTimeLocal(item.expiryDate),

      remainingPosts:
        Number(item.remainingPosts || 0),

      remainingAds:
        Number(item.remainingAds || 0),

      status:
        item.status
    };

    this.showForm = true;
    this.cdr.detectChanges();

    await this.loadUsersAndPlans();
  }

  closeForm(): void {
    if (this.saving) {
      return;
    }

    this.showForm = false;
    this.isEditMode = false;
    this.editingId = null;

    this.resetForm();
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.formModel = {
      userId: '',
      planId: '',
      startDate: '',
      expiryDate: '',
      remainingPosts: 0,
      remainingAds: 0,
      status: 'active'
    };
  }

  onPlanSelected(planMongoId: string): void {
    const selectedPlan = this.allPlans.find(
      plan => plan._id === planMongoId
    );

    if (!selectedPlan) {
      return;
    }

    this.formModel.remainingPosts =
      selectedPlan.postLimit;

    this.formModel.remainingAds =
      selectedPlan.adLimit;

    if (!this.formModel.startDate) {
      const now = new Date();

      this.formModel.startDate =
        this.toDateTimeLocal(now.toISOString());
    }

    const startDate =
      new Date(this.formModel.startDate);

    if (!Number.isNaN(startDate.getTime())) {
      const expiryDate =
        new Date(startDate);

      expiryDate.setDate(
        expiryDate.getDate() +
        selectedPlan.validity
      );

      this.formModel.expiryDate =
        this.toDateTimeLocal(
          expiryDate.toISOString()
        );
    }

    this.cdr.detectChanges();
  }

  async saveUserSubscription(): Promise<void> {
    if (!this.formModel.userId) {
      alert('Please select a user.');
      return;
    }

    if (!this.formModel.planId) {
      alert('Please select a subscription plan.');
      return;
    }

    if (!this.formModel.startDate) {
      alert('Start date is required.');
      return;
    }

    if (!this.formModel.expiryDate) {
      alert('Expiry date is required.');
      return;
    }

    const startDate =
      new Date(this.formModel.startDate);

    const expiryDate =
      new Date(this.formModel.expiryDate);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(expiryDate.getTime())
    ) {
      alert('Please enter valid dates.');
      return;
    }

    if (expiryDate <= startDate) {
      alert('Expiry date must be after start date.');
      return;
    }

    const payload = {
      userId: this.formModel.userId,
      planId: this.formModel.planId,
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      remainingPosts: Number(
        this.formModel.remainingPosts || 0
      ),
      remainingAds: Number(
        this.formModel.remainingAds || 0
      ),
      status: this.formModel.status
    };

    this.saving = true;
    this.cdr.detectChanges();

    try {
      if (
        this.isEditMode &&
        this.editingId
      ) {
        await firstValueFrom(
          this.api.put(
            `/subscriptions/${this.editingId}`,
            payload
          )
        );

        alert(
          'User subscription updated successfully.'
        );
      } else {
        await firstValueFrom(
          this.api.post(
            '/subscriptions/admin-create',
            payload
          )
        );

        alert(
          'User subscription created successfully.'
        );
      }

      this.showForm = false;
      this.isEditMode = false;
      this.editingId = null;

      this.resetForm();

      await this.fetchUserSubscriptions();
    } catch (error: any) {
      console.error(
        'SAVE USER SUBSCRIPTION ERROR:',
        error
      );

      alert(
        error?.error?.message ||
        'Failed to save user subscription.'
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async toggleUserSubscriptionStatus(
    item: AdminUserSubscriptionItem
  ): Promise<void> {

    if (this.statusUpdatingId) {
      return;
    }

    const action =
      item.status === 'active'
        ? 'deactivate'
        : 'activate';

    const confirmed = confirm(
      `Are you sure you want to ${action} this subscription?`
    );

    if (!confirmed) {
      return;
    }

    this.statusUpdatingId = item._id;
    this.cdr.detectChanges();

    try {
      await firstValueFrom(
        this.api.patch(
          `/subscriptions/${item._id}/status`,
          {}
        )
      );

      await this.fetchUserSubscriptions();
    } catch (error: any) {
      console.error(
        'UPDATE SUBSCRIPTION STATUS ERROR:',
        error
      );

      alert(
        error?.error?.message ||
        'Failed to update subscription status.'
      );
    } finally {
      this.statusUpdatingId = null;
      this.cdr.detectChanges();
    }
  }

  async deleteUserSubscription(
    item: AdminUserSubscriptionItem
  ): Promise<void> {

    const confirmed = confirm(
      `Are you sure you want to delete the subscription for "${item.userName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.deletingId = item._id;
    this.cdr.detectChanges();

    try {
      await firstValueFrom(
        this.api.delete(
          `/subscriptions/${item._id}`
        )
      );

      this.allUserSubscriptions =
        this.allUserSubscriptions.filter(
          subscription =>
            subscription._id !== item._id
        );

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

      alert(
        'User subscription deleted successfully.'
      );
    } catch (error: any) {
      console.error(
        'DELETE USER SUBSCRIPTION ERROR:',
        error
      );

      alert(
        error?.error?.message ||
        'Failed to delete user subscription.'
      );
    } finally {
      this.deletingId = null;
      this.cdr.detectChanges();
    }
  }

  getShortId(id: string): string {
    if (!id) {
      return '-';
    }

    return id.slice(-6).toUpperCase();
  }

  trackByUserSubscription(
    index: number,
    item: AdminUserSubscriptionItem
  ): string {
    return item._id;
  }
}