import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';

import {
  Chart,
  registerables
} from 'chart.js';

import { SupabaseService } from '../../../../../services/supabase.service';

Chart.register(...registerables);

interface DashboardStat {
  title: string;
  value: string;
  icon: string;
  bg: string;
  color: string;
  change: string;
}

interface ActivityItem {
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboard implements OnInit, AfterViewInit {

  private supabaseService = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  isLoading = true;
  errorMessage = '';

  totalUsers = 0;
  totalPosts = 0;
  activeSubscriptions = 0;

  totalRevenueAmount = 0;
  subscriptionRevenue = 0;
  boostRevenue = 0;

  todayRevenue = 0;
  weekRevenue = 0;
  monthRevenue = 0;

  buyerCount = 0;
  sellerCount = 0;

  monthlyRevenueData: number[] =
    new Array(12).fill(0);

  recentActivities: ActivityItem[] = [];

  @ViewChild('userTypeChart')
  userTypeChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('monthlyRevenueChart')
  monthlyRevenueChartRef!: ElementRef<HTMLCanvasElement>;

  private userTypeChart?: Chart;
  private monthlyRevenueChart?: Chart;

  private viewReady = false;

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;

    setTimeout(() => {
      this.renderCharts();
    }, 100);
  }

  async loadDashboard(): Promise<void> {

    this.ngZone.run(() => {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    });

    try {

      await Promise.all([
        this.loadUserCount(),
        this.loadUserTypes(),
        this.loadPostCount(),
        this.loadSubscriptionCount(),
        this.loadRevenue(),
        this.loadRecentActivities(),
      ]);

    } catch (error) {

      console.error(
        'Dashboard load error:',
        error
      );

      this.ngZone.run(() => {
        this.errorMessage =
          'Failed to load dashboard data.';
      });

    } finally {

      this.ngZone.run(() => {

        this.isLoading = false;

        this.cdr.detectChanges();

        setTimeout(() => {
          this.renderCharts();
        }, 100);

      });
    }
  }

  // ==========================================
  // USERS
  // ==========================================

  async loadUserCount(): Promise<void> {

    const { count, error } =
      await this.supabaseService.supabase
        .from('users')
        .select('*', {
          count: 'exact',
          head: true
        });

    this.ngZone.run(() => {

      if (error) {

        console.error(
          'loadUserCount error:',
          error
        );

        this.totalUsers = 0;

      } else {

        this.totalUsers =
          count || 0;
      }

      this.cdr.detectChanges();
    });
  }

  async loadUserTypes(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('users')
        .select('usertypeid');

    if (error) {

      console.error(
        'loadUserTypes error:',
        error
      );

      this.buyerCount = 0;
      this.sellerCount = 0;

      return;
    }

    const users = data || [];

    /*
      CURRENT ASSUMPTION

      usertypeid = 1 → Buyer
      usertypeid = 2 → Seller

      Change these IDs if your
      database uses another mapping.
    */

    this.buyerCount =
      users.filter(
        (user: any) =>
          Number(user.usertypeid) === 1
      ).length;

    this.sellerCount =
      users.filter(
        (user: any) =>
          Number(user.usertypeid) === 2
      ).length;

    this.cdr.detectChanges();
  }

  // ==========================================
  // POSTS
  // ==========================================

  async loadPostCount(): Promise<void> {

    const { count, error } =
      await this.supabaseService.supabase
        .from('post')
        .select('*', {
          count: 'exact',
          head: true
        });

    this.ngZone.run(() => {

      if (error) {

        console.error(
          'loadPostCount error:',
          error
        );

        this.totalPosts = 0;

      } else {

        this.totalPosts =
          count || 0;
      }

      this.cdr.detectChanges();
    });
  }

  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================

  async loadSubscriptionCount(): Promise<void> {

    const { count, error } =
      await this.supabaseService.supabase
        .from('user_subscriptions')
        .select('*', {
          count: 'exact',
          head: true
        })
        .eq('isactive', true);

    this.ngZone.run(() => {

      if (error) {

        console.error(
          'loadSubscriptionCount error:',
          error
        );

        this.activeSubscriptions = 0;

      } else {

        this.activeSubscriptions =
          count || 0;
      }

      this.cdr.detectChanges();
    });
  }

  // ==========================================
  // REVENUE
  // ==========================================

  async loadRevenue(): Promise<void> {

    const [subsRes, boostRes] =
      await Promise.all([

        this.supabaseService.supabase
          .from('user_subscriptions')
          .select(
            'amountpaid,paymentstatus,isactive,createdon'
          )
          .eq('isactive', true),

        this.supabaseService.supabase
          .from('user_boost_purchases')
          .select(
            'amount,paymentstatus,createdon'
          )

      ]);

    if (subsRes.error) {

      console.error(
        'Subscription revenue error:',
        subsRes.error
      );
    }

    if (boostRes.error) {

      console.error(
        'Boost revenue error:',
        boostRes.error
      );
    }

    const now = new Date();

    // TODAY
    const todayStart =
      new Date(now);

    todayStart.setHours(
      0,
      0,
      0,
      0
    );

    // WEEK
    const weekStart =
      new Date(now);

    weekStart.setDate(
      now.getDate() -
      now.getDay()
    );

    weekStart.setHours(
      0,
      0,
      0,
      0
    );

    // MONTH
    const monthStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const currentYear =
      now.getFullYear();

    let subscriptionTotal = 0;
    let boostTotal = 0;

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    const monthlyRevenue =
      new Array(12).fill(0);

    const addRevenue = (
      amount: number,
      createdon: string
    ) => {

      if (!createdon) {
        return;
      }

      const createdDate =
        new Date(createdon);

      if (
        Number.isNaN(
          createdDate.getTime()
        )
      ) {
        return;
      }

      if (
        createdDate >= todayStart
      ) {
        todayTotal += amount;
      }

      if (
        createdDate >= weekStart
      ) {
        weekTotal += amount;
      }

      if (
        createdDate >= monthStart
      ) {
        monthTotal += amount;
      }

      // MONTHLY REVENUE CHART
      if (
        createdDate.getFullYear() ===
        currentYear
      ) {

        monthlyRevenue[
          createdDate.getMonth()
        ] += amount;
      }
    };

    // SUBSCRIPTION REVENUE
    if (!subsRes.error) {

      for (
        const item of
        subsRes.data || []
      ) {

        const paymentStatus =
          (
            item.paymentstatus || ''
          )
            .toLowerCase()
            .trim();

        if (
          paymentStatus === 'paid'
        ) {

          const amount =
            Number(
              item.amountpaid || 0
            );

          subscriptionTotal +=
            amount;

          addRevenue(
            amount,
            item.createdon
          );
        }
      }
    }

    // BOOST REVENUE
    if (!boostRes.error) {

      for (
        const item of
        boostRes.data || []
      ) {

        const paymentStatus =
          (
            item.paymentstatus || ''
          )
            .toLowerCase()
            .trim();

        if (
          paymentStatus === 'paid'
        ) {

          const amount =
            Number(
              item.amount || 0
            );

          boostTotal += amount;

          addRevenue(
            amount,
            item.createdon
          );
        }
      }
    }

    this.ngZone.run(() => {

      this.subscriptionRevenue =
        subscriptionTotal;

      this.boostRevenue =
        boostTotal;

      this.totalRevenueAmount =
        subscriptionTotal +
        boostTotal;

      this.todayRevenue =
        todayTotal;

      this.weekRevenue =
        weekTotal;

      this.monthRevenue =
        monthTotal;

      this.monthlyRevenueData =
        monthlyRevenue;

      this.cdr.detectChanges();

      setTimeout(() => {
        this.renderCharts();
      }, 50);

    });
  }

  // ==========================================
  // RECENT ACTIVITY
  // ==========================================

  async loadRecentActivities():
    Promise<void> {

    const activityItems:
      ActivityItem[] = [];

    const [
      usersRes,
      postsRes,
      subsRes,
      paymentsRes
    ] = await Promise.all([

      this.supabaseService.supabase
        .from('users')
        .select(
          'fullname,email,createdon'
        )
        .order(
          'createdon',
          { ascending: false }
        )
        .limit(3),

      this.supabaseService.supabase
        .from('post')
        .select(
          'title,createdon,adtype,conditiontype'
        )
        .order(
          'createdon',
          { ascending: false }
        )
        .limit(3),

      this.supabaseService.supabase
        .from('user_subscriptions')
        .select(
          'createdon,paymentstatus,amountpaid'
        )
        .order(
          'createdon',
          { ascending: false }
        )
        .limit(3),

      this.supabaseService.supabase
        .from('payments')
        .select(
          'plan_name,amount,status,created_at'
        )
        .order(
          'created_at',
          { ascending: false }
        )
        .limit(3),

    ]);

    // USERS
    if (!usersRes.error) {

      for (
        const user of
        usersRes.data || []
      ) {

        activityItems.push({

          title:
            'New user registered',

          subtitle:
            user.fullname ||
            user.email ||
            'New user joined',

          time:
            this.timeAgo(
              user.createdon
            ),

          icon: '👤',

          createdAt:
            user.createdon || ''
        });
      }

    } else {

      console.error(
        'loadRecentActivities users error:',
        usersRes.error
      );
    }

    // POSTS
    if (!postsRes.error) {

      for (
        const post of
        postsRes.data || []
      ) {

        activityItems.push({

          title:
            'New post created',

          subtitle:
            post.title ||
            post.adtype ||
            post.conditiontype ||
            'New post added',

          time:
            this.timeAgo(
              post.createdon
            ),

          icon: '📝',

          createdAt:
            post.createdon || ''
        });
      }

    } else {

      console.error(
        'loadRecentActivities posts error:',
        postsRes.error
      );
    }

    // SUBSCRIPTIONS
    if (!subsRes.error) {

      for (
        const sub of
        subsRes.data || []
      ) {

        activityItems.push({

          title:
            'Subscription purchased',

          subtitle:
            `Status: ${
              sub.paymentstatus || 'paid'
            } | Amount: ₹${Number(
              sub.amountpaid || 0
            ).toLocaleString('en-IN')}`,

          time:
            this.timeAgo(
              sub.createdon
            ),

          icon: '⭐',

          createdAt:
            sub.createdon || ''
        });
      }

    } else {

      console.error(
        'loadRecentActivities subscriptions error:',
        subsRes.error
      );
    }

    // PAYMENTS
    if (!paymentsRes.error) {

      for (
        const payment of
        paymentsRes.data || []
      ) {

        activityItems.push({

          title:
            'Payment received',

          subtitle:
            `${
              payment.plan_name ||
              'Payment'
            } • ₹${Number(
              payment.amount || 0
            ).toLocaleString('en-IN')}`,

          time:
            this.timeAgo(
              payment.created_at
            ),

          icon: '💳',

          createdAt:
            payment.created_at || ''
        });
      }

    } else {

      console.error(
        'loadRecentActivities payments error:',
        paymentsRes.error
      );
    }

    this.ngZone.run(() => {

      this.recentActivities =
        activityItems
          .sort(
            (a, b) =>
              new Date(
                b.createdAt
              ).getTime() -
              new Date(
                a.createdAt
              ).getTime()
          )
          .slice(0, 6);

      this.cdr.detectChanges();
    });
  }

  // ==========================================
  // CHARTS
  // ==========================================

  private renderCharts(): void {

    if (!this.viewReady) {
      return;
    }

    this.renderUserTypeChart();
    this.renderMonthlyRevenueChart();
  }

  private renderUserTypeChart():
    void {

    if (
      !this.userTypeChartRef
    ) {
      return;
    }

    if (this.userTypeChart) {

      this.userTypeChart.destroy();
    }

    const canvas =
      this.userTypeChartRef
        .nativeElement;

    this.userTypeChart =
      new Chart(
        canvas,
        {

          type: 'doughnut',

          data: {

            labels: [
              'Buyers',
              'Sellers'
            ],

            datasets: [
              {

                data: [
                  this.buyerCount,
                  this.sellerCount
                ],

                backgroundColor: [
                  '#3b82f6',
                  '#ff4f78'
                ],

                borderWidth: 0,

                hoverOffset: 7
              }
            ]
          },

          options: {

            responsive: true,

            maintainAspectRatio:
              false,

            cutout: '70%',

            plugins: {

              legend: {

                position: 'right',

                labels: {

                  usePointStyle: true,

                  padding: 20,

                  font: {
                    size: 13,
                    weight: 'bold'
                  }
                }
              },

              tooltip: {

                callbacks: {

                  label: (
                    context: any
                  ) => {

                    const value =
                      Number(
                        context.raw ||
                        0
                      );

                    return (
                      `${context.label}: ` +
                      value.toLocaleString(
                        'en-IN'
                      )
                    );
                  }
                }
              }
            }
          }
        }
      );
  }

  private renderMonthlyRevenueChart():
    void {

    if (
      !this.monthlyRevenueChartRef
    ) {
      return;
    }

    if (
      this.monthlyRevenueChart
    ) {

      this.monthlyRevenueChart
        .destroy();
    }

    const canvas =
      this.monthlyRevenueChartRef
        .nativeElement;

    const ctx =
      canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    /*
      Gradient background
      for monthly revenue line
    */
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        260
      );

    gradient.addColorStop(
      0,
      'rgba(124, 58, 237, 0.28)'
    );

    gradient.addColorStop(
      1,
      'rgba(124, 58, 237, 0.02)'
    );

    this.monthlyRevenueChart =
      new Chart(
        canvas,
        {

          type: 'line',

          data: {

            labels: [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec'
            ],

            datasets: [
              {

                label:
                  'Revenue',

                data:
                  this
                    .monthlyRevenueData,

                borderColor:
                  '#7c3aed',

                backgroundColor:
                  gradient,

                fill: true,

                tension: 0.4,

                borderWidth: 3,

                pointRadius: 4,

                pointHoverRadius: 6,

                pointBackgroundColor:
                  '#7c3aed',

                pointBorderColor:
                  '#ffffff',

                pointBorderWidth: 2
              }
            ]
          },

          options: {

            responsive: true,

            maintainAspectRatio:
              false,

            interaction: {
              intersect: false,
              mode: 'index'
            },

            plugins: {

              legend: {
                display: false
              },

              tooltip: {

                callbacks: {

                  label: (
                    context: any
                  ) => {

                    const amount =
                      Number(
                        context.raw ||
                        0
                      );

                    return (
                      'Revenue: ₹' +
                      amount
                        .toLocaleString(
                          'en-IN'
                        )
                    );
                  }
                }
              }
            },

            scales: {

              y: {

                beginAtZero: true,

                ticks: {

                  callback:
                    (value: any) => {

                      const amount =
                        Number(value);

                      if (
                        amount >=
                        100000
                      ) {

                        return (
                          '₹' +
                          (
                            amount /
                            100000
                          ).toFixed(1) +
                          'L'
                        );
                      }

                      if (
                        amount >= 1000
                      ) {

                        return (
                          '₹' +
                          (
                            amount /
                            1000
                          ).toFixed(0) +
                          'K'
                        );
                      }

                      return (
                        '₹' +
                        amount
                      );
                    }
                },

                grid: {
                  color:
                    'rgba(148,163,184,.15)'
                },

                border: {
                  display: false
                }
              },

              x: {

                grid: {
                  display: false
                },

                border: {
                  display: false
                }
              }
            }
          }
        }
      );
  }

  // ==========================================
  // TOP STAT CARDS
  // ==========================================

  get stats():
    DashboardStat[] {

    return [

      {
        title:
          'Total Users',

        value:
          this.totalUsers
            .toLocaleString(
              'en-IN'
            ),

        icon: '👥',

        color:
          '#335cff',

        bg:
          'linear-gradient(135deg, #eef4ff 0%, #dbeafe 100%)',

        change: 'Live'
      },

      {
        title:
          'Total Posts',

        value:
          this.totalPosts
            .toLocaleString(
              'en-IN'
            ),

        icon: '📝',

        color:
          '#ff7a00',

        bg:
          'linear-gradient(135deg, #fff5eb 0%, #ffedd5 100%)',

        change: 'Live'
      },

      {
        title:
          'Active Subscriptions',

        value:
          this.activeSubscriptions
            .toLocaleString(
              'en-IN'
            ),

        icon: '⭐',

        color:
          '#16a34a',

        bg:
          'linear-gradient(135deg, #ecfdf3 0%, #dcfce7 100%)',

        change: 'Live'
      },

      {
        title:
          'Subscription Revenue',

        value:
          `₹${this.subscriptionRevenue
            .toLocaleString(
              'en-IN'
            )}`,

        icon: '💳',

        color:
          '#16a34a',

        bg:
          'linear-gradient(135deg, #fff0f5 0%, #ffe4ec 100%)',

        change: 'Paid'
      },

      {
        title:
          'Boost Revenue',

        value:
          `₹${this.boostRevenue
            .toLocaleString(
              'en-IN'
            )}`,

        icon: '🚀',

        color:
          '#f97316',

        bg:
          'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',

        change: 'Paid'
      },

      {
        title:
          'Total Revenue',

        value:
          this.formattedRevenue,

        icon: '💰',

        color:
          '#7c3aed',

        bg:
          'linear-gradient(135deg, #f7f0ff 0%, #ede9fe 100%)',

        change: 'Paid'
      }

    ];
  }

  // ==========================================
  // FORMATTERS
  // ==========================================

  get formattedRevenue():
    string {

    if (
      this.totalRevenueAmount >=
      10000000
    ) {

      return (
        '₹' +
        (
          this.totalRevenueAmount /
          10000000
        ).toFixed(1) +
        'Cr'
      );
    }

    if (
      this.totalRevenueAmount >=
      100000
    ) {

      return (
        '₹' +
        (
          this.totalRevenueAmount /
          100000
        ).toFixed(1) +
        'L'
      );
    }

    return (
      '₹' +
      this.totalRevenueAmount
        .toLocaleString(
          'en-IN'
        )
    );
  }

  get formattedTodayRevenue():
    string {

    return (
      '₹' +
      this.todayRevenue
        .toLocaleString(
          'en-IN'
        )
    );
  }

  get formattedWeekRevenue():
    string {

    return (
      '₹' +
      this.weekRevenue
        .toLocaleString(
          'en-IN'
        )
    );
  }

  get formattedMonthRevenue():
    string {

    return (
      '₹' +
      this.monthRevenue
        .toLocaleString(
          'en-IN'
        )
    );
  }

  get totalActivities():
    number {

    return (
      this.recentActivities.length
    );
  }

  // ==========================================
  // TRACK BY
  // ==========================================

  trackByStat(
    index: number,
    stat: DashboardStat
  ): string {

    return stat.title;
  }

  trackByActivity(
    index: number,
    activity: ActivityItem
  ): string {

    return (
      `${activity.title}-` +
      `${activity.createdAt}-` +
      `${index}`
    );
  }

  // ==========================================
  // TIME FORMAT
  // ==========================================

  private timeAgo(
    value:
      string |
      null |
      undefined
  ): string {

    if (!value) {
      return 'Recently';
    }

    const date =
      new Date(value);

    const seconds =
      Math.floor(
        (
          Date.now() -
          date.getTime()
        ) / 1000
      );

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    if (minutes < 60) {

      return (
        `${minutes} min` +
        `${minutes > 1 ? 's' : ''} ago`
      );
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {

      return (
        `${hours} hour` +
        `${hours > 1 ? 's' : ''} ago`
      );
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days < 30) {

      return (
        `${days} day` +
        `${days > 1 ? 's' : ''} ago`
      );
    }

    return date
      .toLocaleDateString(
        'en-IN'
      );
  }
}