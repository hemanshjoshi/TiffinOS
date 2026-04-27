export type Address = {
  id: string;
  user_id: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  house_flat_no: string;
  building_society?: string;
  street_area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
};
