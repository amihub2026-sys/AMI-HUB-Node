import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';


@Component({
  selector: 'app-admin-custom-field-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-custom-field-assignment.html',
  styleUrls: ['./admin-custom-field-assignment.css']
})
export class AdminCustomFieldAssignment implements OnInit {


  private api = inject(ApiService);


  // Product / Service
  selectedType: string = 'product';


  // Categories
  categories:any[] = [];
  selectedCategoryId:string = '';


  // Subcategories
  subcategories:any[] = [];
  selectedSubcategoryId:string = '';


  // Custom fields
  customFields:any[] = [];
  assignments:any[] = [];

isLoadingAssignments = false;

  selectedFieldIds:string[] = [];
  editingAssignmentId:string | null = null;

editRequired:boolean = false;

editSortOrder:number = 0;


  searchText:string = '';



ngOnInit(): void {

  this.loadCategories();

  this.loadCustomFields();

  this.loadAssignments();

}



  // ==============================
  // LOAD CATEGORY
  // ==============================

  loadCategories(){

    this.api.get('/categories')
    .subscribe({

      next:(res:any)=>{

        const rows = res.data || [];


        this.categories =
        rows.filter((cat:any)=>{


          return cat.availableIn?.includes(
            this.selectedType
          );


        });



        console.log(
          "FILTERED CATEGORIES",
          this.categories
        );


      },


      error:(err)=>{

        console.error(
          "Category error",
          err
        );

      }

    });

  }



  // ==============================
  // TYPE CHANGE
  // ==============================

  onTypeChange(){

    this.selectedCategoryId = '';

    this.selectedSubcategoryId = '';

    this.subcategories = [];


    this.loadCategories();

  }



  // ==============================
  // CATEGORY CHANGE
  // ==============================

  onCategoryChange(){


    this.selectedSubcategoryId = '';

    this.subcategories = [];


    if(!this.selectedCategoryId){

      return;

    }



    this.api.get(
      `/subcategories?categoryId=${this.selectedCategoryId}`
    )
    .subscribe({

      next:(res:any)=>{


        const rows = res.data || [];



        this.subcategories =
        rows.filter((sub:any)=>{


          return sub.availableIn?.includes(
            this.selectedType
          );


        });



        console.log(
          "FILTERED SUBCATEGORIES",
          this.subcategories
        );


      },


      error:(err)=>{

        console.error(
          "Subcategory error",
          err
        );

      }


    });


  }



  // ==============================
  // LOAD CUSTOM FIELDS
  // ==============================

  loadCustomFields(){

    this.api.get('/admin/custom-fields')
    .subscribe({

      next:(res:any)=>{

        this.customFields =
          res.data || [];



        console.log(
          "CUSTOM FIELDS",
          this.customFields
        );


      },


      error:(err)=>{


        console.error(
          "Custom field error",
          err
        );


      }

    });

  }

get filteredCustomFields(){

  if(!this.searchText.trim()){

    return this.customFields;

  }


  const search =
  this.searchText.toLowerCase();


  return this.customFields.filter(
    (field:any)=>{


      return (

        field.label
        ?.toLowerCase()
        .includes(search)

        ||

        field.fieldName
        ?.toLowerCase()
        .includes(search)

      );


    }
  );


}
// ==============================
// CHECKBOX SELECTION
// ==============================


toggleFieldSelection(
  fieldId:string,
  event:any
){

  const checked =
  event.target.checked;


  if(checked){

    this.selectedFieldIds.push(fieldId);

  }
  else{

    this.selectedFieldIds =
    this.selectedFieldIds.filter(
      id => id !== fieldId
    );

  }


  console.log(
    "SELECTED FIELDS",
    this.selectedFieldIds
  );

}
// ==============================
// ASSIGN CUSTOM FIELDS
// ==============================

assignFields(){

  if(!this.selectedCategoryId){

    alert('Select category');

    return;

  }


  if(!this.selectedSubcategoryId){

    alert('Select subcategory');

    return;

  }


  if(this.selectedFieldIds.length === 0){

    alert('Select custom fields');

    return;

  }



  const payload = {

    customFieldIds:
    this.selectedFieldIds,


    categoryId:
    this.selectedCategoryId,


    subcategoryId:
    this.selectedSubcategoryId,


    type:
    this.selectedType

  };



  console.log(
    "ASSIGN PAYLOAD",
    payload
  );



  this.api.assignCustomFields(payload)
  .subscribe({

    next:(res:any)=>{


      console.log(
        "ASSIGN SUCCESS",
        res
      );


      alert(
        "Custom fields assigned successfully"
      );


      this.selectedFieldIds = [];

     this.loadAssignments();
    },


    error:(err)=>{


      console.error(
        "ASSIGN ERROR",
        err
      );


      alert(
        err?.error?.message ||
        "Assignment failed"
      );


    }


  });


}
// ==============================
// LOAD ASSIGNMENTS
// ==============================

loadAssignments(){

  this.isLoadingAssignments = true;


  this.api.getCustomFieldAssignments()
  .subscribe({

    next:(res:any)=>{


      this.assignments =
      res.data || [];


      console.log(
        "ASSIGNMENTS",
        this.assignments
      );


      this.isLoadingAssignments = false;


    },


    error:(err)=>{

      console.error(
        "Assignment load error",
        err
      );


      this.isLoadingAssignments = false;

    }

  });


}
// ==============================
// DELETE ASSIGNMENT
// ==============================

deleteAssignment(id:string){

  const confirmDelete =
  confirm(
    "Delete this assignment?"
  );


  if(!confirmDelete){

    return;

  }


  this.api.deleteCustomFieldAssignment(id)
  .subscribe({

    next:(res:any)=>{


      alert(
        "Assignment deleted"
      );


      this.loadAssignments();


    },


    error:(err)=>{


      console.error(
        "Delete error",
        err
      );


    }


  });


}
// ==============================
// EDIT ASSIGNMENT
// ==============================
editAssignment(item:any){

  console.log("EDIT ITEM", item);


  this.editingAssignmentId = item._id;


 this.selectedType = item.type;

this.loadCategories();


  this.selectedCategoryId =
  item.categoryId?._id || item.categoryId;


  this.editRequired =
  item.isRequired || false;


  this.editSortOrder =
  item.sortOrder || 0;



  // load subcategories after category selection

  this.api.get(
    `/subcategories?categoryId=${this.selectedCategoryId}`
  )
  .subscribe({

    next:(res:any)=>{

      const rows = res.data || [];


      this.subcategories =
      rows.filter((sub:any)=>{

        return sub.availableIn?.includes(
          this.selectedType
        );

      });


      this.selectedSubcategoryId =
      item.subcategoryId?._id || item.subcategoryId;


      console.log(
        "EDIT SUBCATEGORIES",
        this.subcategories
      );


    },


    error:(err)=>{

      console.error(
        "Edit subcategory error",
        err
      );

    }

  });


}
// ==============================
// UPDATE ASSIGNMENT
// ==============================

updateAssignment(){

if(
 !this.editingAssignmentId ||
 !this.selectedCategoryId ||
 !this.selectedSubcategoryId
){
  alert("Category and Subcategory required");
  return;
}

const payload = {

  type: this.selectedType,

  categoryId: this.selectedCategoryId,

  subcategoryId: this.selectedSubcategoryId,

  isRequired: this.editRequired,

  sortOrder: this.editSortOrder

};


console.log(
  "UPDATE ID",
  this.editingAssignmentId
);


console.log(
  "UPDATE PAYLOAD",
  payload
);

  this.api.updateCustomFieldAssignment(
    this.editingAssignmentId,
    payload
  )
  .subscribe({

    next:(res:any)=>{

      alert(
        "Assignment updated"
      );


      this.editingAssignmentId = null;


      this.loadAssignments();

    },


    error:(err)=>{

      console.error(
        "Update error",
        err
      );

    }

  });

}
}