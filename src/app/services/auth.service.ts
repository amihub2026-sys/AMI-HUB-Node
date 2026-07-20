import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://ami-hub-backend.onrender.com/api/auth';


  constructor(
    private http: HttpClient
  ) {}


 login(data:any) {

  console.log("LOGIN DATA SENT:", data);

  return this.http.post(
    `${this.apiUrl}/login`,
    {
      identifier: data.identifier,
      password: data.password
    }
  );

}


  register(data:any) {

    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );

  }


  saveSession(response:any){

  console.log("SAVE SESSION RESPONSE:", response);


  const token = response.token;
  const user = response.user;


  if(token){

    localStorage.setItem(
      'token',
      token
    );

    localStorage.setItem(
      'userToken',
      token
    );

  }


  if(user){

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );


    localStorage.setItem(
      'userId',
      user._id
    );

  }


  console.log(
    "TOKEN SAVED:",
    localStorage.getItem('token')
  );

  console.log(
    "USER ID SAVED:",
    localStorage.getItem('userId')
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
