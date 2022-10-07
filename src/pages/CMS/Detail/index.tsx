import React, { useContext, useEffect, lazy } from 'react';
import { useHistory, Redirect, useLocation } from 'react-router-dom';
import { FFmpeg } from '@ffmpeg/ffmpeg';

import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';

import { CMSContext } from 'cont/cms';

const BasicInfo = lazy(() => import('./Basic'));
const VideoAndImagesInfo = lazy(() => import('./VideoAndImages'));
const LiveInfo = lazy(() => import('./Live'));
const VodInfo = lazy(() => import('./Vod'));
const TagInfo = lazy(() => import('./Tags'));
const SearchTextInfo = lazy(() => import('./SearchString'));
import Button from '@/components/Button/Button';
import { IS_CHILD } from '@/settings/constants';

export interface FmpegProps {
  ffmpeg?: FFmpeg;
  isFfmpegLoaded: boolean;
  ffmpegLoadFailed: boolean;
}

function ContentDetail({ ffmpeg, ffmpegLoadFailed, isFfmpegLoaded }: FmpegProps) {
  const history = useHistory();
  const location = useLocation();
  const { step, isUpdate, changeIsUpdate } = useContext(CMSContext);

  // child 업데이트/생성인지 parent 업데이트/생성인지 나타내는 변수
  const isChildContent = location.pathname.includes(IS_CHILD) ? true : false;

  // const cmsData = useAppSelector((state: ReducerType) => state.cms.cms);
  // updated redux
  const cmsData = useAppSelector((state: ReducerType) =>
    isChildContent ? state.content.childCurrent : state.content.parentCurrent
  );

  useEffect(() => {
    // if (cmsData.isUpdate) changeIsUpdate(true); //
    if (location.pathname.includes('update')) changeIsUpdate(true);
  }, []);

  return (
    <>
      <section className='cms mt-3 relative h-full'>
        <BasicInfo cmsData={cmsData} />
        {isUpdate ? (
          <VideoAndImagesInfo
            ffmpeg={ffmpeg}
            isFfmpegLoaded={isFfmpegLoaded}
            ffmpegLoadFailed={ffmpegLoadFailed}
            cmsData={cmsData}
          />
        ) : step > 0 ? (
          <VideoAndImagesInfo
            ffmpeg={ffmpeg}
            isFfmpegLoaded={isFfmpegLoaded}
            ffmpegLoadFailed={ffmpegLoadFailed}
            cmsData={cmsData}
          />
        ) : null}
        {isUpdate ? (
          <LiveInfo cmsData={cmsData} />
        ) : step > 1 ? (
          <LiveInfo cmsData={cmsData} />
        ) : null}
        {isUpdate ? (
          <VodInfo cmsData={cmsData} />
        ) : step > 2 ? (
          <VodInfo cmsData={cmsData} />
        ) : null}
        {isUpdate ? (
          <TagInfo cmsData={cmsData} />
        ) : step > 3 ? (
          <TagInfo cmsData={cmsData} />
        ) : null}
        {isUpdate ? (
          <SearchTextInfo cmsData={cmsData} />
        ) : step > 4 ? (
          <SearchTextInfo cmsData={cmsData} />
        ) : null}

        <div className='flex justify-end mt-4'>
          <Button
            color='btn-danger'
            size='btn-lg'
            onClick={() => history.goBack()}
          >
            back to list
          </Button>
        </div>
      </section>
    </>
  );
};
export default ContentDetail;
