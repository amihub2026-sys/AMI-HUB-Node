import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { environment } from '../../../environments/environment';
import { SearchResults } from '../search-results/search-results';

@Component({
  selector: 'app-job',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    SearchResults
  ],

  templateUrl: './job.html',
  styleUrl: './job.css'
})
export class Job implements OnInit {

  private readonly jobsApiUrl =
    `${environment.apiUrl}/posts`;

  showJobList = true;
  showJobForm = false;

  jobs: any[] = [];

  selectedType = 'All';

  showApplyForm = false;
  showJobDetails = false;

  currentPage = 1;
  jobsPerPage = 3;

  selectedJob: any = null;
  selectedResume: File | null = null;

  isLoading = false;

  application = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };

  jobId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.jobId =
      this.route.snapshot.paramMap.get('id');

    if (this.jobId) {

      this.showJobList = false;
      this.showJobDetails = true;

      this.loadJobDetails(this.jobId);

    } else {

      this.showJobList = true;
      this.showJobDetails = false;

      this.loadJobs();
    }
  }

  private getAuthHeaders(): HttpHeaders {

    const token =
      localStorage.getItem('token');

    return new HttpHeaders({
      Authorization:
        token ? `Bearer ${token}` : ''
    });
  }

  async loadJobs(): Promise<void> {

    this.isLoading = true;

    try {

      const params =
        new HttpParams()
          .set('listingType', 'job');

      const response: any =
        await this.http
          .get<any>(
            this.jobsApiUrl,
            {
              params,
              headers: this.getAuthHeaders()
            }
          )
          .toPromise();

      const rawJobs =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.posts)
          ? response.posts
          : Array.isArray(response?.data?.posts)
          ? response.data.posts
          : [];

      this.jobs =
        rawJobs.map(
          (job: any) =>
            this.mapJob(job)
        );

      this.currentPage = 1;

    } catch (error) {

      console.error(
        'Load Mongo jobs error:',
        error
      );

      this.jobs = [];

    } finally {

      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadJobDetails(
    id: string
  ): Promise<void> {

    this.isLoading = true;

    try {

      const response: any =
        await this.http
          .get<any>(
            `${this.jobsApiUrl}/${id}`,
            {
              headers: this.getAuthHeaders()
            }
          )
          .toPromise();

      const rawJob =
        response?.data ||
        response?.post ||
        response;

      this.selectedJob =
        this.mapJob(rawJob);

    } catch (error) {

      console.error(
        'Job details error:',
        error
      );

      this.selectedJob = null;

    } finally {

      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private mapJob(job: any): any {

    const customFields =
      job?.customFields || {};

    const phone =
      job?.contact?.mobile ||
      job?.contact?.whatsapp ||
      '';

    const whatsapp =
      job?.contact?.whatsapp ||
      job?.contact?.mobile ||
      '';

    const location =
      [
        job?.location?.address,
        job?.location?.city,
        job?.location?.state
      ]
        .filter(Boolean)
        .join(', ') ||
      'Location not available';

    return {
      ...job,

      id: String(
        job?._id ||
        job?.id ||
        ''
      ),

      job_title:
        job?.title ||
        'Untitled Job',

      title:
        job?.title ||
        'Untitled Job',

      company_name:
        customFields?.companyName ||
        customFields?.company_name ||
        job?.sellerId?.fullName ||
        'Company',

      location,

      salary:
        customFields?.salary ||
        job?.price ||
        'Not specified',

      job_type:
        customFields?.jobType ||
        customFields?.job_type ||
        'Full Time',

      work_mode:
        customFields?.workMode ||
        customFields?.work_mode ||
        'Not specified',

      experience:
        customFields?.experience ||
        'Not specified',

      vacancies:
        customFields?.vacancies ||
        'Not specified',

      skills:
        customFields?.skills ||
        'Not specified',

      description:
        job?.description ||
        '',

      contactEmail:
        job?.contact?.email ||
        job?.sellerId?.email ||
        '',

      phone,

      contact_phone:
        whatsapp,

      created_at:
        job?.createdAt ||
        job?.created_at ||
        null
    };
  }

  filteredJobs(): any[] {

    if (
      this.selectedType === 'All'
    ) {
      return this.jobs;
    }

    return this.jobs.filter(
      (job: any) =>
        String(
          job?.job_type || ''
        )
          .trim()
          .toLowerCase() ===
        this.selectedType
          .trim()
          .toLowerCase()
    );
  }

  get paginatedJobs(): any[] {

    const start =
      (this.currentPage - 1) *
      this.jobsPerPage;

    const end =
      start +
      this.jobsPerPage;

    return this.filteredJobs()
      .slice(start, end);
  }

  get totalPages(): number {

    const pages =
      Math.ceil(
        this.filteredJobs().length /
        this.jobsPerPage
      );

    return pages > 0 ? pages : 1;
  }

  selectJobType(type: string): void {
    this.selectedType = type;
    this.currentPage = 1;
  }

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {
      this.currentPage++;
    }
  }

  previousPage(): void {

    if (
      this.currentPage > 1
    ) {
      this.currentPage--;
    }
  }

  goToAddJob(): void {
    this.router.navigate(['/add-job']);
  }

  openApplyForm(job: any): void {
    this.selectedJob = job;
    this.showApplyForm = true;
  }

  openJobDetails(job: any): void {
    this.selectedJob = job;
    this.showJobDetails = true;
  }

  closeJobDetails(): void {
    this.showJobDetails = false;
    this.selectedJob = null;
  }

  submitApplication(): void {

    alert(
      'Application submitted successfully!'
    );

    this.showApplyForm = false;

    this.application = {
      name: '',
      email: '',
      phone: '',
      message: ''
    };
  }

  onResumeSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    this.selectedResume =
      input.files[0];
  }

  getWhatsAppUrl(job: any): string {

    const phone =
      String(
        job?.contact_phone ||
        ''
      ).replace(/\D/g, '');

    return phone
      ? `https://wa.me/${phone}`
      : '#';
  }

  getCallUrl(job: any): string {

    const phone =
      String(
        job?.phone ||
        job?.contact_phone ||
        ''
      );

    return phone
      ? `tel:${phone}`
      : '#';
  }

  trackByJobId(
    index: number,
    job: any
  ): string {

    return String(
      job?.id ||
      job?._id ||
      index
    );
  }
}