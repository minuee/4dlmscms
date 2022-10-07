// export const _TYPE = {
//     commonCode: 'CM01',
//     list: [
//       { name: 'true', code: 'CM01Y' },
//     ],
//   };

export const BOOL_TYPE = {
  commonCode: 'CM01',
  list: [
    { name: true, code: 'CM01Y', stringValue: 'Y' },
    { name: false, code: 'CM01N', stringValue: 'N' },
  ],
};

export const LIVE_STATUS_TYPE = {
  commonCode: 'CM02',
  list: [
    { name: 'scheduled', code: 'CM0201' },
    { name: 'live', code: 'CM0202' },
    { name: 'canceled', code: 'CM0203' },
    { name: 'finished', code: 'CM0204' },
  ],
};
export const CHANNEL_STATUS_TYPE = {
  commonCode: 'CM03',
  list: [
    { name: 'SCHEDULED', code: 'CM01Y' },
    { name: 'LIVE', code: 'CM01Y' },
    { name: 'CANCELED', code: 'CM01Y' },
    { name: 'FINISHED', code: 'CM01Y' },
  ],
};

export const NODE_TYPE = {
  commonCode: 'CM04',
  list: [
    { name: '4dc', code: 'CM0401' },
    { name: '4drs', code: 'CM0402' },
    { name: '4dsr', code: 'CM0403' },
    { name: '4drm', code: 'CM0404' },
    { name: '4dss', code: 'CM0405' },
    { name: '4dls', code: 'CM0406' },
    { name: 'cms', code: 'CM0407' },
    { name: '4dml', code: 'CM0408' },
    { name: 'cms_w', code: 'CM0409'},
    { name: 'ims', code: 'CM0410'},
    { name: 'prewarmer', code: 'CM0411'}
  ],
};

export const EVENT_STATUS_TYPE = {
  commonCode: 'CM05',
  list: [
    { name: 'PAUSE', code: 'CM0501' },
    { name: 'RESUME', code: 'CM0502' },
  ],
};
export const INSTANCE_STATUS_TYPE = {
  commonCode: 'CM06',
  list: [
    { name: 'RUNNING', code: 'CM0601' },
    { name: 'TEMPORARY', code: 'CM0602' },
    { name: 'TERMINATED', code: 'CM0603' },
  ],
};

export const REGION_TYPE = {
  commonCode: 'CM07',
  list: [
    { name: 'VIR', code: 'us-east-1' },
    { name: 'OH', code: 'us-east-2' },
    { name: 'CAL', code: 'us-west-1' },
    { name: 'OR', code: 'us-west-2' },
    { name: 'JP', code: 'ap-northeast-1' },
    { name: 'KR', code: 'ap-northeast-2' },
    { name: 'SIN', code: 'ap-southeast-1' },
    { name: 'SYD', code: 'ap-southeast-2' },
    { name: 'CAN', code: 'ca-central-1' },
    { name: 'GER', code: 'eu-central-1' },
    { name: 'UK', code: 'eu-west-2' },
    { name: 'ITA', code: 'eu-south-1' },
    { name: 'FRA', code: 'eu-west-3' },
    { name: 'HK', code: 'ap-east-1' },
    { name: 'KT', code: 'af-south-1' },
    { name: 'MB', code: 'ap-south-1' },
    { name: 'OS', code: 'ap-northeast-3' },
    { name: 'IL', code: 'eu-west-1' },
    { name: 'SH', code: 'eu-north-1' },
    { name: 'BA', code: 'me-south-1' },
    { name: 'BRA', code: 'sa-east-1' },
  ],
};

export const LS_TYPE = {
  commonCode: 'CM08',
  list: [
    { name: 'null', code: null},
    { name: 'MASTER', code: 'CM0801' },
    { name: 'SLAVE', code: 'CM0802' },
  ],
};

export const NODE_STATUS_TYPE = {
  commonCode: 'CM09',
  list: [
    { name: 'ENABLE', code: 'CM0901' },
    { name: 'DISABLE', code: 'CM0902' },
  ],
};

export const GROUP_TYPE = {
  commonCode: 'CM10',
  list: [
    { name: 'MAINVIEW', code: 'CM1001' },
    { name: 'SUBVIEW', code: 'CM1002' },
  ],
};

export const MEDIA_TYPE = {
  commonCode: 'CM11',
  list: [
    { name: 'VIDEO', code: 'CM1101' },
    { name: 'AUDIO', code: 'CM1102' },
    { name: 'ALL', code: 'CM1103' },
  ],
};

export const AUDIO_CHANNEL_TYPE = {
  commonCode: 'CM12',
  list: [
    { name: 'MONO', code: 'CM1201' },
    { name: 'STEREO', code: 'CM1202' },
    { name: 'SURROUND', code: 'CM1203' },
  ],
};

export const VIEW_TYPE = {
  commonCode: 'CM13',
  list: [
    { name: 'MAINVIEWA', code: 'CM1301' },
    { name: 'MAINVIEWB', code: 'CM1302' },
    { name: 'MAINVIEWC', code: 'CM1303' },
    { name: 'MAINVIEWD', code: 'CM1304' },
    { name: 'MAINVIEWE', code: 'CM1305' },
    { name: 'MAINVIEWF', code: 'CM1306' },
    { name: 'MAINVIEWG', code: 'CM1307' },
    { name: 'MAINVIEWH', code: 'CM1308' },
    { name: 'MAINVIEWI', code: 'CM1309' },
    { name: 'MAINVIEWJ', code: 'CM1310' },

    { name: 'MULTIVIEWA', code: 'CM1311' },
    { name: 'MULTIVIEWB', code: 'CM1312' },
    { name: 'MULTIVIEWC', code: 'CM1313' },
    { name: 'MULTIVIEWD', code: 'CM1314' },
    { name: 'MULTIVIEWE', code: 'CM1315' },
    { name: 'MULTIVIEWF', code: 'CM1316' },

    { name: 'BIRDVIEWA', code: 'CM1317' },
    { name: 'BIRDVIEWB', code: 'CM1318' },
    { name: 'BIRDVIEWC', code: 'CM1319' },

    { name: 'EXTERNALA', code: 'CM1320' },
    { name: 'EXTERNALB', code: 'CM1321' },
    { name: 'EXTERNALC', code: 'CM1322' },

    { name: 'PDVIEWA', code: 'CM1323' },
    { name: 'PDVIEWB', code: 'CM1324' },
    { name: 'PDVIEWC', code: 'CM1325' },
  ],
};

export const ML_TYPE = {
  commonCode: 'CM014',
  list: [
    { name: '0', code: null, desc: 'null'},
    { name: '1', code: 'CM1401', desc: 'Dispatcher' },
    { name: '2', code: 'CM1402', desc: 'EMSG' },
    { name: '3', code: 'CM1403', desc: '4DML_Media_Pipeline' },
    { name: '4', code: 'CM1404', desc: 'Vod_Pipeline' },
    { name: '5', code: 'CM1405', desc: 'iVod_PipeLine' },
    { name: '6', code: 'CM1406', desc: 'Mediastore' },
    { name: '7', code: 'CM1407', desc: '4DML_Manager' },
  ],
};
export const DEPLOY_TYPE = {
  commonCode: 'CM015',
  list: [
    { name: 'null', code: null},
    { name: 'mediastore', code: 'CM1501' },
    { name: 's3', code: 'CM1502' },
    { name: 'file_server', code: 'CM1503' },
  ],
};

//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
export const IMS_COMMON_CODES = {
  CM01: BOOL_TYPE.list,
  CM02: LIVE_STATUS_TYPE.list,
  CM03: CHANNEL_STATUS_TYPE.list,
  CM04: NODE_TYPE.list,
  CM05: EVENT_STATUS_TYPE.list,
  CM06: INSTANCE_STATUS_TYPE.list,
  CM07: REGION_TYPE.list,
  CM08: LS_TYPE.list,
  CM09: NODE_STATUS_TYPE.list,
  CM10: GROUP_TYPE.list,
  CM11: MEDIA_TYPE.list,
  CM12: AUDIO_CHANNEL_TYPE.list,
  CM13: VIEW_TYPE.list,
  CM14: ML_TYPE.list,
  CM15: DEPLOY_TYPE.list,
};
