import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-subcategories',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './subcategories.html',

  styleUrl: './subcategories.css'
})
export class Subcategories implements OnChanges {
  @Input()
categoryType: 'product' | 'service' | 'all' = 'all';

  @Input()
  selectedCategory: any = null;

  @Output()
  subcategorySelected = new EventEmitter<any>();

  @Output()
  back = new EventEmitter<void>();

  subcategories: any[] = [];

  isLoading = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['selectedCategory'] &&
      this.selectedCategory
    ) {
      this.loadSubcategories();
    }
  }

  loadSubcategories(): void {

    const categoryId = String(
      this.selectedCategory?._id ||
      this.selectedCategory?.categoryid ||
      this.selectedCategory?.id ||
      ''
    );

    if (!categoryId) {
      this.subcategories = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.subcategories = [];

 this.api.get<any>(
  `/subcategories/category/${categoryId}?type=${this.categoryType}`
)
    .subscribe({

      next: (res) => {

        console.log(
          'MONGO SUBCATEGORIES:',
          res
        );

        this.subcategories = (res?.data || []).map(
          (item: any) => ({
            ...item,

            subcategoryid: String(item?._id || ''),

            subcategoryname:
              item?.subcategoryName ||
              item?.subcategoryname ||
              '',

            iconurl:
              this.getMediaUrl(
                item?.icon ||
                item?.iconurl ||
                ''
              )
          })
        );

        this.isLoading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'SUBCATEGORY ERROR:',
          err
        );

        this.subcategories = [];
        this.isLoading = false;

        this.cdr.detectChanges();
      }
    });
  }

  selectSubcategory(sub: any): void {
    this.subcategorySelected.emit(sub);
  }

  backToCategories(): void {
    this.back.emit();
  }

  private getMediaUrl(url: string): string {

    if (!url) {
      return '';
    }

    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }

    const backendUrl =
      environment.apiUrl.replace('/api', '');

    return `${backendUrl}${
      url.startsWith('/') ? url : '/' + url
    }`;
  }
}