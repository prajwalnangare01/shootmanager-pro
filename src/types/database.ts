export type UserRole = 'admin' | 'photographer';

export type ShootStatus = 
  | 'Assigned' 
  | 'Accepted' 
  | 'Reached' 
  | 'Started' 
  | 'Completed' 
  | 'QC_Uploaded' 
  | 'Approved';

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  user_id: string;
  available_date: string;
  created_at: string;
}

export interface Shoot {
  id: string;
  merchant_name: string;
  location: string;
  shoot_date: string;
  shoot_time: string;
  photographer_id: string | null;
  status: ShootStatus;
  qc_link: string | null;
  raw_link: string | null;
  payout: number | null;
  created_at: string;
  updated_at: string;
  photographer?: Profile;
}
