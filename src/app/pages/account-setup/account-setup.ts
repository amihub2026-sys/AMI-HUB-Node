import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-account-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-setup.html',
  styleUrls: ['./account-setup.css']
})
export class AccountSetup implements OnInit {
  password = '';
  confirmPassword = '';

  userType: '' | 'buyer' | 'seller' | 'both' = '';
  listingType: '' | 'product' | 'service' = '';

  isSubmitting = false;
  currentUser: any = null;

  constructor(
  private router: Router,
  private apiService: ApiService
) {}

  ngOnInit() {

  const token = localStorage.getItem('token');

  if (!token) {
    this.router.navigate(['/login']);
    return;
  }

}

  private mapUserTypeFromDb(usertypeid: any): '' | 'buyer' | 'seller' | 'both' {
    const id = Number(usertypeid);

    if (id === 1) return 'buyer';
    if (id === 2) return 'seller';
    if (id === 4) return 'both';

    return '';
  }

  private mapUserTypeToDb(userType: string): number {
    if (userType === 'buyer') return 1;
    if (userType === 'seller') return 2;
    if (userType === 'both') return 4;

    return 1;
  }

   submitSetup() {

  if (this.isSubmitting) return;


  if (!this.userType) {

    alert('Please select user type');
    return;

  }


  if (
    this.password &&
    this.password !== this.confirmPassword
  ) {

    alert(
      'Password and confirm password do not match'
    );

    return;

  }


  this.isSubmitting = true;


  const payload = {

    usertypeid:
      this.mapUserTypeToDb(this.userType),

    listingtype:
      this.listingType || null

  };


  this.apiService
    .put(
      '/user/onboarding',
      payload
    )
    .subscribe({

      next:(res:any)=>{

        console.log(
          "ONBOARDING SUCCESS",
          res
        );


        localStorage.setItem(
          'userTypeId',
          String(payload.usertypeid)
        );


        localStorage.setItem(
          'isOnboardingCompleted',
          'true'
        );


        alert(
          'Account setup completed'
        );


        this.router.navigate(['/']);

      },


      error:(err:any)=>{

        console.error(
          "ONBOARDING ERROR",
          err
        );


        alert(
          err.error?.message ||
          'Failed to save account setup'
        );


      },


      complete:()=>{

        this.isSubmitting = false;

      }

    });

}
}
