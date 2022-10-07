export interface ValueType {
  scale_group_count: number | undefined;
  scale_image_id: string;
  scale_instance_type: string;
  scale_instance_type2: string;
  scale_subnet_ids: string;
  scale_monitoring_tag_name: string;
  scale_monitoring_tag_value: string;
  scale_on: string;
  scale_out_resource: number;
  scale_in_resource: number;
  scale_out_limit_time: number;
  scale_ss_name: string;
  scale_key_name: string;
  region: string;
  scale_security_group_ids: string;
  //
}

export interface ItemType extends ValueType {
  id: number;
  registered_at?: string;
  updated_at?: string;
}
