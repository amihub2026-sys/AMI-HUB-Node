import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject
} from '@angular/core';

import { ApiService } from '../../../../../services/api.service';
import { Service } from '../../../../service/service';

type UserStatus =
  | 'Active'
  | 'Blocked'
  | 'Pending';

interface AdminUserItem {
  id: string;
  _id: string;

  name: string;
  email: string;
  phone: string;

  role: string;
  status: UserStatus;

  joinedOn: string;
  avatar: string;

  isActive: boolean;
  isOnboardingCompleted: boolean;

  usertypeid: number;
  listingtype: string | null;

  rawUser: any;
}

@Component({
  selector: 'app-admin-users',

  standalone: true,

  imports: [
    CommonModule,
    Service
  ],

  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css']
})
export class AdminUsers implements OnInit {

  private api =
    inject(ApiService);

  private cdr =
    inject(ChangeDetectorRef);


  @Input()
  searchQuery = '';


  users: AdminUserItem[] = [];

  isLoading = false;

  errorMessage = '';


  currentPage = 1;

  pageSize = 5;


  showPostModal = false;

  selectedUser: AdminUserItem | null = null;


  ngOnInit(): void {

    this.loadUsers();

  }


  loadUsers(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.api
      .get<any>('/admin/users')
      .subscribe({

        next: (response: any) => {

          console.log(
            'MONGODB ADMIN USERS:',
            response
          );

          const userRows =
            Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.users)
              ? response.users
              : Array.isArray(response)
              ? response
              : [];


          this.users =
            userRows.map(
              (row: any) =>
                this.mapMongoUser(row)
            );


          if (
            this.currentPage >
            this.totalPages
          ) {
            this.currentPage = 1;
          }


          this.isLoading = false;

          this.cdr.detectChanges();

        },


        error: (error: any) => {

          console.error(
            'LOAD MONGODB USERS ERROR:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to load users';

          this.users = [];

          this.isLoading = false;

          this.cdr.detectChanges();

        }

      });

  }


  private mapMongoUser(
    row: any
  ): AdminUserItem {

    const id =
      String(
        row?._id ||
        row?.id ||
        ''
      );


    const resolvedName =
      String(
        row?.fullName ||
        row?.name ||
        row?.username ||
        ''
      ).trim() ||
      'New User';


    const email =
      String(
        row?.email || ''
      ).trim() ||
      '-';


    const phone =
      String(
        row?.mobile ||
        row?.phone ||
        ''
      ).trim() ||
      '-';


    const status =
      this.getStatusFromUser(row);


    return {

      id,

      _id: id,

      name: resolvedName,

      email,

      phone,

      role:
        this.getRoleLabel(
          row?.usertypeid,
          row?.role
        ),

      status,

      joinedOn:
        this.formatDate(
          row?.createdAt ||
          row?.createdon
        ),

      avatar:
        resolvedName
          .charAt(0)
          .toUpperCase(),

      isActive:
        row?.isActive !== false,

      isOnboardingCompleted:
        row?.isOnboardingCompleted === true,

      usertypeid:
        Number(
          row?.usertypeid || 1
        ),

      listingtype:
        row?.listingtype ||
        row?.listingType ||
        null,

      rawUser: row

    };

  }


  get filteredUsers():
    AdminUserItem[] {

    const query =
      this.searchQuery
        .trim()
        .toLowerCase();


    if (!query) {

      return this.users;

    }


    return this.users.filter(
      (user) => {

        return (

          user.name
            .toLowerCase()
            .includes(query) ||

          user.email
            .toLowerCase()
            .includes(query) ||

          user.phone
            .toLowerCase()
            .includes(query) ||

          user.role
            .toLowerCase()
            .includes(query) ||

          user.status
            .toLowerCase()
            .includes(query) ||

          user.id
            .toLowerCase()
            .includes(query)

        );

      }
    );

  }


  get totalUsers(): number {

    return this.users.length;

  }


  get activeUsers(): number {

    return this.users.filter(
      (user) =>
        user.status === 'Active'
    ).length;

  }


  get blockedUsers(): number {

    return this.users.filter(
      (user) =>
        user.status === 'Blocked'
    ).length;

  }


  get pendingUsers(): number {

    return this.users.filter(
      (user) =>
        user.status === 'Pending'
    ).length;

  }


  get totalPages(): number {

    return Math.max(
      1,
      Math.ceil(
        this.filteredUsers.length /
        this.pageSize
      )
    );

  }


  get paginatedUsers():
    AdminUserItem[] {

    const start =
      (this.currentPage - 1) *
      this.pageSize;


    return this.filteredUsers.slice(
      start,
      start + this.pageSize
    );

  }


  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.currentPage++;

    }

  }


  prevPage(): void {

    if (
      this.currentPage > 1
    ) {

      this.currentPage--;

    }

  }


  toggleStatus(
    user: AdminUserItem
  ): void {

    const nextIsActive =
      user.status !== 'Active';


    const previousStatus =
      user.status;

    const previousIsActive =
      user.isActive;


    user.isActive =
      nextIsActive;

    user.status =
      nextIsActive
        ? 'Active'
        : 'Blocked';


    this.cdr.detectChanges();


    this.api
      .patch<any>(
        `/admin/users/${user.id}/status`,
        {
          isActive: nextIsActive
        }
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'USER STATUS UPDATED:',
            response
          );

          const updatedUser =
            response?.data;


          if (updatedUser) {

            const mappedUser =
              this.mapMongoUser(
                updatedUser
              );


            Object.assign(
              user,
              mappedUser
            );

          }


          this.errorMessage = '';

          this.cdr.detectChanges();

        },


        error: (error: any) => {

          console.error(
            'USER STATUS UPDATE ERROR:',
            error
          );


          user.isActive =
            previousIsActive;

          user.status =
            previousStatus;


          this.errorMessage =
            error?.error?.message ||
            'Failed to update user status';


          this.cdr.detectChanges();

        }

      });

  }


  getActionLabel(
    user: AdminUserItem
  ): string {

    return user.status === 'Active'
      ? 'Block'
      : 'Activate';

  }


  trackByUser(
    index: number,
    user: AdminUserItem
  ): string {

    return user.id;

  }


  private getRoleLabel(
    usertypeid: any,
    mongoRole: any
  ): string {

    if (
      String(mongoRole)
        .toLowerCase() === 'admin'
    ) {

      return 'Admin';

    }


    switch (
      Number(usertypeid)
    ) {

      case 1:
        return 'User';

      case 2:
        return 'Seller';

      case 3:
        return 'Vendor';

      case 4:
        return 'Buyer & Seller';

      default:
        return 'User';

    }

  }


  private getStatusFromUser(
    user: any
  ): UserStatus {

    if (
      user?.isActive === false
    ) {

      return 'Blocked';

    }


    if (
      user?.isOnboardingCompleted !== true
    ) {

      return 'Pending';

    }


    return 'Active';

  }


  private formatDate(
    value: string | null | undefined
  ): string {

    if (!value) {

      return '-';

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '-';

    }


    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  createPostForUser(
    user: AdminUserItem
  ): void {

    this.selectedUser = user;

    this.showPostModal = true;

  }


  closePostModal(): void {

    this.showPostModal = false;

    this.selectedUser = null;

  }

}