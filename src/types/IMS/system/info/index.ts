export interface ValueType {
  name?: string;
  description?: string;
  venue_id: string;
  fps?: number;
  width?: number;
  height?: number;
  is_extra?: string;
  comment?: string;
  //
}
export interface ItemType extends ValueType {
  id?: string;
  updated_at?: string;
  registered_at?: string;
}
