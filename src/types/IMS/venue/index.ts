export type ValueType = {
  id?: string;
  country_id: string;
  description?: string;
  event_name: string;
  event_yymm: string;
  name: string;
  event_code?: string;
};
export interface ItemType extends ValueType {
  //id?: string;
  registered_at?: string;
  updated_at?: string;  
}
