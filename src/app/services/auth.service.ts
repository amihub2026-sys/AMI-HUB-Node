import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://ami-hub-backend.onrender.com/api/auth';


  constructor(
    private http: HttpClient
  ) {}


  login(data:any) {

    return this.http.post(
      `${this.apiUrl}/login`,
      data
    );

  }


  register(data:any) {

    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );

  }


  saveSession(response:any){

 const token = response.data.token;
 const user = response.data.user;


 localStorage.setItem('token', token);

 localStorage.setItem('userToken', token);


 localStorage.setItem(
   'user',
   JSON.stringify(user)
 );


 localStorage.setItem(
   'userId',
   user._id
 );

}


  logout() {

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');

  }


  getToken() {

    return localStorage.getItem('token');

  }


  isLoggedIn() {

    return !!this.getToken();

  }

}
