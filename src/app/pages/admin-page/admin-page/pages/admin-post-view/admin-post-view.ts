import { 
  Component,
  Input,
  OnInit
} from '@angular/core';

import { 
  CommonModule
} from '@angular/common';

import {
  ApiService
} from '../../../../../services/api.service';


@Component({
  selector: 'app-admin-post-view',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './admin-post-view.html',
  styleUrls: ['./admin-post-view.css']
})
export class AdminPostViewComponent implements OnInit {


  @Input() postId:string | null = null;


  post:any = null;

  isLoading = false;


  constructor(
    private api:ApiService
  ){}



  ngOnInit(){

    if(this.postId){

      this.loadPost();

    }

  }



  loadPost(){

    this.isLoading = true;


    this.api
    .get(`/posts/${this.postId}`)
    .subscribe({

      next:(res:any)=>{

        console.log(
          "ADMIN POST VIEW:",
          res
        );


        this.post = res.data;


        this.isLoading=false;

      },


      error:(err:any)=>{

        console.log(err);

        this.isLoading=false;

      }

    });

  }


}