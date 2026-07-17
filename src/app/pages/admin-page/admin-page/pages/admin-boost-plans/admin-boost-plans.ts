import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';

interface AdminBoostPlanItem {
  boostid: string;
  userid: number | null;
  postid: number | null;
  boost_plan_id: string;
  boost_name: string;
  price: number;
  duration_days: number;
  startdate: string | null;
  enddate: string | null;
  isactive: boolean;
  createdon: string | null;

  startLabel: string;
  endLabel: string;
  createdLabel: string;
  statusLabel: 'Active' | 'Expired' | 'Inactive';
}

type BoostStatusFilter = 'all' | 'active' | 'expired' | 'inactive';

@Component({
  selector: 'app-admin-boost-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-boost-plans.html',
  styleUrls: ['./admin-boost-plans.css'],
})
export class AdminBoostPlansComponent implements OnInit {
  @Input() searchQuery = '';

  boostStatusFilter: BoostStatusFilter = 'all';

  allBoostPlans: AdminBoostPlanItem[] = [];
  loading = false;
  saving = false;


  showForm = false;
  isEditMode = false;
  editingId:string|null=null;
deletingId:string|null=null;
  formModel = {
    userid: null as number | null,
    postid: null as number | null,
    boost_plan_id: '',
    boost_name: '',
    price: 0,
    duration_days: 1,
    startdate: '',
    enddate: '',
    isactive: true,
  };

constructor(
 private api: ApiService,
 private cdr: ChangeDetectorRef
) {}

  ngOnInit(): void {
    this.fetchBoostPlans();
  }
  private getStatusLabel(item: {
    isactive: boolean;
    enddate: string | null;
  }): 'Active' | 'Expired' | 'Inactive' {
    if (!item.isactive) return 'Inactive';
    if (!item.enddate) return 'Inactive';

    const end = new Date(item.enddate);
    const now = new Date();

    if (isNaN(end.getTime())) return 'Inactive';

    return end >= now ? 'Active' : 'Expired';
  }

  private formatDate(value: string | null): string {
    if (!value) return '-';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private toDateTimeLocal(value: string | null): string {
    if (!value) return '';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  private mapBoostPlan(item: any): AdminBoostPlanItem {
    return {
      boostid: item._id,
      userid:
        item.userid !== null && item.userid !== undefined
          ? Number(item.userid)
          : null,
      postid:
        item.postid !== null && item.postid !== undefined
          ? Number(item.postid)
          : null,
     boost_plan_id: item.boostPlanId ?? '',
boost_name: item.boostName ?? '',

      price: Number(item.price ?? 0),
     duration_days: Number(item.durationDays ?? 0),

      startdate: item.startdate ?? null,
      enddate: item.enddate ?? null,
      isactive: !!item.isactive,
      createdon: item.createdon ?? null,
      startLabel: this.formatDate(item.startdate ?? null),
      endLabel: this.formatDate(item.enddate ?? null),
      createdLabel: this.formatDate(item.createdon ?? null),
      statusLabel: this.getStatusLabel({
        isactive: !!item.isactive,
        enddate: item.enddate ?? null,
      }),
    };
  }
fetchBoostPlans(): void {

 this.loading = true;


 this.api.get('/boost-plans')
 .subscribe({

 next:(res:any)=>{


 this.allBoostPlans =
 (res.data || []).map((item:any)=>({

 boostid:item._id,

 userid:null,

 postid:null,

 boost_plan_id:item.boostPlanId,

 boost_name:item.boostName,

 price:item.price,

 duration_days:item.durationDays,

 startdate:null,

 enddate:null,

 isactive:item.isActive,

 createdon:item.createdAt,


 startLabel:'-',
 endLabel:'-',
 createdLabel:this.formatDate(item.createdAt),

 statusLabel:item.isActive
 ? 'Active'
 : 'Inactive'


 }));


 this.loading=false;

 this.cdr.detectChanges();


 },


 error:(err)=>{

 console.error(
 "LOAD BOOST ERROR",
 err
 );

 this.loading=false;

 }


 });

}

  setBoostStatusFilter(filter: BoostStatusFilter): void {
    this.boostStatusFilter = filter;
    this.cdr.detectChanges();
  }

  get filteredBoostPlans(): AdminBoostPlanItem[] {
    const q = (this.searchQuery || '').trim().toLowerCase();

    return this.allBoostPlans.filter((item) => {
      const matchesSearch =
        !q ||
        String(item.boostid).toLowerCase().includes(q) ||
        String(item.userid ?? '').toLowerCase().includes(q) ||
        String(item.postid ?? '').toLowerCase().includes(q) ||
        String(item.boost_plan_id || '').toLowerCase().includes(q) ||
        String(item.boost_name || '').toLowerCase().includes(q) ||
        String(item.price).toLowerCase().includes(q) ||
        String(item.duration_days).toLowerCase().includes(q);

      const matchesFilter =
        this.boostStatusFilter === 'all' ||
        (this.boostStatusFilter === 'active' &&
          item.statusLabel === 'Active') ||
        (this.boostStatusFilter === 'expired' &&
          item.statusLabel === 'Expired') ||
        (this.boostStatusFilter === 'inactive' &&
          item.statusLabel === 'Inactive');

      return matchesSearch && matchesFilter;
    });
  }

  get totalBoostPlansCount(): number {
    return this.allBoostPlans.length;
  }

  get activeBoostPlansCount(): number {
    return this.allBoostPlans.filter(
      (item) => item.statusLabel === 'Active'
    ).length;
  }

  get expiredBoostPlansCount(): number {
    return this.allBoostPlans.filter(
      (item) => item.statusLabel === 'Expired'
    ).length;
  }

  get inactiveBoostPlansCount(): number {
    return this.allBoostPlans.filter(
      (item) => item.statusLabel === 'Inactive'
    ).length;
  }

  openCreateForm(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.showForm = true;
    this.resetForm();
    this.cdr.detectChanges();
  }

  openEditForm(item: AdminBoostPlanItem): void {
    this.isEditMode = true;
    this.editingId = item.boostid;
    this.showForm = true;

    this.formModel = {
      userid: item.userid,
      postid: item.postid,
      boost_plan_id: item.boost_plan_id || '',
      boost_name: item.boost_name || '',
      price: Number(item.price || 0),
      duration_days: Number(item.duration_days || 1),
      startdate: this.toDateTimeLocal(item.startdate),
      enddate: this.toDateTimeLocal(item.enddate),
      isactive: !!item.isactive,
    };

    this.cdr.detectChanges();
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingId = null;
    this.resetForm();
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.formModel = {
      userid: null,
      postid: null,
      boost_plan_id: '',
      boost_name: '',
      price: 0,
      duration_days: 1,
      startdate: '',
      enddate: '',
      isactive: true,
    };
    this.cdr.detectChanges();
  }

  async saveBoostPlan(): Promise<void> {
    if (!this.formModel.userid) {
      alert('User ID is required.');
      this.cdr.detectChanges();
      return;
    }

    if (!this.formModel.postid) {
      alert('Post ID is required.');
      this.cdr.detectChanges();
      return;
    }

    if (!this.formModel.boost_plan_id.trim()) {
      alert('Boost Plan ID is required.');
      this.cdr.detectChanges();
      return;
    }

    if (!this.formModel.boost_name.trim()) {
      alert('Boost Name is required.');
      this.cdr.detectChanges();
      return;
    }

    if (!this.formModel.startdate) {
      alert('Start date is required.');
      this.cdr.detectChanges();
      return;
    }

    if (!this.formModel.enddate) {
      alert('End date is required.');
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

const payload = {

  boostPlanId: this.formModel.boost_plan_id.trim(),

  boostName: this.formModel.boost_name.trim(),

  price: Number(this.formModel.price || 0),

  durationDays: Number(
    this.formModel.duration_days || 1
  ),

  isActive: !!this.formModel.isactive

};
    try {
      if (this.isEditMode && this.editingId) {
this.api.put(
'/boost-plans/'+this.editingId,
payload
)
.subscribe(()=>{

alert("Boost updated");

this.fetchBoostPlans();

});
        alert('Boost plan updated successfully.');
      } else {
        const insertPayload = {
          ...payload,
          createdon: new Date().toISOString(),
        };

this.api.post(
'/boost-plans',
insertPayload
)
.subscribe(()=>{

alert("Boost created");

this.closeForm();

this.fetchBoostPlans();

});
        alert('Boost plan created successfully.');
      }

      this.closeForm();
      await this.fetchBoostPlans();
    } catch (err) {
      console.error('Save boost plan exception:', err);
      alert('Something went wrong while saving boost plan.');
      this.cdr.detectChanges();
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
async toggleBoostStatus(item: AdminBoostPlanItem){

this.api.put(
'/boost-plans/'+item.boostid,
{
 isActive: !item.isactive
}
)
.subscribe(()=>{

this.fetchBoostPlans();

});

}
async deleteBoostPlan(item: AdminBoostPlanItem){

if(!confirm("Delete this boost?")) return;


this.api.delete(
'/boost-plans/'+item.boostid
)
.subscribe(()=>{

alert("Deleted");

this.fetchBoostPlans();

});

}
trackByBoostPlan(
index:number,
item:AdminBoostPlanItem
):string {

return item.boostid;

}
}