export interface Category {

  _id: string;

  categoryName: string;

  // old supabase compatibility
  categoryid?: string;

  categoryname?: string;

  slug?: string;

  availableIn?: string[];

}



export interface Subcategory {

  _id: string;

  subcategoryName: string;

  // old supabase compatibility
  subcategoryid?: string;

  subcategoryname?: string;

  categoryId?: string;

  slug?: string;

}



export interface StateItem {

  _id: string;

  stateid?: string;

  statename?: string;

  name?: string;

}



export interface CityItem {

  _id: string;

  cityid?: string;

  cityname?: string;

  name?: string;

}



export interface AreaItem {

  _id: string;

  areaid?: string;

  areaname?: string;

  name?: string;

}