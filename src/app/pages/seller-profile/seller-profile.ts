import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  ApiService
} from '../../services/api.service';

import {
  SnackbarService
} from '../../services/snackbar.service';


@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './seller-profile.html',
  styleUrls: ['./seller-profile.css']
})
export class SellerProfileComponent implements OnInit, OnDestroy {

  private platformId = inject(PLATFORM_ID);

  seller: any = {
    name: '',
    email: '',
    phone: '',

    profileImage: null,
    kycImage: null,
    qrCodeImage: null,

    termsAccepted: false
  };


  // ==============================
  // FILES WAITING TO UPLOAD
  // ==============================

  private profileImageFile: File | null = null;
  private kycImageFile: File | null = null;
  private qrCodeImageFile: File | null = null;


  stars = [1, 2, 3, 4, 5];

  redirectTo = '';

  isLoading = false;

  isEditMode = false;

  showPassword = false;


  constructor(
    private router: Router,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService
  ) {}


  ngOnInit() {

    if (!this.isBrowser()) {
      return;
    }

    const nav =
      this.router.getCurrentNavigation();

    const state =
      history.state;


    this.redirectTo =
      nav?.extras?.state?.['next'] ||
      state?.['next'] ||
      '';


    this.loadSellerProfile();

  }


  ngOnDestroy() {}


  private isBrowser() {

    return isPlatformBrowser(
      this.platformId
    );

  }


  get submitButtonText() {

    return this.isEditMode
      ? 'Edit Profile'
      : 'Create Profile';

  }


  togglePassword() {

    this.showPassword =
      !this.showPassword;

  }


  // ==============================
  // LOAD PROFILE
  // ==============================

  loadSellerProfile() {

    this.isLoading = true;


    this.apiService
      .get('/profile/me')
      .subscribe({

        next: (res: any) => {

          const profile =
            res.data;


          this.seller = {

            name:
              profile.fullName || '',

            email:
              profile.email || '',

            phone:
              profile.mobile || '',

            profileImage:
              profile.profileImage || null,

            kycImage:
              profile.kycImage || null,

            qrCodeImage:
              profile.qrCodeImage || null,

            termsAccepted:
              profile.termsAccepted || false

          };


          this.isEditMode = true;

          this.isLoading = false;

          this.cdr.detectChanges();

        },


        error: () => {

          console.log(
            'No profile found'
          );


          this.isEditMode = false;

          this.isLoading = false;

          this.cdr.detectChanges();

        }

      });

  }


  // ==============================
  // PROFILE IMAGE
  // ==============================

  uploadProfileImage(event: Event) {

    const input =
      event.target as HTMLInputElement;


    if (!input.files?.length) {
      return;
    }


    const file =
      input.files[0];


    this.profileImageFile =
      file;


    // preview only

    const reader =
      new FileReader();


    reader.onload = () => {

      this.seller.profileImage =
        reader.result;

      this.cdr.detectChanges();

    };


    reader.readAsDataURL(file);

  }


  // ==============================
  // KYC IMAGE
  // ==============================

  uploadKYC(event: Event) {

    const input =
      event.target as HTMLInputElement;


    if (!input.files?.length) {
      return;
    }


    const file =
      input.files[0];


    this.kycImageFile =
      file;


    // preview only

    const reader =
      new FileReader();


    reader.onload = () => {

      this.seller.kycImage =
        reader.result;

      this.cdr.detectChanges();

    };


    reader.readAsDataURL(file);

  }


  // ==============================
  // QR IMAGE
  // ==============================

  uploadQR(event: Event) {

    const input =
      event.target as HTMLInputElement;


    if (!input.files?.length) {
      return;
    }


    const file =
      input.files[0];


    this.qrCodeImageFile =
      file;


    // preview only

    const reader =
      new FileReader();


    reader.onload = () => {

      this.seller.qrCodeImage =
        reader.result;

      this.cdr.detectChanges();

    };


    reader.readAsDataURL(file);

  }


  // ==============================
  // REMOVE PROFILE IMAGE
  // ==============================

  removeProfileImage() {

    this.seller.profileImage =
      null;

    this.profileImageFile =
      null;

  }


  // ==============================
  // UPLOAD ONE FILE TO R2
  // ==============================

  private uploadFileToR2(
    file: File,
    folder: string
  ): Promise<string> {

    return new Promise(
      (resolve, reject) => {

        this.apiService
          .uploadImage(
            file,
            folder
          )
          .subscribe({

            next: (res: any) => {

              if (
                res?.success &&
                res?.publicUrl
              ) {

                resolve(
                  res.publicUrl
                );

              }
              else {

                reject(
                  new Error(
                    'Upload failed'
                  )
                );

              }

            },


            error: (err) => {

              reject(err);

            }

          });

      }
    );

  }


  // ==============================
  // SUBMIT PROFILE
  // ==============================

  async submitProfile() {

    if (
      !this.seller.termsAccepted
    ) {

      this.showMessage(
        'Accept Terms',
        'info'
      );

      return;

    }


    if (
      this.seller.phone &&
      !/^\d{10}$/.test(
        this.seller.phone
      )
    ) {

      this.showMessage(
        'Phone number must be exactly 10 digits',
        'error'
      );

      return;

    }


    this.isLoading = true;


    try {

      // ======================================
      // 1. CURRENT SAVED URLS
      // ======================================

      let profileImageUrl =
        this.seller.profileImage;

      let kycImageUrl =
        this.seller.kycImage;

      let qrCodeImageUrl =
        this.seller.qrCodeImage;


      // ======================================
      // 2. UPLOAD NEW PROFILE IMAGE
      // ======================================

      if (
        this.profileImageFile
      ) {

        profileImageUrl =
          await this.uploadFileToR2(
            this.profileImageFile,
            'seller-profile/profile'
          );

      }


      // ======================================
      // 3. UPLOAD NEW KYC IMAGE
      // ======================================

      if (
        this.kycImageFile
      ) {

        kycImageUrl =
          await this.uploadFileToR2(
            this.kycImageFile,
            'seller-profile/kyc'
          );

      }


      // ======================================
      // 4. UPLOAD NEW QR IMAGE
      // ======================================

      if (
        this.qrCodeImageFile
      ) {

        qrCodeImageUrl =
          await this.uploadFileToR2(
            this.qrCodeImageFile,
            'seller-profile/qr'
          );

      }


      // ======================================
      // 5. BUILD PROFILE PAYLOAD
      // ======================================

      const payload = {

        fullName:
          this.seller.name,

        email:
          this.seller.email,

        mobile:
          this.seller.phone,

        profileImage:
          profileImageUrl,

        kycImage:
          kycImageUrl,

        qrCodeImage:
          qrCodeImageUrl,

        termsAccepted:
          this.seller.termsAccepted

      };


      // ======================================
      // 6. CREATE / UPDATE PROFILE
      // ======================================

      const request =
        this.isEditMode

          ? this.apiService.put(
              '/profile/me',
              payload
            )

          : this.apiService.post(
              '/profile',
              payload
            );


      request.subscribe({

        next: (res: any) => {

          console.log(
            'PROFILE SAVED',
            res
          );


          // replace previews with real R2 URLs

          this.seller.profileImage =
            profileImageUrl;

          this.seller.kycImage =
            kycImageUrl;

          this.seller.qrCodeImage =
            qrCodeImageUrl;


          // clear selected files

          this.profileImageFile =
            null;

          this.kycImageFile =
            null;

          this.qrCodeImageFile =
            null;


          const user =
            JSON.parse(
              localStorage.getItem(
                'user'
              ) || '{}'
            );


          user.isSeller =
            true;

          user.isOnboardingCompleted =
            true;

          user.fullName =
            this.seller.name;

          user.mobile =
            this.seller.phone;

          user.email =
            this.seller.email;


          localStorage.setItem(
            'user',
            JSON.stringify(user)
          );


          this.isLoading =
            false;

          this.isEditMode =
            true;


          this.showMessage(
            'Profile saved successfully',
            'success'
          );


          if (
            this.redirectTo ===
            'post-product'
          ) {

            this.router.navigate(
              ['/post-ad']
            );

          }

          else if (
            this.redirectTo ===
            'post-service'
          ) {

            this.router.navigate(
              ['/service']
            );

          }

          else {

            this.router.navigate(
              ['/']
            );

          }

        },


        error: (err) => {

          console.error(
            'PROFILE ERROR',
            err
          );


          this.isLoading =
            false;


          this.showMessage(
            'Failed to save profile',
            'error'
          );

        }

      });


    }
    catch (error) {

      console.error(
        'IMAGE UPLOAD ERROR',
        error
      );


      this.isLoading =
        false;


      this.showMessage(
        'Failed to upload image',
        'error'
      );

    }

  }


  private showMessage(
    message: string,
    type:
      'success' |
      'error' |
      'info' =
      'info'
  ) {

    this.snackbar.show(
      message,
      type
    );

  }


  goBack(event: Event) {

    event.preventDefault();

    event.stopPropagation();

    this.router.navigateByUrl(
      '/home'
    );

  }

}