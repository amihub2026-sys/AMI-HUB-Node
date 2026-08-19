import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  ngOnInit(): void {
  }

  onDesktopImageSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {

      this.desktopImage = input.files[0];

      const reader = new FileReader();

      reader.onload = () => {
        this.desktopPreview = reader.result as string;
      };

      reader.readAsDataURL(this.desktopImage);
    }
  }

  onMobileImageSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {

      this.mobileImage = input.files[0];

      const reader = new FileReader();

      reader.onload = () => {
        this.mobilePreview = reader.result as string;
      };

      reader.readAsDataURL(this.mobileImage);
    }
  }

  uploadSlider(): void {

    if (!this.desktopImage) {
      alert('Please select desktop banner');
      return;
    }

    if (!this.mobileImage) {
      alert('Please select mobile banner');
      return;
    }

    console.log('Desktop Image:', this.desktopImage);
    console.log('Mobile Image:', this.mobileImage);
    console.log('Order:', this.displayOrder);
    console.log('Active:', this.active);

    alert('Banner selected successfully');
  }

  deleteSlider(id: number): void {
    console.log('Delete:', id);
  }

}