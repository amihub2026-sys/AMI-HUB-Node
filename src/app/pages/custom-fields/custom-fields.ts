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

  flowType = '';

  postId = '';

  private router = inject(Router);

  private route = inject(ActivatedRoute);

  private api = inject(ApiService);


  categoryId = '';

  categoryName = '';

  subcategoryId = '';

  subcategoryName = '';

  listingType = '';


  fields: DynamicCustomField[] = [];

  formData: Record<string, any> = {};


  isLoading = false;

  isSubmitting = false;

  submitted = false;


  loadError = '';

  submitError = '';


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.readNavigationData();


    if (!this.subcategoryId) {

      this.loadError =
        'Subcategory information is missing. Please select a subcategory again.';

      return;
    }


    this.loadCustomFields();
  }


  // =========================================================
  // READ DATA FROM SERVICE PAGE
  // =========================================================

  private readNavigationData(): void {

    const navigationState =
      this.router.getCurrentNavigation()?.extras?.state;


    const historyState =
      history.state || {};


    const state = {

      ...historyState,

      ...navigationState

    };


    this.flowType =
      state['flow'] || '';


    this.postId =
      state['postId'] || '';


    this.categoryId =

      state['categoryId'] ||

      this.route.snapshot.queryParamMap.get(
        'categoryId'
      ) ||

      '';


    this.categoryName =

      state['categoryName'] ||

      state['category'] ||

      this.route.snapshot.queryParamMap.get(
        'categoryName'
      ) ||

      '';


    this.subcategoryId =

      state['subcategoryId'] ||

      this.route.snapshot.queryParamMap.get(
        'subcategoryId'
      ) ||

      '';


    this.subcategoryName =

      state['subcategoryName'] ||

      state['subcategory'] ||

      this.route.snapshot.queryParamMap.get(
        'subcategoryName'
      ) ||

      '';


    this.listingType =

      state['type'] ||

      state['listingType'] ||

      localStorage.getItem(
        'listingType'
      ) ||

      localStorage.getItem(
        'pending_post_type'
      ) ||

      '';

  }


  // =========================================================
  // LOAD CUSTOM FIELDS
  // =========================================================

  loadCustomFields(): void {

    if (!this.subcategoryId) {

      this.loadError =
        'Subcategory ID is missing. Please go back and select a subcategory.';

      return;
    }


    this.isLoading = true;

    this.loadError = '';

    this.fields = [];


    this.api

      .get(
        `/custom-field-assignment?categoryId=${this.categoryId}&subcategoryId=${this.subcategoryId}&type=${this.listingType}`
      )

      .subscribe({

        next: (response: any) => {

          const receivedFields =

            response?.data ||

            response?.fields ||

            response?.customFields ||

            response ||

            [];


          this.fields = Array.isArray(
            receivedFields
          )

            ? receivedFields

                .map(
                  (field: any) =>
                    this.normalizeField(field)
                )


                // Only active fields
                .filter(
                  (
                    field: DynamicCustomField
                  ) =>
                    field.isActive
                )


                // Hide City / State / Country
                .filter(
                  (
                    field: DynamicCustomField
                  ) => {

                    const normalize =
                      (value: string) =>

                        String(value || '')

                          .trim()

                          .toLowerCase()

                          .replace(
                            /[\s_-]+/g,
                            ''
                          );


                    const fieldName =
                      normalize(
                        field.fieldName
                      );


                    const label =
                      normalize(
                        field.label
                      );


                    const hiddenLocationFields = [

                      'city',

                      'cityname',

                      'state',

                      'statename',

                      'country',

                      'countryname'

                    ];


                    return (

                      !hiddenLocationFields.includes(
                        fieldName
                      ) &&

                      !hiddenLocationFields.includes(
                        label
                      )

                    );

                  }
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


  // =========================================================
  // NORMALIZE FIELD
  // =========================================================

  private normalizeField(
    field: any
  ): DynamicCustomField {


    const actualField =

      field.customFieldId ||

      field;


    return {

      _id:

        actualField._id ||

        '',


      fieldName:

        actualField.fieldName ||

        actualField.name ||

        this.createFieldName(
          actualField.label ||
          'field'
        ),


      label:

        actualField.label ||

        actualField.fieldName ||

        'Field',


      icon:

        actualField.icon ||

        '',


      fieldType:

        actualField.fieldType ||

        actualField.type ||

        'text',


      options:

        Array.isArray(
          actualField.options
        )

          ? actualField.options

          : [],


      placeholder:

        actualField.placeholder ||

        '',


      helpText:

        actualField.helpText ||

        actualField.description ||

        '',


      isRequired:

        Boolean(

          field.isRequired ||

          actualField.isRequired

        ),


      isActive:

        actualField.isActive !== false,


      sortOrder:

        Number(

          field.sortOrder ||

          actualField.sortOrder ||

          0

        )

    };

  }


  // =========================================================
  // CREATE SAFE FIELD NAME
  // =========================================================

  private createFieldName(
    value: string
  ): string {

    return value

      .toLowerCase()

      .trim()

      .replace(
        /[^a-z0-9]+/g,
        '_'
      )

      .replace(
        /^_+|_+$/g,
        ''
      );

  }


  // =========================================================
  // INITIALIZE FORM VALUES
  // =========================================================

  private initializeFormData(): void {

    this.fields.forEach(

      (
        field: DynamicCustomField
      ) => {

        if (
          this.formData[
            field.fieldName
          ] !== undefined
        ) {

          return;

        }


        if (

          field.fieldType ===
            'checkbox' &&

          field.options.length > 0

        ) {

          this.formData[
            field.fieldName
          ] = [];

        }

        else if (
          field.fieldType ===
          'checkbox'
        ) {

          this.formData[
            field.fieldName
          ] = false;

        }

        else {

          this.formData[
            field.fieldName
          ] = '';

        }

      }

    );

  }


  // =========================================================
  // CHECKBOX
  // =========================================================

  isCheckboxSelected(
    fieldName: string,
    option: string
  ): boolean {

    const selectedValues =
      this.formData[
        fieldName
      ];


    return (

      Array.isArray(
        selectedValues
      ) &&

      selectedValues.includes(
        option
      )

    );

  }


  onCheckboxChange(
    fieldName: string,
    option: string,
    checked: boolean
  ): void {

    if (
      !Array.isArray(
        this.formData[fieldName]
      )
    ) {

      this.formData[
        fieldName
      ] = [];

    }


    if (checked) {

      if (
        !this.formData[
          fieldName
        ].includes(
          option
        )
      ) {

        this.formData[
          fieldName
        ].push(
          option
        );

      }

    }

    else {

      this.formData[
        fieldName
      ] =

        this.formData[
          fieldName
        ].filter(

          (
            selectedOption: string
          ) =>

            selectedOption !==
            option

        );

    }

  }


  // =========================================================
  // VALIDATE FIELD VALUE
  // =========================================================

  hasFieldValue(
    field: DynamicCustomField
  ): boolean {

    const value =
      this.formData[
        field.fieldName
      ];


    if (

      field.fieldType ===
        'checkbox' &&

      field.options.length > 0

    ) {

      return (

        Array.isArray(
          value
        ) &&

        value.length > 0

      );

    }


    if (
      field.fieldType ===
      'checkbox'
    ) {

      return value === true;

    }


    if (
      value === null ||
      value === undefined
    ) {

      return false;

    }


    return String(
      value
    ).trim().length > 0;

  }


  private validateRequiredFields():
    boolean {

    return this.fields.every(

      (
        field:
          DynamicCustomField
      ) => {

        if (
          !field.isRequired
        ) {

          return true;

        }


        return this.hasFieldValue(
          field
        );

      }

    );

  }


  // =========================================================
  // LOGIN CHECK
  // =========================================================

  isLoggedIn(): boolean {

    return Boolean(
      localStorage.getItem(
        'token'
      )
    );

  }


  // =========================================================
  // SUBMIT CUSTOM FIELDS
  // =========================================================

 submitCustomFields(form: NgForm): void {

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
          categoryId: this.categoryId,
          categoryName: this.categoryName,
          subcategoryId: this.subcategoryId,
          subcategoryName: this.subcategoryName,
          customFieldValues: customFieldValues,
          returnUrl: '/custom-fields'
        }
      }
    );

    return;
  }

  this.isSubmitting = true;

  // EDIT MODE ONLY
  if (this.flowType === 'edit') {

    this.updateEditedPost(
      customFieldValues
    );

    return;
  }

  // NORMAL ADVERTISEMENT FLOW
  this.saveCustomFieldsAndContinue(
    customFieldValues
  );
}


  // =========================================================
  // SAVE CUSTOM FIELD DRAFT
  // THEN GO TO ACCOUNT DETAILS
  // =========================================================

  private saveCustomFieldsAndContinue(
    customFieldValues: any[]
  ): void {

    const savedPayload =

      localStorage.getItem(
        'pending_post_payload'
      );


    if (!savedPayload) {

      this.isSubmitting =
        false;


      this.submitError =
        'Post information was not found. Please go back and try again.';


      return;

    }


    let pendingPost: any;


    try {

      pendingPost =
        JSON.parse(
          savedPayload
        );

    }

    catch (error) {

      console.error(
        'INVALID PENDING POST PAYLOAD:',
        error
      );


      this.isSubmitting =
        false;


      this.submitError =
        'Unable to read the post information.';


      return;

    }


    const finalPendingPayload = {

      ...pendingPost,


      categoryId:

        this.categoryId ||

        pendingPost?.categoryId ||

        null,


      subcategoryId:

        this.subcategoryId ||

        pendingPost?.subcategoryId ||

        null,


      listingType:

        this.listingType ||

        pendingPost?.listingType ||

        pendingPost?.adtype ||

        'service',


      customFields:
        customFieldValues,


      custom_fields:
        customFieldValues

    };


    // ===============================================
    // STORE UPDATED POST DRAFT
    // DO NOT CREATE POST HERE
    // ===============================================

    localStorage.setItem(

      'pending_post_payload',

      JSON.stringify(
        finalPendingPayload
      )

    );


    // ===============================================
    // STORE CUSTOM FIELD DATA
    // PAYMENT PAGE WILL USE THIS LATER
    // ===============================================

    localStorage.setItem(

      'pending_custom_fields',

      JSON.stringify(
        customFieldValues
      )

    );


    // ===============================================
    // MARK THIS AS ADVERTISEMENT FLOW
    // ===============================================

    localStorage.setItem(
      'advertisement_flow',
      'true'
    );


    this.isSubmitting =
      false;


    // ===============================================
    // NEXT STEP = ACCOUNT DETAILS
    // ===============================================

  const user = JSON.parse(
  localStorage.getItem('user') || '{}'
);

const accountAlreadyCompleted =
  user?.isSeller === true &&
  user?.isOnboardingCompleted === true;


// IF PROFILE ALREADY SAVED
if (accountAlreadyCompleted) {

  this.router.navigate(
    ['/subscription-plan'],
    {
      queryParams: {
        flow: 'normal'
      }
    }
  );

  return;
}


// FIRST TIME ONLY
this.router.navigate(
  ['/seller-profile'],
  {
    state: {
      next: 'plan-selection',
      flow: 'advertisement',

      categoryId: this.categoryId,
      categoryName: this.categoryName,

      subcategoryId: this.subcategoryId,
      subcategoryName: this.subcategoryName,

      listingType: this.listingType
    }
  }
);

  }


  // =========================================================
  // UPDATE EXISTING POST
  // EDIT FLOW ONLY
  // =========================================================

  private updateEditedPost(
    customFieldValues: any[]
  ): void {

    const savedEditPayload =

      localStorage.getItem(
        'edit_post_payload'
      );


    if (!savedEditPayload) {

      this.isSubmitting =
        false;


      this.submitError =
        'Edited post data not found. Please go back and try again.';


      return;

    }


    let editData: any;


    try {

      editData =
        JSON.parse(
          savedEditPayload
        );

    }

    catch (error) {

      console.error(
        'Invalid edit payload:',
        error
      );


      this.isSubmitting =
        false;


      this.submitError =
        'Unable to read edited post data.';


      return;

    }


    const postId =

      this.postId ||

      editData?.postId;


    if (!postId) {

      this.isSubmitting =
        false;


      this.submitError =
        'Post ID not found.';


      return;

    }


    const finalPayload = {

      ...(editData?.payload || {}),

      customFields:
        customFieldValues,

      custom_fields:
        customFieldValues

    };


    this.api

      .put(
        `/posts/${postId}`,
        finalPayload
      )

      .subscribe({

        next: (
          response: any
        ) => {

          console.log(
            'Post updated successfully:',
            response
          );


          localStorage.removeItem(
            'edit_post_payload'
          );


          this.isSubmitting =
            false;


          this.router.navigate(
            ['/my-posts']
          );

        },


        error: (
          error: any
        ) => {

          console.error(
            'Post update error:',
            error
          );


          this.isSubmitting =
            false;


          this.submitError =

            error?.error?.message ||

            'Unable to update the post. Please try again.';

        }

      });

  }


  // =========================================================
  // BUILD CUSTOM FIELD ARRAY
  // =========================================================

  private buildCustomFieldValues():
    any[] {

    return this.fields.map(

      (
        field:
          DynamicCustomField
      ) => ({

        customFieldId:
          field._id,


        fieldName:
          field.fieldName,


        label:
          field.label,


        icon:
          field.icon || '',


        fieldType:
          field.fieldType,


        value:
          this.formData[
            field.fieldName
          ]

      })

    );

  }


  // =========================================================
  // SCROLL TO VALIDATION ERROR
  // =========================================================

  private scrollToFirstError():
    void {

    setTimeout(
      () => {

        const errorElement =
          document.querySelector(
            '.validation-error'
          );


        errorElement?.scrollIntoView(
          {
            behavior: 'smooth',
            block: 'center'
          }
        );

      },
      50
    );

  }


  // =========================================================
  // BACK
  // =========================================================

  goBack(): void {

    window.history.back();

  }


  // =========================================================
  // TRACK BY
  // =========================================================

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

}