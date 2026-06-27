import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { BaseChartDirective } from 'ng2-charts';
import { interval, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [BaseChartDirective]
})
export class DashboardComponent implements OnInit, OnDestroy {

  data: any;

  userChartData: any = { labels: [], datasets: [] };
  businessChartData: any = { labels: [], datasets: [] };

  refreshSub!: Subscription;
  selectedFilter = 'monthly';

  constructor(private api: ApiService) {}

  ngOnInit(): void {

    this.loadDashboard();
    this.loadCharts();

    // ✅ cleaner auto refresh
    this.refreshSub = interval(10000)
      .pipe(
        switchMap(() => {
          this.loadDashboard();
          return this.api.getUserGrowth(this.selectedFilter);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.target.value;
    this.loadCharts();
  }

  loadDashboard() {
    this.api.getAdminDashboard().subscribe((res: any) => {
      this.data = res.data;
    });
  }

  loadCharts() {

    this.api.getUserGrowth(this.selectedFilter).subscribe((res: any) => {
      const data = res?.data || [];

      this.userChartData = {
        labels: data.map((x: any) => `${x?._id?.year}-${x?._id?.month}`),
        datasets: [
          { data: data.map((x: any) => x.count), label: 'Users' }
        ]
      };
    });

    this.api.getBusinessGrowth(this.selectedFilter).subscribe((res: any) => {
      const data = res?.data || [];

      this.businessChartData = {
        labels: data.map((x: any) => `${x?._id?.year}-${x?._id?.month}`),
        datasets: [
          { data: data.map((x: any) => x.count), label: 'Businesses' }
        ]
      };
    });
  }
}
