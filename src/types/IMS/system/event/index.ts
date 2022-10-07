export interface ValueType {
  content_id?:number,
  name?: string;
  description?: string;
  initial_state?: string;
  live_status_name?: string;
  is_public_name?: string;
  status_name?: string;  
}

export interface ItemType extends ValueType {
  id: number;
  live_status?: string;
  is_public?: string;
  scheduled_at?: string;
  registered_at?: string;
  updated_at?: string;
}
