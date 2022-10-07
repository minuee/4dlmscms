import React, { lazy } from 'react';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';

import {
  SYSTEM_CREATE,
  SYSTEM_UPDATE,
  SYSTEM_CREATE_RULE,
  SYSTEM_CREATE_SCALE,
  SYSTEM_CREATE_NODE,
  SYSTEM_CREATE_GROUP,
  SYSTEM_CREATE_GROUP_CREATE,
  SYSTEM_CREATE_CHANNEL,
  SYSTEM_CREATE_CHANNEL_CREATE,
  SYSTEM_CREATE_GROUP_AND_CHANNEL,
  SYSTEM_CREATE_INFO,
  SYSTEM_CREATE_EVENT,
  SYSTEM_UPDATE_INFO,
  SYSTEM_UPDATE_RULE,
  SYSTEM_UPDATE_SCALE,
  SYSTEM_UPDATE_NODE,
  SYSTEM_UPDATE_GROUP,
  SYSTEM_UPDATE_EVENT,

  TEST_SYSTEM_CREATE,
  TEST_SYSTEM_CREATE_INFO,
  TEST_SYSTEM_UPDATE_INFO,
  TEST_SYSTEM_CREATE_RULE,
  TEST_SYSTEM_UPDATE_RULE,
  TEST_SYSTEM_CREATE_SCALE,
  TEST_SYSTEM_UPDATE_SCALE,
  TEST_SYSTEM_CREATE_NODE,
  TEST_SYSTEM_UPDATE_NODE,
  TEST_SYSTEM_UPDATE,
  TEST_SYSTEM_CREATE_GROUP,
  IS_IMS_TEST,
  TEST_SYSTEM_UPDATE_GROUP,
  SYSTEM_UPDATE_CHANNEL,
} from 'sets/constants';

const Info = lazy(() => import('./Info'));
const Rule = lazy(() => import('./Rule'));
const Scale = lazy(() => import('./Scale'));
const Node = lazy(() => import('./Node'));
const Group = lazy(() => import('./Group'));
const Channel = lazy(() => import('./Channel'));
const Event = lazy(() => import('./Event'));

interface IF {}

type TabType = 'info' | 'rule' | 'scale' | 'node' | 'group' | 'channel' | 'event';

const Detail: React.FC<IF> = (props: IF) => {
  const { t } = useTranslation();

  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const reduxInfoData = useAppSelector(
    (state: ReducerType) => state.info.current
  );

  const handleClick = (param: TabType) => {
    if (param === 'group') {
      let nextPath;
      if (pathName.includes('create')) {
        nextPath = isTestPage ? TEST_SYSTEM_CREATE_GROUP : SYSTEM_CREATE_GROUP;
      } else {
        nextPath = isTestPage ? TEST_SYSTEM_UPDATE_GROUP : SYSTEM_UPDATE_GROUP;
        // nextPath = isTestPage ? TEST_SYSTEM_UPDATE : SYSTEM_UPDATE;
      }
      history.push(nextPath);
      return;
    }

    let nextPath;
    if (pathName.split('/')[2].includes('create')) {
      nextPath = isTestPage
        ? `${TEST_SYSTEM_CREATE}/${param}`
        : `${SYSTEM_CREATE}/${param}`;
    } else {
      nextPath = isTestPage
        ? `${TEST_SYSTEM_UPDATE}/${param}`
        : `${SYSTEM_UPDATE}/${param}`;
    }

    history.push(nextPath);
  };

  // system/createItem 일 때는 상단 버튼들을 숨긴다.

  return (
    <section className='flex flex-col mt-10'>
      <h1 className='flex flex-col mb-4 text-lg md:flex-row'>
        <span>
          <b>{t('list:systemId')}:</b> {reduxInfoData.id}
        </span>
        <span className='ml-0 md:ml-8'>
          <b>{t('list:name')}:</b> {reduxInfoData.name}
        </span>
      </h1>

      {/* 상위 메뉴 버튼들 */}
      <div
        className={
          location.pathname === SYSTEM_CREATE_INFO ||
          location.pathname === TEST_SYSTEM_CREATE_INFO
            ? 'invisible-and-take-no-space'
            : `flex w-full flex-col md:flex-row`
        }
      >
        <button
          className={
            pathName.includes('group') ||
            pathName === SYSTEM_UPDATE ||
            pathName === TEST_SYSTEM_UPDATE
              ? 'btn__ims--clicked'
              : 'btn__ims'
          }
          onClick={() => handleClick('group')}
        >
          {t('list:group')}
        </button>
        {/* <button
          className={
            pathName.includes('rule') ? 'btn__ims--clicked' : 'btn__ims'
          }
          onClick={() => handleClick('rule')}
        >
          {t('list:rule')}
        </button>
        <button
          className={
            pathName.includes('scale') ? 'btn__ims--clicked' : 'btn__ims'
          }
          onClick={() => handleClick('scale')}
        >
          {t('list:scale')}
        </button> */}
        <button
          className={ pathName.includes('node') ? 'btn__ims--clicked' : 'btn__ims' }
          onClick={() => handleClick('node')}
        >
          {t('list:node')}
        </button>

        <button
          className={ pathName.includes('channel') ? 'btn__ims--clicked' : 'btn__ims' }
          onClick={() => handleClick('channel')}
        >
          channel
        </button>

        <button
          className={
            pathName === SYSTEM_CREATE ||
            pathName === SYSTEM_UPDATE_INFO ||
            pathName === TEST_SYSTEM_CREATE ||
            pathName === TEST_SYSTEM_UPDATE_INFO
              ? 'btn__ims--clicked'
              : 'btn__ims'
          }
          onClick={() => handleClick('info')}
        >
          {t('list:info')}
        </button>

        <button
          className={ pathName.includes('event') ? 'btn__ims--clicked' : 'btn__ims' }
          onClick={() => handleClick('event')}
        >
          event
        </button>
      </div>

      {/* ! 여기에 하위 컴포넌트들 들어감 */}
      <Switch>
        <Route
          exact
          path={[
            SYSTEM_CREATE_INFO,
            SYSTEM_UPDATE_INFO, //
            TEST_SYSTEM_CREATE_INFO,
            TEST_SYSTEM_UPDATE_INFO,
          ]}
        >
          <Info />
        </Route>
        <Route
          path={[
            SYSTEM_CREATE_RULE,
            SYSTEM_UPDATE_RULE, //
            TEST_SYSTEM_CREATE_RULE,
            TEST_SYSTEM_UPDATE_RULE,
          ]}
        >
          {/* <Route path={[`${SYSTEM_CREATE_RULE}:scaleId`]} exact> */}
          <Rule />
        </Route>
        <Route
          path={[
            SYSTEM_CREATE_SCALE,
            SYSTEM_UPDATE_SCALE,
            //
            TEST_SYSTEM_CREATE_SCALE,
            TEST_SYSTEM_UPDATE_SCALE,
          ]}
        >
          <Scale />
        </Route>
        <Route
          path={[
            SYSTEM_CREATE_NODE,
            SYSTEM_UPDATE_NODE,
            //
            TEST_SYSTEM_CREATE_NODE,
            TEST_SYSTEM_UPDATE_NODE,
          ]}
        >
          <Node />
        </Route>
        {/* <Route path={[SYSTEM_CREATE_GROUP, SYSTEM_UPDATE_GROUP]}> */}
        {/* <Route exact path={[SYSTEM_CREATE, SYSTEM_UPDATE]}> */}
        <Route
          exact
          path={[
            SYSTEM_UPDATE,
            SYSTEM_UPDATE_GROUP,
            SYSTEM_CREATE_GROUP, //
            TEST_SYSTEM_UPDATE,
            TEST_SYSTEM_CREATE_GROUP,
            TEST_SYSTEM_UPDATE_GROUP,
          ]}
        >
          {/* <Route exact path={[`${SYSTEM_UPDATE}/:venueId`, SYSTEM_CREATE_GROUP]}> */}
          <Group />
        </Route>
        <Route
          exact
          path={[
            SYSTEM_CREATE_CHANNEL,
            SYSTEM_UPDATE_CHANNEL,
            //
            // TEST_SYSTEM_CREATE_NODE,
            // TEST_SYSTEM_UPDATE_NODE,
          ]}
        >
          <Channel />
        </Route>

        <Route
          path={[
            SYSTEM_CREATE_EVENT,
            SYSTEM_UPDATE_EVENT,            
          ]}
        >
          <Event />
        </Route>
      </Switch>
    </section>
  );
};
export default Detail;
