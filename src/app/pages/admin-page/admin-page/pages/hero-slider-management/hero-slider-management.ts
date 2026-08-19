import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';

@Component({
  selector: 'app-hero-slider-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './hero-slider-management.html',
  styleUrl: './hero-slider-management.css'
})
export class HeroSliderManagement implements OnInit {

  desktopImage: File | null = null;
  mobileImage: File | null = null;

  desktopPreview: string | null = null;
  mobilePreview: string | null = null;

  displayOrder = 0;
  active = true;

  heroSliders: any[] = [];

  loading = false;
  errorMessage = '';

  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadHeroSliders();
  }


  // =========================
  // LOAD HERO SLIDERS
  // =========================

  loadHeroSliders(): void {

    this.apiService
      .getAdminHeroSliders()
      .subscribe({

        next: (response) => {

          this.heroSliders =
            response?.data || [];

        },

        error: (error) => {

          console.error(
            'Load hero sliders error:',
            error
          );

          this.errorMessage =
            'Failed to load hero banners';

        }

      });

  }


  // =========================
  // DESKTOP IMAGE
  // =========================

  onDesktopImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      input.files &&
      input.files.length > 0
    ) {

      this.desktopImage =
        input.files[0];

      const reader =
        new FileReader();

      reader.onload = () => {

        this.desktopPreview =
          reader.result as string;

      };

      reader.readAsDataURL(
        this.desktopImage
      );

    }

  }


  // =========================
  // MOBILE IMAGE
  // =========================

  onMobileImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      input.files &&
      input.files.length > 0
    ) {

      this.mobileImage =
        input.files[0];

      const reader =
        new FileReader();

      reader.onload = () => {

        this.mobilePreview =
          reader.result as string;

      };

      reader.readAsDataURL(
        this.mobileImage
      );

    }

  }


  // =========================
  // UPLOAD HERO SLIDER
  // =========================

  uploadSlider(): void {

    if (!this.desktopImage) {

      alert(
        'Please select desktop banner'
      );

      return;

    }

    if (!this.mobileImage) {

      alert(
        'Please select mobile banner'
      );

      return;

    }


    this.loading = true;

    this.errorMessage = '';


    this.apiService
      .uploadHeroSlider(
        this.desktopImage,
        this.mobileImage,
        this.displayOrder,
        this.active
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Hero slider upload response:',
            response
          );


          alert(
            'Hero banner uploaded successfully'
          );


          this.resetForm();

          this.loadHeroSliders();

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'Hero slider upload error:',
            error
          );


          this.errorMessage =
            error?.error?.message ||
            'Failed to upload hero banner';


          alert(
            this.errorMessage
          );


          this.loading = false;

        }

      });

  }


  // =========================
  // DELETE HERO SLIDER
  // =========================

  deleteSlider(id: string): void {

    const confirmed =
      confirm(
        'Are you sure you want to delete this hero banner?'
      );


    if (!confirmed) {
      return;
    }


    this.apiService
      .deleteHeroSlider(id)
      .subscribe({

        next: () => {

          alert(
            'Hero banner deleted successfully'
          );

          this.loadHeroSliders();

        },

        error: (error) => {

          console.error(
            'Delete hero slider error:',
            error
          );


          alert(
            error?.error?.message ||
            'Failed to delete hero banner'
          );

        }

      });

  }


  // =========================
  // RESET FORM
  // =========================

  resetForm(): void {

    this.desktopImage = null;

    this.mobileImage = null;

    this.desktopPreview = null;

    this.mobilePreview = null;

    this.displayOrder = 0;

    this.active = true;

  }

}