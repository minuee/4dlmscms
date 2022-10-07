import React, { useContext, lazy, useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  CMS,
  CMS_CONTENT,
  CMS_CONTENT_LIST,
  CMS_CONTENT_LIST_CREATE,
  CMS_CONTENT_LIST_UPDATE,
  CMS_CONTENT_CREATE,
  CMS_CONTENT_UPDATE,
} from 'sets/constants';

import CMSProvider, { CMSContext } from 'cont/cms';

const ContentDetail = lazy(() => import('./Detail'));
const ChildList = lazy(() => import('./ChildContentist'));
const ParentList = lazy(() => import('./ParentContentList'));

interface IF {}

// REACT_APP_IS_DOCKER_LOCAL_VERION 가 아닐 때만 ffmpeg 동적임포트해서 생성
let ffmpeg;
if (process.env.REACT_APP_IS_DOCKER_LOCAL_VERION !== 'true') {
  import('@ffmpeg/ffmpeg').then((module) => {
    const { createFFmpeg } = module;    
    // 컴포넌트 밖에 생성하여 컴포넌트 생성시 create하지 않도록 방지(메모리 누수 방지)
    ffmpeg = createFFmpeg({
      log: true,
    });
  });
}

const Content: React.FC<IF> = (props: IF) => {
  const { step, updateStep } = useContext(CMSContext);
  const [isFfmpegFailed, setIsFfmpegFailed] = useState<boolean>(false);
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState<boolean>(false);

  // const location = useLocation();
  // const pathName = location.pathname;
  // const isContentChildListPage = pathName.includes(CMS_CONTENT_LIST);
  // let params = useParams<ParamType>();

  useEffect(() => {
    // docker local 버전일 경우 리턴 (ffmpeg 사용 X)
    if (process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true') return;
    
    const isMobileDevice = /Mobi/i.test(window.navigator.userAgent);
    // 모바일이 아닐 경우에만 ffmpeg을 로드한다.
    // 모바일일 경우 영상 수정을 할 수 없다는 안내 메시지는 디테일 페이지에서 띄워준다.
    if (!isMobileDevice) load();
  }, []);

  // useEffect(() => {
  //   console.log(ffmpeg.isLoaded());
  // }, [ffmpeg.isLoaded()]);

  const load = async () => {
    if (ffmpeg.isLoaded()) {
      return;
    }

    try {
      console.time('ffmpeg.load');
      await ffmpeg.load();
      setIsFfmpegLoaded(true);
    } catch (error) {
      // ffmpeg 로드 실패 시 실패 플래그 넘김
      setIsFfmpegFailed(true);
      setIsFfmpegLoaded(false);
    } finally {
      console.timeEnd('ffmpeg.load');
    }
  };

  return (
    <Switch>
      <CMSProvider value={{ step, updateStep }}>
        <Route exact path={[CMS, CMS_CONTENT]}>
          <ParentList />
        </Route>
        <Route exact path={`${CMS_CONTENT_LIST}`}>
          <ChildList />
        </Route>
        <Route
          path={[
            `${CMS_CONTENT_LIST_CREATE}`,
            `${CMS_CONTENT_LIST_UPDATE}`,
            CMS_CONTENT_CREATE,
            `${CMS_CONTENT_UPDATE}`,
          ]}
        >
          <ContentDetail
            ffmpeg={ffmpeg}
            isFfmpegLoaded={isFfmpegLoaded}
            ffmpegLoadFailed={isFfmpegFailed}
          />
        </Route>
      </CMSProvider>
      <Redirect to={CMS_CONTENT} />
    </Switch>
  );
};
export default Content;
