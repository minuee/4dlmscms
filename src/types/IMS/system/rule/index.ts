export interface ValueType {
  name: string;
  node_type?: string;
  session?: number;
  max_instances?: number;
  description?: string;
  region?: string;
  //
  // ls_type?: string;
  // id?: number;
  // registered_at?: string;
  // updated_at?: string;
}

export interface ItemType extends ValueType {
  id: number;
  registered_at?: string;
  updated_at?: string;
}
