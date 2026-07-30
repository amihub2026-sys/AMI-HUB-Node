import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../../services/api.service';


@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.css']
})
export class AdminLoginComponent {


username = '';
password = '';

  errorMessage = '';
  isLoading = false;


  constructor(
    private apiService: ApiService,
    private router: Router
  ){}



  login(){

    this.isLoading = true;
    this.errorMessage = '';


const data = {
  username:this.username,
  password:this.password
};

    this.apiService
    .post('/auth/admin-login',data)
    .subscribe({

      next:(res:any)=>{


localStorage.setItem(
  'adminToken',
  res.data.token
);


        this.router.navigate(['/admin']);


      },


      error:(err)=>{

        console.log(err);

        this.errorMessage =
        err.error?.message || 
        "Invalid admin login";

        this.isLoading=false;

      }


    });


  }


}