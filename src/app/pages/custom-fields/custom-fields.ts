import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormsModule,
  NgForm
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { ApiService } from '../../services/api.service';


interface DynamicCustomField {
  _id: string;

  fieldName: string;

  label: string;

  icon?: string;

  fieldType:
    | 'text'
    | 'number'
    | 'dropdown'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'textarea'
    | 'date';

  options: string[];

  placeholder?: string;

  helpText?: string;

  isRequired: boolean;

  isActive: boolean;

  sortOrder?: number;
}


@Component({
  selector: 'app-custom-fields',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './custom-fields.html',

  styleUrls: ['./custom-fields.css']
})
export class CustomFields implements OnInit {

  private router = inject(Router);

  private route = inject(ActivatedRoute);

  private api = inject(ApiService);


  categoryId = '';

  categoryName = '';

  subcategoryId = '';

  subcategoryName = '';


  fields: DynamicCustomField[] = [];

  formData: Record<string, any> = {};


  isLoading = false;

  isSubmitting = false;

  submitted = false;


  loadError = '';

  submitError = '';


  ngOnInit(): void {

    this.readNavigationData();

    if (!this.subcategoryId) {

      this.loadError =
        'Subcategory information is missing. Please select a subcategory again.';

      return;
    }

    this.loadCustomFields();
  }


  private readNavigationData(): void {

    const navigationState =
      this.router.getCurrentNavigation()?.extras?.state;

    const historyState = history.state || {};

    const state = {
      ...historyState,
      ...navigationState
    };


    this.categoryId =
      state['categoryId'] ||
      this.route.snapshot.queryParamMap.get('categoryId') ||
      '';


    this.categoryName =
      state['categoryName'] ||
      state['category'] ||
      this.route.snapshot.queryParamMap.get('categoryName') ||
      '';


    this.subcategoryId =
      state['subcategoryId'] ||
      this.route.snapshot.queryParamMap.get('subcategoryId') ||
      '';


    this.subcategoryName =
      state['subcategoryName'] ||
      state['subcategory'] ||
      this.route.snapshot.queryParamMap.get('subcategoryName') ||
      '';
  }


  loadCustomFields(): void {

    if (!this.subcategoryId) {

      this.loadError =
        'Subcategory ID is missing. Please go back and select a subcategory.';

      return;
    }


    this.isLoading = true;

    this.loadError = '';

    this.fields = [];


    /*
      Expected backend route:

      GET /custom-fields/subcategory/:subcategoryId

      The backend should return only fields assigned
      to the selected subcategory.
    */

    this.api
      .get(
        `/custom-fields/subcategory/${this.subcategoryId}`
      )
      .subscribe({

        next: (response: any) => {

          const receivedFields =
            response?.data ||
            response?.fields ||
            response?.customFields ||
            response ||
            [];


          this.fields = Array.isArray(receivedFields)
            ? receivedFields
                .map((field: any) =>
                  this.normalizeField(field)
                )
                .filter(
                  (field: DynamicCustomField) =>
                    field.isActive
                )
                .sort(
                  (
                    first: DynamicCustomField,
                    second: DynamicCustomField
                  ) =>
                    (first.sortOrder || 0) -
                    (second.sortOrder || 0)
                )
            : [];


          this.initializeFormData();

          this.isLoading = false;
        },


        error: (error: any) => {

          console.error(
            'Custom fields loading error:',
            error
          );

          this.loadError =
            error?.error?.message ||
            'Unable to load additional fields. Please try again.';

          this.isLoading = false;
        }

      });
  }


  private normalizeField(
    field: any
  ): DynamicCustomField {

    return {

      _id:
        field?._id ||
        field?.customFieldId ||
        '',


      fieldName:
        field?.fieldName ||
        field?.name ||
        this.createFieldName(field?.label || 'field'),


      label:
        field?.label ||
        field?.fieldName ||
        field?.name ||
        'Field',


      icon:
        field?.icon || '',


      fieldType:
        field?.fieldType ||
        field?.type ||
        'text',


      options:
        Array.isArray(field?.options)
          ? field.options
          : [],


      placeholder:
        field?.placeholder || '',


      helpText:
        field?.helpText ||
        field?.description ||
        '',


      isRequired:
        Boolean(field?.isRequired),


      isActive:
        field?.isActive !== false,


      sortOrder:
        Number(field?.sortOrder || 0)
    };
  }


  private createFieldName(
    value: string
  ): string {

    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }


  private initializeFormData(): void {

    this.fields.forEach(
      (field: DynamicCustomField) => {

        if (
          this.formData[field.fieldName] !== undefined
        ) {
          return;
        }


        if (
          field.fieldType === 'checkbox' &&
          field.options.length > 0
        ) {

          this.formData[field.fieldName] = [];

        } else if (
          field.fieldType === 'checkbox'
        ) {

          this.formData[field.fieldName] = false;

        } else {

          this.formData[field.fieldName] = '';

        }

      }
    );
  }


  isCheckboxSelected(
    fieldName: string,
    option: string
  ): boolean {

    const selectedValues =
      this.formData[fieldName];

    return (
      Array.isArray(selectedValues) &&
      selectedValues.includes(option)
    );
  }


  onCheckboxChange(
    fieldName: string,
    option: string,
    checked: boolean
  ): void {

    if (
      !Array.isArray(this.formData[fieldName])
    ) {

      this.formData[fieldName] = [];
    }


    if (checked) {

      if (
        !this.formData[fieldName].includes(option)
      ) {

        this.formData[fieldName].push(option);
      }

    } else {

      this.formData[fieldName] =
        this.formData[fieldName].filter(
          (selectedOption: string) =>
            selectedOption !== option
        );

    }
  }


  hasFieldValue(
    field: DynamicCustomField
  ): boolean {

    const value =
      this.formData[field.fieldName];


    if (
      field.fieldType === 'checkbox' &&
      field.options.length > 0
    ) {

      return (
        Array.isArray(value) &&
        value.length > 0
      );
    }


    if (
      field.fieldType === 'checkbox'
    ) {

      return value === true;
    }


    if (
      value === null ||
      value === undefined
    ) {

      return false;
    }


    return String(value).trim().length > 0;
  }


  private validateRequiredFields(): boolean {

    return this.fields.every(
      (field: DynamicCustomField) => {

        if (!field.isRequired) {
          return true;
        }

        return this.hasFieldValue(field);
      }
    );
  }


  isLoggedIn(): boolean {

    return Boolean(
      localStorage.getItem('userToken')
    );
  }


  submitCustomFields(
    form: NgForm
  ): void {

    this.submitted = true;

    this.submitError = '';


    if (
      form.invalid ||
      !this.validateRequiredFields()
    ) {

      this.submitError =
        'Please complete all required fields.';

      this.scrollToFirstError();

      return;
    }


    const customFieldValues =
      this.buildCustomFieldValues();


    if (!this.isLoggedIn()) {

      this.router.navigate(
        ['/login'],
        {
          state: {

            categoryId:
              this.categoryId,

            categoryName:
              this.categoryName,

            subcategoryId:
              this.subcategoryId,

            subcategoryName:
              this.subcategoryName,

            customFieldValues:
              customFieldValues,

            returnUrl:
              '/custom-fields'
          }
        }
      );

      return;
    }


    this.isSubmitting = true;


    /*
      The custom field values are passed to the
      subscription page.

      When the final post is submitted, include
      customFieldValues in the post API payload.
    */

    this.router.navigate(
      ['/subscription-plan'],
      {
        state: {

          categoryId:
            this.categoryId,

          categoryName:
            this.categoryName,

          subcategoryId:
            this.subcategoryId,

          subcategoryName:
            this.subcategoryName,

          customFieldValues:
            customFieldValues
        }
      }
    )
    .then(() => {

      this.isSubmitting = false;

    })
    .catch(() => {

      this.isSubmitting = false;

      this.submitError =
        'Unable to continue. Please try again.';

    });
  }


  private buildCustomFieldValues(): any[] {

    return this.fields.map(
      (field: DynamicCustomField) => ({

        customFieldId:
          field._id,

        fieldName:
          field.fieldName,

        label:
          field.label,

        fieldType:
          field.fieldType,

        value:
          this.formData[field.fieldName]

      })
    );
  }


  private scrollToFirstError(): void {

    setTimeout(() => {

      const errorElement =
        document.querySelector(
          '.validation-error'
        );

      errorElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

    }, 50);
  }


  goBack(): void {

    window.history.back();
  }


  trackByField(
    index: number,
    field: DynamicCustomField
  ): string {

    return (
      field._id ||
      field.fieldName ||
      String(index)
    );
  }
goToSubscription(): void {

  this.router.navigate(['/subscription-plan'], {
    queryParams: {
      flow: 'normal'
    },
    state: {
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      subcategoryId: this.subcategoryId,
      subcategoryName: this.subcategoryName
    }
  });

}
}