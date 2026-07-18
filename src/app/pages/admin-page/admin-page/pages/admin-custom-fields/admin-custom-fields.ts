import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../../services/api.service';

interface CustomField {
  _id?: string;
  fieldName: string;
  label: string;
  icon: string;
  fieldType: string;
  options: string[];
  isRequired: boolean;
  isActive: boolean;
}

@Component({
  selector:'app-admin-custom-fields',
  standalone:true,
  imports:[CommonModule, FormsModule],
  templateUrl:'./admin-custom-fields.html',
  styleUrls:['./admin-custom-fields.css']
})
export class AdminCustomFields implements OnInit {

  @Input() searchQuery = '';
  private api = inject(ApiService);

  fields: CustomField[] = [];
  showForm = false;
  isEdit = false;

  optionText = '';
  selectedIconFile?: File;
  isUploadingIcon = false;

  newField: CustomField = this.createEmptyField();

  // Pagination
  currentPage = 1;
  pageSize = 5;

  ngOnInit(){
    this.loadFields();
  }

  createEmptyField(): CustomField {
    return {
      fieldName: '',
      label: '',
      icon: '',
      fieldType: 'text',
      options: [],
      isRequired: false,
      isActive: true
    };
  }

  get paginatedFields(): CustomField[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.fields.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.fields.length / this.pageSize);
  }

  loadFields(){
    this.api.get<any>('/admin/custom-fields').subscribe({
      next: res => this.fields = res.data,
      error: err => console.log(err)
    });
  }

  openAddForm(){
    this.showForm = true;
    this.isEdit = false;
    this.selectedIconFile = undefined;
    this.isUploadingIcon = false;
    this.newField = this.createEmptyField();
  }

  onIconSelected(event: any){
    const file = event.target.files[0];
    if(file) this.selectedIconFile = file;
  }

  editField(field: CustomField){
    // Prefill modal
    this.newField = {
      _id: field._id,
      fieldName: field.fieldName || '',
      label: field.label || '',
      icon: field.icon || '',
      fieldType: field.fieldType || 'text',
      options: field.options ? [...field.options] : [],
      isRequired: field.isRequired || false,
      isActive: field.isActive ?? true
    };
    this.isEdit = true;
    this.showForm = true;
  }

  addOption(){
    if(this.optionText.trim()){
      this.newField.options.push(this.optionText.trim());
      this.optionText = '';
    }
  }

  removeOption(index: number){
    this.newField.options.splice(index, 1);
  }

  async saveField() {
    if(!this.newField.fieldName.trim() || !this.newField.label.trim()){
      alert("Please fill Field Name and Label");
      return;
    }

    if(this.selectedIconFile){
      this.isUploadingIcon = true;
      try {
        const res: any = await firstValueFrom(
          this.api.uploadImage(this.selectedIconFile, 'custom-fields')
        );
        this.newField.icon = res.publicUrl;
      } catch(err) {
        console.error(err);
        this.isUploadingIcon = false;
        alert("Icon upload failed");
        return;
      }
      this.isUploadingIcon = false;
    }

    this.submitField();
  }

  submitField(){
    if(this.isEdit){
      this.api.put<any>(`/admin/custom-fields/${this.newField._id}`, this.newField)
        .subscribe({
          next: res => { this.loadFields(); this.showForm = false; this.resetForm(); }
        });
    } else {
      this.api.post<any>(`/admin/custom-fields`, this.newField)
        .subscribe({
          next: res => { this.loadFields(); this.showForm = false; this.resetForm(); }
        });
    }
  }

  deleteField(id?: string){
    if(!id) return;
    if(confirm('Are you sure you want to delete this field?')){
      this.api.delete<any>(`/admin/custom-fields/${id}`)
        .subscribe({
          next: res => this.loadFields()
        });
    }
  }

  resetForm(){
    this.newField = this.createEmptyField();
    this.optionText = '';
    this.isEdit = false;
    this.selectedIconFile = undefined;
    this.isUploadingIcon = false;
  }

  closeForm(){
    this.showForm = false;
    this.resetForm();
  }
  goToPage(page: number) {
  if (page < 1) page = 1;
  if (page > this.totalPages) page = this.totalPages;
  this.currentPage = page;
}
}