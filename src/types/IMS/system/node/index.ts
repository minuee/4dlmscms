export interface ValueType {
  name?: string;
  domain?: string;
  initial_state?: string;
  instance_id?: string;
  // is_auto_scale_out?: string;
  is_origin?: string;
  ls_type?: string;
  ml_type?: string;
  deploy_type?: string;
  node_type?: string;
  parent_node_id?: number | undefined;
  private_ip?: string;
  private_port?: number | undefined;
  public_ip: string;
  public_port?: number | undefined;
  region?: string;
  // region_name?: string;
  state?: string;

  //
  // id?: number;
  // registered_at?: string;
  // updated_at?: string;
}

export interface ItemType extends ValueType {
  id: number;
  registered_at?: string;
  updated_at?: string;
}
