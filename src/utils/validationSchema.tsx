import * as Yup from 'yup';

const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;
const noWhiteSpace = /^([A-z0-9!@#$%^&*().,<>{}[\]<>?_=+\-|;:\'\"\/])*[^\s]\1*$/;

// ? validation schema도 페이지 별로 나누기
export const ValidationSchema = {
  Login: {
    email: Yup.string().lowercase().email().required('EmailRequired'),
    password: Yup.string().required('PasswordRequired'),
  },
  AuthEmail: {
    locale: Yup.string().required('Required'),
    email: Yup.string().lowercase().email().required('EmailRequired'),
  },
  AddNewUser: {
    userName: Yup.string().required('usernameRequired'),
    email: Yup.string()
      .lowercase()
      .email('notAnEmail')
      .required('EmailRequired'),
    password: Yup.string()
      .required('PasswordRequired')
      .min(8, 'passwordTooShort8')
      .max(20, 'passwordTooLong20')
      .matches(noWhiteSpace, 'passwordNoWhiteSpace'), 
  },
  UpdateUser: {
    userName: Yup.string().required('usernameRequired'),    
  },
  UserRegister: {
    userName: Yup.string().required('usernameRequired'),
    email: Yup.string()
      .lowercase()
      .email('notAnEmail')
      .required('EmailRequired'),
    password: Yup.string()
      .required('PasswordRequired')
      .min(8, 'passwordTooShort8')
      .max(20, 'passwordTooLong20')
      .matches(noWhiteSpace, 'passwordNoWhiteSpace'),
    authCode: Yup.string()
      .length(6, 'autCodeMustBe6Characters')
      .required('authcodeRequired'),
  },
  ResetPassword: {
    email: Yup.string()
      .lowercase()
      .email('invalidEmail')
      .required('EmailRequired'),
  },
  ResetUserPassword: {
    email: Yup.string()
      .lowercase()
      .email('invalidEmail')
      .required('EmailRequired'),
    password: Yup.string()
      .required('PasswordRequired')
      .min(8, 'tooShort')
      .max(20, 'tooLong')
      .matches(noWhiteSpace, 'noWhiteSpace'),
  },
  UpdatePasswordWithCode: {
    email: Yup.string()
      .lowercase()
      .email('invalidEmail')
      .required('EmailRequired'),
    authCode: Yup.string().required('Required').length(6, 'mustBe6Characters'),
    newPassword: Yup.string()
      .required('PasswordRequired')
      .min(8, 'tooShort')
      .max(20, 'tooLong')
      .matches(noWhiteSpace, 'noWhiteSpace'),
    newPasswordCheck: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'passwordNotMatch')
      .required('Required'),
  },
  UpdateProfileInfo: {
    name: Yup.string().required('Required'),
    language: Yup.string().required('Required'),
    phone: Yup.string().matches(phoneRegExp, 'OnlyNumbersAreAllowed'),
  },
  UpdatePassword: {
    oldPassword: Yup.string().required('Required'),
    newPassword: Yup.string()
      .required('PasswordRequired')
      .min(8, 'tooShort')
      .max(20, 'tooLong')
      .matches(noWhiteSpace, 'noWhiteSpace'),
    newPasswordCheck: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'passwordNotMatch')
      .required('Required'),
  },

  // 2 factor
  Verify2Fa: {
    code: Yup.string()
      .matches(noWhiteSpace, 'noWhiteSpace')
      .length(6, 'mustBe6Char')
      .required(),
  },

  // CMS
  CreateCMSBasicInfo: {
    'name__en-US': Yup.string()
      .required('nameEnRequired')
      .min(2, 'nameEnTooShort'),
    'name__ko-KR': Yup.string()
      .required('nameKoRequired')
      .min(2, 'nameKoTooShort'),
    'sub_name__en-US': Yup.string()
      .required('subnameEnRequired')
      .min(2, 'subnameEnTooShort'),
    'sub_name__ko-KR': Yup.string()
      .required('subnameKoRequired')
      .min(2, 'subnameKoTooShort'),
    'desc__en-US': Yup.string()
      .required('descEnRequired')
      .min(2, 'descEnTooShort'),
    'desc__ko-KR': Yup.string()
      .required('descKoRequired')
      .min(2, 'descKoTooShort'),
    // package_id: Yup.number()
    //   .transform((value) => (isNaN(value) ? undefined : value))
    //   .positive('packageIdMustBePositiveNumber')
    //   .required('packageIdRequired'),
    event_id: Yup.number()
      .transform((value) => (isNaN(value) ? undefined : value))
      .positive('eventIdMustBePositiveNumber')
      .required('eventIdRequired'),
    service_status: Yup.string().required('serviceStatusRequired'),
    parent_id: Yup.number()
      .typeError('parentIdMustBeNumber')
      .positive('parentIdMustBePositiveNumber')
      .required('parentIdRequired'),
    place: Yup.string().required('placeRequired').min(2, 'placeTooShort'),
  },

  createCMSVideoAndImagesInfo: {
    duration: Yup.number()
      .transform((value) => (isNaN(value) ? undefined : value))
      .required('durationRequired'),
    fps: Yup.number()
      .required('fpsRequired')
      .transform((value) => (isNaN(value) ? undefined : value)),
    frame_count: Yup.number()
      .required('frameCountRequired')
      .transform((value) => (isNaN(value) ? undefined : value)),
    resolution: Yup.number()
      .transform((value) => (isNaN(value) ? undefined : value))
      .required('resolutionRequired'),
    codec: Yup.string().required('codecRequired'),
    channel_count: Yup.number()
      .required('channelCountRequired')
      .transform((value) => (isNaN(value) ? undefined : value)),
    default_channel_id: Yup.number().required('defaultChannelRequired'),

    md5: Yup.string().required('md5Required'),
    file_size: Yup.number()
      .required('fileSizeRequired')
      .typeError('fileSizeMustBeNumber')
      .positive('fileSizeustBePositiveNumber'),
  },

  createCMSLiveInfo: {
    status: Yup.string().required('statusRequired'),
    rtsp_url: Yup.string()
      .required('rtpsUrlRequired')
      .min(2, 'rtslUrlTooShort'),
    hls_url: Yup.string().required('hlsUrlRequired').min(2, 'hlsUrlTooShort'),
  },
  createCMSVodInfo: {
    status: Yup.string().required('statusRequired'),
    rtsp_url: Yup.string().required('rtpsUrlRequired'),
    hls_url: Yup.string().required('hlsUrlRequired'),
  },

  createCMSTagInfo: {
    // 'en-US': Yup.string().required('enRequired'),
    // 'ko-KR': Yup.string().required('koRequired'),
    // 'zh-CN': Yup.string().required('zhCnRequired'),
    // 'zh-TW': Yup.string().required('zhTwRequired'),
    // 'ja-JP': Yup.string().required('jaRequired'),
    // 'fr-FR': Yup.string().required('frRequired'),
    // 'de-DE': Yup.string().required('deRequired'),
    // 'es-ES': Yup.string().required('esRequired'),
  },

  createCMSSearchStringInfo: {
    // 'en-US': Yup.string().required('enRequired'),
    // 'ko-KR': Yup.string().required('koRequired'),
    // 'zh-CN': Yup.string().required('zhCnRequired'),
    // 'zh-TW': Yup.string().required('zhTwRequired'),
    // 'ja-JP': Yup.string().required('jaRequired'),
    // 'fr-FR': Yup.string().required('frRequired'),
    // 'de-DE': Yup.string().required('deRequired'),
    // 'es-ES': Yup.string().required('esRequired'),
  },

  // cms live info modal
  createCMSLiveObjInfo: {
    sport: Yup.string().required('sportRequired'),
    play_type: Yup.string().required('playTypeRequired'),
    detail_url: Yup.string().required('detailUrlRequired'),
    api_url: Yup.string().required('apiUrlRequired'),
    'home_team_name__en-US': Yup.string().required('homeTeamNameEnRequired'),
    'home_team_name__ko-KR': Yup.string().required('homeTeamNameKoRequired'),
    'home_team_nickname__en-US': Yup.string().required('homeTeamNicknameEnRequired'),
    'home_team_nickname__ko-KR': Yup.string().required('homeTeamNicknameKoRequired'),
    'away_team_name__en-US': Yup.string().required('awayTeamNameEnRequired'),
    'away_team_name__ko-KR': Yup.string().required('awayTeamNameKrRequired'),
    'away_team_nickname__en-US': Yup.string().required('awayTeamNicknameEnRequired'),
    'away_team_nickname__ko-KR': Yup.string().required('awayTeamNicknameKoRequired'),

    home_team_icon: Yup.string().required('homeTeamIconRequired'),
    away_team_icon: Yup.string().required('awayTeamIconRequired'),
    present_round: Yup.string().required('presentRoundRequired'),
    present_quarter: Yup.number()
      .required('presentQuarterRequired')
      .typeError('presentQuarterMustBeNumber'),
    home_team_score: Yup.number()
      .typeError('homeTeamScoreMustBeNumber')
      .min(0, 'homeTeamScoreBePositiveNumber')
      .required('homeTeamScoreRequired'),
    away_team_score: Yup.number()
      .typeError('awayTeamScoreMustBeNumber')
      .min(0, 'awayTeamScoreBePositiveNumber')
      .required('awayTeamScoreRequired'),
    extra_1_str: Yup.string().test(
      'len',
      'Must be exactly 3 characters',
      (val) => val.length === 3
    ),
  },

  // CMS category
  CreateCMSCategoryInfo: {
    category_type: Yup.string().required('categoryTypeRequired'),
    'name__en-US': Yup.string()
      .required('categoryNameEnRequired')
      .min(2, 'categoryNameEnTooShort'),
    'name__ko-KR': Yup.string()
      .required('categoryNameKoRequired')
      .min(2, 'categoryNameKoTooShort'),
    'sub_name__en-US': Yup.string()
      .required('categorySubnameEnRequired')
      .min(2, 'categorySubnameEnTooShort'),
    'sub_name__ko-KR': Yup.string()
      .required('categorySubnameKrRequired')
      .min(2, 'categorySubnameKrTooShort'),
    'desc__en-US': Yup.string()
      .required('categoryDescEnRequired')
      .min(2, 'categoryDescEnTooShort'),
    'desc__ko-KR': Yup.string()
      .required('categoryDescKoRequired')
      .min(2, 'categoryDescKoTooShort'),
    genre_id: Yup.number()
      .required('genreIdRequired')
      .positive('genreIdMustBePositiveNumber'),
    category_id: Yup.number()
      .required('categoryIdRequired')
      .positive('categoryIdMustBePositiveNumber'),
    league_id: Yup.number()
      .required('leagueIdRequired')
      .positive('leagueIdMustBePositiveNumber'),
    season_id: Yup.number()
      .required('seasonIdRequired')
      .positive('seasonIdMustBePositiveNumber'),
  },

  ///////////////////////////////////////////////////////////////
  // IMS
  ///////////////////////////////////////////////////////////////
  CreateVenue: {
    name: Yup.string().required('nameRequired'),
    country_id: Yup.string().required('countryRequired'),
    event_name: Yup.string().required('eventNameRequired'),
    event_yymm: Yup.string()
      .test('len', 'eventYymn4MustBeCharacters', (val) => val.length === 4)
      .required('eventYymmRequired'),
    description: Yup.string().required('descriptionRequired'),
  },
  CreateSystem: {
    name: Yup.string().required('nameRequired'),
    venue_id: Yup.string().required('venueRequired'),
    fps: Yup.string().min(0, 'fpsMustBePositiveNumber'),
    width: Yup.number()
      .typeError('widthMustBeNumber')
      .min(0, 'widthBePositiveNumber'),
    height: Yup.number()
      .typeError('heightMustBeNumber')
      .min(0, 'heightMustBePositiveNumber'),
    description: Yup.string(),
  },
  CreateSystemRule: {
    name: Yup.string().required('nameRequired'),
    node_type: Yup.string().required('nodeTypeRequired'),
    session: Yup.number()
      .typeError('sessionMustBeNumber')
      .min(0, 'sessionMustBePositiveNumber')
      .required('sessionRequired'),
    max_instances: Yup.number()
      .typeError('maxInstancesMustBeNumber')
      .min(0, 'maxInstancesMustBePositiveNumber')
      .required('maxInstancesRequired'),
  },
  CreateSystemScale: {},
  CreateSystemNode: {},
  CreateSystemGroup: {},
  CreateSystemChannel: {},
  ImportExcel: {
    venueId: Yup.string().required('VenueIdRequired'),
    systemId: Yup.string().required('SystemIdRequired'),
  },
  
};
