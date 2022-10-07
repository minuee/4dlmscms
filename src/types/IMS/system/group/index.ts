export interface ValueType {
  name: string;
  default_audio_index: number;
  default_channel_index: number;
  description: string;
  group_index: number;
  is_default_group: string | boolean;
  is_external_group: string | boolean;
  is_interactive: string | boolean;
  is_pdview: string | boolean;
  is_replay: string | boolean;
  is_timemachine: string | boolean;
  type: string;
  view_type: string;

  //
  region?: string;
  //
  // id?: number;
  // registered_at?: string;
  // updated_at?: string;
}

export interface ItemType extends ValueType {
  id: number;
  updated_at?: string;
  registered_at?: string;
}

type ChannelType = {
  camera_ip: string;
  description: string;
  gimbal_ip: string;
  group_id: number;
  id: number;
  is_gimbal_preset: string | null;
  live_index: number;
  media_type: number;
  media_type_name: string;
  name: string;
  pdview_master_index: number;
  registered_at: string;
  server_ip: string;
  server_port: number;
  status: string; // TODO: 나중에 선택지 확인해서 바꾸기
  system_id: string;
  updated_at?: string;
};
export interface ClickedItemValueType extends ValueType {
  id?: string;
  audio: {
    input_info: {
      codec: string;
      sample_rate: number;
      sample_bit: number;
      channel_type: number;
    };
    output_info: {
      codec: string;
      sample_rate: number;
      sample_bit: number;
      channel_type: number;
    };
  };
  video: {
    input_info: {
      codec: string;
      width: number;
      height: number;
      fps: number;
      gop: number;
      bitrate: number;
    };
    output_info: {
      codec: string;
      width: number;
      height: number;
      fps: number;
      gop: number;
      bitrate: number;
    };
  };
  channel_list: ChannelType[];
}

export type ClickedItemType = {
  isOpen: boolean;
  clickedIdx: number;
  currentValue: ClickedItemValueType;
};
