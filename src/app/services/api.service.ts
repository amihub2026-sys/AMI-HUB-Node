import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class ApiService {


  baseUrl = 'https://ami-hub-backend.onrender.com/api';


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

    return {

      headers:new HttpHeaders({

        Authorization:
        `Bearer ${this.getToken()}`

      })

    };

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



  // ======================
  // COMMON GET
  // ======================

  get(url:string){

    return this.http.get(
      `${this.baseUrl}${url}`,
      this.getHeaders()
    );

  }



  // ======================
  // COMMON POST
  // ======================

  post(url:string,data:any){

    return this.http.post(
      `${this.baseUrl}${url}`,
      data,
      this.getHeaders()
    );

  }



  // ======================
  // COMMON PUT
  // ======================

  put(url:string,data:any){

    return this.http.put(
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


}
