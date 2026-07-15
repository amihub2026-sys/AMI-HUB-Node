import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {


  fullName = '';
  mobile = '';
  email = '';
  password = '';


  constructor(
    private authService: AuthService,
    private router: Router
  ){}



  register(){


    const data = {

      fullName: this.fullName,
      mobile: this.mobile,
      email: this.email,
      password: this.password

    };


    this.authService.register(data)
    .subscribe({

      next:(res:any)=>{

        console.log(
          "REGISTER SUCCESS",
          res
        );


        alert(
          "Registration Successful"
        );


        this.router.navigate(['/login']);

      },


      error:(err)=>{

        console.error(
          "REGISTER ERROR",
          err
        );


        alert(
          err.error?.message ||
          "Registration failed"
        );

      }


    });


  }

}
