import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-job',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './add-job.html',
  styleUrl: './add-job.css'
})
export class AddJob {

  private readonly postsApiUrl =
    `${environment.apiUrl}/posts`;

  isSubmitting = false;

  job = {
    title: '',
    company: '',
    location: '',
    jobType: '',
    workMode: '',
    salary: '',
    experience: '',
    vacancies: '',
    skills: '',
    description: '',
    contactEmail: '',
    contactPhone: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getAuthHeaders(): HttpHeaders {

    const token =
      localStorage.getItem('token');

    return new HttpHeaders({
      Authorization:
        token ? `Bearer ${token}` : ''
    });
  }

  async submitJob(): Promise<void> {

    if (this.isSubmitting) {
      return;
    }

    if (
      !this.job.title.trim() ||
      !this.job.company.trim() ||
      !this.job.contactPhone.trim()
    ) {
      alert(
        'Please enter Job Title, Company Name and Contact Phone.'
      );

      return;
    }

    this.isSubmitting = true;

    const payload = {
      listingType: 'job',

      title:
        this.job.title.trim(),

      description:
        this.job.description.trim(),

      price:
        this.job.salary.trim(),

      customFields: {
        companyName:
          this.job.company.trim(),

        jobType:
          this.job.jobType,

        workMode:
          this.job.workMode,

        salary:
          this.job.salary.trim(),

        experience:
          this.job.experience.trim(),

        vacancies:
          this.job.vacancies,

        skills:
          this.job.skills.trim()
      },

      location: {
        address:
          this.job.location.trim(),

        city:
          this.job.location.trim()
      },

      contact: {
        email:
          this.job.contactEmail.trim(),

        mobile:
          this.job.contactPhone.trim(),

        whatsapp:
          this.job.contactPhone.trim()
      }
    };

    try {

      const response =
        await this.http
          .post(
            this.postsApiUrl,
            payload,
            {
              headers:
                this.getAuthHeaders()
            }
          )
          .toPromise();

      console.log(
        'JOB CREATED:',
        response
      );

      alert(
        'Job vacancy added successfully!'
      );

      this.resetForm();

      this.router.navigate([
        '/job'
      ]);

    } catch (error: any) {

      console.error(
        'Mongo job insert error:',
        error
      );

      const message =
        error?.error?.message ||
        error?.error?.error ||
        'Job could not be added.';

      alert(message);

    } finally {

      this.isSubmitting = false;
    }
  }

  private resetForm(): void {

    this.job = {
      title: '',
      company: '',
      location: '',
      jobType: '',
      workMode: '',
      salary: '',
      experience: '',
      vacancies: '',
      skills: '',
      description: '',
      contactEmail: '',
      contactPhone: ''
    };
  }
}