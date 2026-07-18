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


  getToken(){

    return (
      localStorage.getItem('adminToken') ||
      localStorage.getItem('token')
    );

  }



getHeaders(){

 const token = this.getToken();

 if(token){

  return {
    headers:new HttpHeaders({
      Authorization:`Bearer ${token}`
    })
  };

 }


 return {};

}


  // ======================
  // AUTH
  // ======================

  login(data:any){

    return this.http.post(
      `${this.baseUrl}/auth/login`,
      data
    );

  }


get<T = any>(url: string) {
  return this.http.get<T>(
    `${this.baseUrl}${url}`,
    this.getHeaders()
  );
}

post<T = any>(url: string, data: any) {
  return this.http.post<T>(
    `${this.baseUrl}${url}`,
    data,
    this.getHeaders()
  );
}

put<T = any>(url: string, data: any) {
  return this.http.put<T>(
    `${this.baseUrl}${url}`,
    data,
    this.getHeaders()
  );
}

delete<T = any>(url: string) {
  return this.http.delete<T>(
    `${this.baseUrl}${url}`,
    this.getHeaders()
  );
}
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
      this.getHeaders()
    );

  }


  getTopBusinesses(){

    return this.http.get(
      `${this.baseUrl}/dashboard/top/businesses`,
      this.getHeaders()
    );

  }


  getRecentActivity(){

    return this.http.get(
      `${this.baseUrl}/dashboard/recent-activity`,
      this.getHeaders()
    );

  }


  getUserGrowth(filter:string){

    return this.http.get(
      `${this.baseUrl}/dashboard/user-growth?filter=${filter}`,
      this.getHeaders()
    );

  }


  getBusinessGrowth(filter:string){

    return this.http.get(
      `${this.baseUrl}/dashboard/business-growth?filter=${filter}`,
      this.getHeaders()
    );

  }


  getBusinessDashboard(businessId:string){

    return this.http.get(
      `${this.baseUrl}/dashboard/business/${businessId}`,
      this.getHeaders()
    );

  }
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
}
