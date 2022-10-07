import React, { useState, useLayoutEffect, useEffect } from 'react';
import DataGrid from 'react-data-grid';
// import '@inovua/reactdatagrid-enterprise/theme/default-dark.css';

import useChannelRequest from '@/apis/IMS/system/detail/channel/index';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';

interface IF {}

const Channel: React.FC<IF> = (props: IF) => {
  const { requestChannelIncludesGroups, isLoading } = useChannelRequest();
  const systemData = useAppSelector((state: ReducerType) => state.info.current);

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);

  const handleRequestData = async () => {
    const result = await requestChannelIncludesGroups(systemData.id);
    if (!result) return;
    // console.log({ result });

    const tempColums = [];
    for (const property in result[0]) {
      tempColums.push({ key: property, name: property.replace('_', ' ') });
    }

    // const customHeader = [];
    // for (const property in tempColums) {
    //   customHeader.push({ property: '' });
    // }
    // setData([customHeader, ...result]);
    //setData([result[0], ...result]);
    setData([...result]);
    // setData(result);
    setColumns(tempColums);
  };

  useLayoutEffect(() => {
    handleRequestData();
  }, []);

  return (
    <>
      {/* <div role='row' className='rdg-header-row '>
        <div role='columnheader' className='rdg-cell c1wupbe700-beta7'></div>
        test
      </div> */}
      <DataGrid
        // columns={[
        //   { key: 'test', name: 'test' },
        //   { key: 'video', name: 'video' },
        //   { key: 'audio', name: 'audio' },
        // ]}
        // rows={[DUMMY_DATA]}
        columns={columns}
        rows={data}
        defaultColumnOptions={{
          resizable: true,
          sortable: true,
        }}
        className='capitalize border-none'
      />
    </>
  );
};
export default Channel;

const DUMMY_DATA = {
  test: {
    channel_id: '0004A840',
    channel_index: 1,
    camera_ip: '10.82.17.113',
    name: 'CAMERA-0001',
    status: 'CM0301',
    media_type: 'CM1101',
    gimbal_ip: '10.82.17.230',
  },
  video: {
    is_gimbal_preset: null,
    server_ip: '13.125.94.155',
    server_port: 8554,
    pdview_master_index: 24,
    group_id: '0004A255',
    group_index: 1,
    group_name: 'MAINVIEW',
    view_type: 'CM1301',
    description: 'Main Group 1',
    type: 'CM1001',
    is_external_group: 'CM01N',
    default_channel_index: 1,
    default_audio_index: 0,
    is_default_group: 'CM01Y',
    is_interactive: 'CM01Y',
    is_replay: 'CM01Y',
    is_timemachine: 'CM01Y',
    is_pdview: 'CM01N',
    video_input_codec: 'H.264',
    video_input_width: 3840,
    video_input_height: 2160,
    video_input_bitrate: 75000,
    video_input_gop: 12,
    video_input_fps: 59.94,
    video_output_codec: 'H.264',
    video_output_width: 1920,
  },
  audio: {
    video_output_height: 1080,
    video_output_bitrate: 10000,
    video_output_gop: 1,
    video_output_fps: 29.97,
    audio_input_channel_type: 'CM1202',
    audio_input_codec: 'AAC',
    audio_input_sample_rate: '48000',
    audio_input_sample_bit: '16',
    audio_output_channel_type: 'CM1202',
    audio_output_codec: 'AAC',
    audio_output_sample_rate: '48000',
    audio_output_sample_bit: '16',
  },
};
