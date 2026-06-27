import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) {}

 getToken() {
  return localStorage.getItem('adminToken') || localStorage.getItem('token');
}

  getHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.getToken()}`
      })
    };
  }

  // AUTH
  login(data: any) {
    return this.http.post(`${this.baseUrl}/auth/login`, data);
  }

  // DASHBOARD
  getAdminDashboard() {
    return this.http.get(`${this.baseUrl}/dashboard/admin`, this.getHeaders());
  }

  getTopBusinesses() {
    return this.http.get(`${this.baseUrl}/dashboard/top/businesses`, this.getHeaders());
  }

  getRecentActivity() {
    return this.http.get(`${this.baseUrl}/dashboard/recent-activity`, this.getHeaders());
  }

  // GROWTH
  getUserGrowth(filter: string) {
  return this.http.get(`/api/user-growth?filter=${filter}`);
}

getBusinessGrowth(filter: string) {
  return this.http.get(`/api/business-growth?filter=${filter}`);
}

  // BUSINESS OWNER DASHBOARD
  getBusinessDashboard(businessId: string) {
    return this.http.get(`${this.baseUrl}/dashboard/business/${businessId}`, this.getHeaders());
  }
}
