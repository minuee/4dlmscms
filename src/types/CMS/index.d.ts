// 오름차순, 내림차순 정렬
type OrderingType = 0 | 1;
type CategoryType = 'category' | 'genre' | 'round' | 'season' | 'league';
// c: 생성된 시간순, u: 업데이트 순, lst: 라이브 시작시간순, cti: content_id 순서
type ItemOrderType = 'c' | 'u' | 'lst' | 'cti';
type ImageUploadType = 'thumb' | 'normal' | 'icon' | 'banner';
type ImageSizeType = 'lg' | 'md' | 'sm';
type ImgSizeType = 'large' | 'middle' | 'small';

type ParamType = {
  contentId?: string;
};

/////////////////////////////////////////////////////////////
type InfoNameType = {
  'zh-CN'?: string;
  'zh-TW'?: string;
  'ja-JP'?: string;
  'fr-FR'?: string;
  'de-DE'?: string;
  'es-ES'?: string;
  'en-US': string;
  'ko-KR'?: string;
};

// 기본 정보
// 서버에 보내는 타입
interface BasicValueType {
  name: InfoNameType;
  sub_name: InfoNameType;
  desc: InfoNameType;
  package_id: number;
  event_id: number;
  ims_event_id: string;
  ims_system_id?: string;
  genre_id?: number;
  category_id?: number;
  league_id?: number;
  season_id?: number;
  round_id?: number;
  video_type_id: number;
  service_status: number;
  exposure_order?: number;
  have_parent: boolean;
  parent_id?: number;
  is_live: boolean;
  place: string;
  is_category: boolean;
}

///////////////////////////////////////////////////
// ********* video

// TODO: input 타입들은 키값이 다름...따로 만들어야 함

// 서버에 보내는 타입
interface VideoValueType {
  duration: number;
  fps: number;
  frame_count: number;
  resolution: number;
  codec: string;
  file_size: number;
  default_channel_id: number;
  channel_count: number;
  is_interactive: boolean;
  md5: string;
  hls_replay: boolean;
}

// inputs
interface VideoInputsType {
  file?: File;
  fileName?: string;
  fileType?: string;
  url?: string;
  file_size?: number;
  fps?: number;
  duration?: number;
  frame_count_array?: string[];
  frame_count?: number;
  resolution?: number;
  codec?: string;
  channel_count?: number;
  is_interactive?: boolean;
  hls_replay?: boolean;
  md5?: string;
  default_channel_id?: number;
  uploadedVideoURL?: string;
  origin_file_name?: string;
  video_type_id?: number;
  cmsVideoType?: string;
}

// 서버에서 리턴하는 타입
interface VideoItemType extends VideoValueType {
  bucket_name: string;
  bucket_key_name: string;
  origin_file_name: string;
  url: string;
  content_type: string;
}

///////////////////////////////////////////////////
// ********* image
// 서버에 보내는 타입
interface ImageValueType {
  large?: string;
  middle?: string;
  small?: string;
}

// 서버에서 리턴하는 타입
interface ImageItemType extends ImageValueType {
  large_url?: string;
  middle_url?: string;
  small_url?: string;
}

// 서버에 보내는 타입
interface TotalImageValuetype {
  thumb?: ImageValueType;
  banner?: ImageValueType;
  image?: ImageValueType;
  icon?: ImageValueType;
}

// 서버에서 리턴하는 타입
interface TotalImageItemtype {
  thumb: ImageItemType;
  banner: ImageItemType;
  image: ImageItemType;
  icon: ImageItemType;
}

///////////////////////////////////////////////////
// ********* live, vod

interface PlayInfoType {
  // info: {
  sport: number;
  play_type: number;
  detail_url: string;
  api_url: string;
  'home_team_name__en-US': string;
  'home_team_name__ko-KR': string;
  'home_team_nickname__en-US': string;
  'home_team_nickname__ko-KR': string;
  'away_team_name__en-US': string;
  'away_team_name__ko-KR': string;
  'away_team_nickname__en-US': string;
  'away_team_nickname__ko-KR': string;
  home_team_icon: string;
  away_team_icon: string;
  present_round: string;
  present_quarter: number;
  home_team_score: number;
  away_team_score: number;
  // };
}

// price
type PriceType = {
  USD?: number;
  KRW?: number;
  EURO?: number;
  CNY?: number;
  JPY?: number;
  TWD?: number;
};

interface LiveAndVodCommonValueType {
  total_stream_price?: PriceType;
  partial_stream_price?: PriceType;
  total_download_price?: PriceType;
  partial_download_price?: PriceType;
  status: number;
  start_time?: number;
  end_time?: number;
  exposure_order?: number;
  rtsp_url?: string;
  hls_url?: string;
  camera_group?: Object | string[];
  info?: PlayInfoType;

  drm_free: boolean;
  can_download?: boolean;
  stream_geo_permission?: string[];
  download_geo_permission?: string[];
  bundle?: string | string[];
  stream_expired_term?: number;
  download_expired_term?: number;
}
interface LiveAndVodCommonItemType extends LiveAndVodCommonValueType {
  view_count?: number;
  comment_count?: number;
}

// interface LiveItemType extends LiveAndVodCommonItemType {
//   info?: PlayInfoType;
// }

///////////////////////////////////////////////////
// ********* tag
interface TagValueType {
  'en-US'?: string[];
  'ko-KR'?: string[];
  'zh-CN'?: string[];
  'zh-TW'?: string[];
  'ja-JP'?: string[];
  'fr-FR'?: string[];
  'de-DE'?: string[];
  'es-ES'?: string[];
}
// interface TagItemType extends TagValueType {}

///////////////////////////////////////////////////
// ********* search_string
interface SearchStringValueType extends InfoNameType {}
// interface SearchStringItemType extends SearchStringValueType {}
//////
interface TotalValueType extends BasicValueType {
  //
  video?: VideoValueType;
  photo?: ImageValueType;
  live?: LiveAndVodCommonValueType;
  vod?: LiveAndVodCommonValueType;
  tag?: TagValueType;
  search_string?: SearchStringValueType;
}
interface TotalItemType extends BasicValueType {
  _id: string;
  createdAt: string;
  updatedAt: string;
  content_id: number;
  //

  video?: VideoItemType;
  photo?: TotalImageItemtype;
  live?: LiveAndVodCommonItemType;
  vod?: LiveAndVodCommonItemType;
  tag?: TagValueType;
  search_string?: SearchStringValueType;
}

/////////////////////////////////////////////////////
