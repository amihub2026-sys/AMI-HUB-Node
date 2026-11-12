import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

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
  clickUrl = '';

getSafeClickUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}
  heroSliders: any[] = [];

  loading = false;
  errorMessage = '';

constructor(
  private apiService: ApiService,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit(): void {
    this.loadHeroSliders();
  }


  // =========================
  // LOAD HERO SLIDERS
  // =========================

loadHeroSliders(): void {
  this.errorMessage = '';

  this.apiService
    .getAdminHeroSliders()
    .subscribe({
      next: (response) => {
        this.heroSliders = response?.data || [];

        // Refresh the view immediately after receiving banners.
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Load hero sliders error:', error);

        this.errorMessage =
          error?.error?.message ||
          'Failed to load hero banners';

        this.cdr.markForCheck();
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
  if (this.loading) {
    return;
  }

  this.errorMessage = '';

  if (!this.desktopImage) {
    alert('Please select desktop banner');
    return;
  }

  if (!this.mobileImage) {
    alert('Please select mobile banner');
    return;
  }

  const enteredUrl = this.clickUrl.trim();
  const safeUrl = this.getSafeClickUrl(enteredUrl);

  if (enteredUrl && !safeUrl) {
    this.errorMessage =
      'Please enter a valid URL beginning with https:// or http://';

    alert(this.errorMessage);
    return;
  }

  this.loading = true;

  this.apiService
    .uploadHeroSlider(
      this.desktopImage,
      this.mobileImage,
      this.displayOrder,
      this.active,
      safeUrl || ''
    )
    .subscribe({
      next: () => {
        this.loading = false;

        alert('Hero banner uploaded successfully');

        this.resetForm();
        this.loadHeroSliders();
      },

      error: (error) => {
        this.loading = false;

        this.errorMessage =
          error?.error?.message ||
          'Failed to upload hero banner';

        alert(this.errorMessage);
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
    this.clickUrl = '';
    this.desktopImage = null;

    this.mobileImage = null;

    this.desktopPreview = null;

    this.mobilePreview = null;

    this.displayOrder = 0;

    this.active = true;

  }

}