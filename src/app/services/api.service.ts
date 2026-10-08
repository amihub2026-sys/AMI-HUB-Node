import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}


 
getToken(): string | null {
  return localStorage.getItem('token');
}

getHeaders(isAdmin: boolean = false) {
  const token = isAdmin
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token');

  if (token) {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  return {};
}



  // ======================
  // AUTH
  // ======================

  login(data: any) {

    return this.http.post(
      `${this.baseUrl}/auth/login`,
      data
    );

  }



  // ======================
  // COMMON GET
  // ======================

  get<T = any>(url: string) {

    return this.http.get<T>(
      `${this.baseUrl}${url}`,
      this.getHeaders()
    );

  }



  // ======================
  // COMMON POST
  // ======================

  post<T = any>(url: string, data: any) {

    return this.http.post<T>(
      `${this.baseUrl}${url}`,
      data,
      this.getHeaders()
    );

  }



  // ======================
  // COMMON PUT
  // ======================

  put<T = any>(url: string, data: any) {

    return this.http.put<T>(
      `${this.baseUrl}${url}`,
      data,
      this.getHeaders()
    );

  }



  // ======================
  // COMMON DELETE
  // ======================

  delete<T = any>(url: string) {

    return this.http.delete<T>(
      `${this.baseUrl}${url}`,
      this.getHeaders()
    );

  }



  // ======================
  // COMMON PATCH
  // ======================

  patch<T = any>(url: string, data: any) {

    return this.http.patch<T>(
      `${this.baseUrl}${url}`,
      data,
      this.getHeaders()
    );

  }



  // ======================
  // DASHBOARD
  // ======================

  getAdminDashboard(){

    return this.http.get(
      `${this.baseUrl}/dashboard/admin`,
     this.getHeaders(true)
    );

  }


  getTopBusinesses(){

    return this.http.get(
      `${this.baseUrl}/dashboard/top/businesses`,
        this.getHeaders(true)
    );

  }


  getRecentActivity(){

    return this.http.get(
      `${this.baseUrl}/dashboard/recent-activity`,
       this.getHeaders(true)
    );

  }


  getUserGrowth(filter:string){

    return this.http.get(
      `${this.baseUrl}/dashboard/user-growth?filter=${filter}`,
        this.getHeaders(true)
    );

  }


  getBusinessGrowth(filter:string){

    return this.http.get(
      `${this.baseUrl}/dashboard/business-growth?filter=${filter}`,
        this.getHeaders(true)
    );

  }


  getBusinessDashboard(businessId:string){

    return this.http.get(
      `${this.baseUrl}/dashboard/business/${businessId}`,
       this.getHeaders(true)
    );

  }



  // ======================
  // UPLOAD
  // ======================

  uploadImage(file: File, folder: string) {

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "folder",
      folder
    );


    return this.http.post<any>(
      `${this.baseUrl}/uploads/r2`,
      formData
    );

  }
  // ======================
// CUSTOM FIELD ASSIGNMENT
// ======================


getCustomFieldAssignments(){

  return this.get(
    '/custom-field-assignment/all'
  );

}



getCustomFields(){

  return this.get(
    '/admin/custom-fields'
  );

}



getAssignedCustomFields(
  categoryId:string,
  subcategoryId:string,
  type:string
){

  return this.get(
    `/custom-field-assignment?categoryId=${categoryId}&subcategoryId=${subcategoryId}&type=${type}`
  );

}



assignCustomFields(data:any){

  return this.post(
    '/custom-field-assignment',
    data
  );

}



updateCustomFieldAssignment(
  id:string,
  data:any
){

  return this.put(
    `/custom-field-assignment/${id}`,
    data
  );

}



deleteCustomFieldAssignment(
  id:string
){

  return this.delete(
    `/custom-field-assignment/${id}`
  );

}

// ======================
// HERO SLIDER
// ======================

uploadHeroSlider(
  desktopImage: File,
  mobileImage: File,
  displayOrder: number,
  active: boolean
) {

  const formData = new FormData();

  formData.append(
    'desktopImage',
    desktopImage
  );

  formData.append(
    'mobileImage',
    mobileImage
  );

  formData.append(
    'displayOrder',
    displayOrder.toString()
  );

  formData.append(
    'active',
    active.toString()
  );

  return this.http.post<any>(
    `${this.baseUrl}/hero-slider`,
    formData,
    this.getHeaders()
  );

}


getAdminHeroSliders() {

  return this.get<any>(
    '/hero-slider/admin'
  );

}


getActiveHeroSliders() {

  return this.get<any>(
    '/hero-slider'
  );

}


deleteHeroSlider(id: string) {

  return this.delete<any>(
    `/hero-slider/${id}`
  );

}

}
