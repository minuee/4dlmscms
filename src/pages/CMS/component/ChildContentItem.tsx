import React, { useState, useEffect, useContext, lazy, memo } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { excludeNe, getLocalDate } from '@/utils/commonFn';
import { useCMSListRequest } from '@/apis/CMS/list/index';

import {
  AUTO_UPLOAD_TAG_BY_RM,
  AUTO_UPLOAD_TAG_BY_FAIL_RM,
  AUTO_UPLOAD_TAG_BY_MAKING_IVOD,
  AUTO_UPLOAD_TAG_BY_MAKING_REPLAY,
  AUTO_UPLOAD_TAG_BY_NEEDING_REPLAY_FILE,
  AUTO_UPLOAD_TAG_BY_MC_R,
  CMS_CONTENT_LIST_UPDATE,
} from 'sets/constants';

import { useCMS } from '@/hooks/cms-hooks';
import { usePlayInfoHooks } from '@/hooks/CMS/usePlayInfo-hooks';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
// new redux data
import { setChildCurrent, setChildList } from '@/redux/CMS/contentSlices';
import { CMSContext } from 'cont/cms';

import Button, { ButtonEdit, ButtonDelete } from 'comp/Button/Button';
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));

const InfoInputs = lazy(() => import('comp/Modal/CmsInfoModal'));
const PageLoaderModal = lazy(() => import('comp/PageLoader/PageLoaderModal'));

interface ItemProps {
  data: TotalItemType;
  list?: TotalItemType[];
  setList: (data) => void;
  sortList: (data) => any[];
  idx?: number;
  withTr?: boolean;
}

const Item: React.FC<ItemProps> = memo(
  ({ data, list, setList, sortList, withTr }: ItemProps) => {
    const history = useHistory();
    const { t } = useTranslation();

    const { updateStep, changeIsUpdate } = useContext(CMSContext);
    const cmsData = useAppSelector((state: ReducerType) => state.content);
    const dispatch = useAppDispatch();

    const { getData, deleteData } = useCMSListRequest();

    const { updateCMSChildListReduxData } = useCMS();
    const {
      playInfoData,
      handleResetPlayInfoValues,
      handleSetPlayInfoValues,
      handleUpdatePlayInfoValues,
    } = usePlayInfoHooks();

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpenInfoModal, setIsOpenInfoModal] = useState<boolean>(false);

    // 라이브 인포 세팅(모달에 보여줄 값)
    useEffect(() => {
      // handleUpdatePlayInfoValues(data?.live?.info);
      handleUpdatePlayInfoValues(data?.live?.info, 'saved');
    }, []);

    const returnAutoUploadTag = (video_type_id: number) => {
      let elem;
      switch (video_type_id) {
        case AUTO_UPLOAD_TAG_BY_RM:
          elem = <span className='cms__auto-upload-tag'>auto by rm</span>;
          break;
        case AUTO_UPLOAD_TAG_BY_FAIL_RM:
          elem = <span className='cms__auto-upload-tag--fail'>failed by rm</span>;
          break;
        case AUTO_UPLOAD_TAG_BY_MAKING_REPLAY:
          elem = <span className='cms__auto-upload-tag--ing'>making replay</span>;
          break;
        case AUTO_UPLOAD_TAG_BY_MAKING_IVOD:
          elem = <span className='cms__auto-upload-tag--ing'>making ivod</span>;
          break;
        case AUTO_UPLOAD_TAG_BY_NEEDING_REPLAY_FILE:
          elem = <span className='cms__auto-upload-tag--warning'>upload replay file</span>;
          break;
        case AUTO_UPLOAD_TAG_BY_MC_R:
          elem = <span className='cms__auto-upload-tag'>auto by mc(r)</span>;
          break;
        default:
          break;
      }

      return elem;
    };

    // 클릭 이벤트(아이템 수정 이벤트와 같다)
    const handleClickItem = async () => {
      // 해당 이벤트와 관련한 모든 정보를 요청한 뒤 리덕스에 저장한다.
      const result = await getData(data.content_id, data._id);
      if (!result) return;

      // 결과를 리덕스에 담는다.
      // context update
      updateStep(5);
      changeIsUpdate(true);

      // updated redux
      dispatch(setChildCurrent(data));

      // 페이지 이동
      history.push({ pathname: CMS_CONTENT_LIST_UPDATE });
    };

    // 아이템 수정 이벤트
    const handelEditItem = (e) => {
      // e.stopPropagation();
      // ? 혹시 클릭, 수정 액션이 달라질 수도 있으므로 따로 메서드 만들어둠, 필요없으면 지울 것
      handleClickItem();
    };

    // 삭제
    const handleDeleteItem = async () => {
      // 모달 닫기
      closeModal();
      setIsLoading(true);

      const result = await deleteData(
        data.content_id,
        data._id,
        data.league_id
      );

      setIsLoading(false);
      // 서버 요청 성공 시에만 리덕스 업데이트
      if (!result) return;

      // const updatedList = cmsData.child_content_list.filter(
      // updated redux
      const updatedList = cmsData.childList.filter(
        (item) => item._id !== data._id
      );
      // 아이템 pair 정렬
      const sortedList = sortList(updatedList);
      setList(sortedList);
      // setList(updatedList);

      // updated redux
      dispatch(setChildList(sortedList));
      // dispatch(setChildList(updatedList));
    };

    // 삭제확인 모달을 연다.
    const handleDeleteClick = (e) => {
      e.stopPropagation();
      openModal();
    };

    // 삭제 모달을 여닫는 메소드들
    const closeModal = () => setIsModalOpen(false);
    const openModal = () => setIsModalOpen(true);

    // info modal을 닫는 메서드
    const closeInfoModal = () => setIsOpenInfoModal(false);

    // info modal에서 값을 받아오는 메서드
    const getInfoValueFromModal = (values) => {
      handleSetPlayInfoValues(values);

      closeInfoModal();
    };

    ////////////////////////////////////////////////////////////////
    const elem = <></>;

    /////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    return (
      <>
        <PageLoaderModal isOpen={isLoading} />
        <>
          <Backdrop onClick={closeModal} isShow={isModalOpen} />
          <Modal
            isShow={isModalOpen}
            title={t('list:delete')}
            content={t('list:checkDelete')}
            type='danger'
            closeBtn
            onClose={closeModal}
          >
            <Button color='btn-danger' onClick={handleDeleteItem}>
              {t('list:delete')}
            </Button>
          </Modal>
        </>

        {/* info modal */}
        {isOpenInfoModal && (
          <>
            <Backdrop isShow={isOpenInfoModal} />
            <InfoInputs
              isShow={isOpenInfoModal}
              type='live'
              content_id={data.content_id.toString()}
              _id={data._id}
              league_id={data.league_id.toString()}
              // idx={data.idx}
              data={playInfoData} //0916
              onClose={closeInfoModal}
              onCloseAndGetValue={(values) => getInfoValueFromModal(values)}
            />
          </>
        )}
        {/* item */}
        {/* tr */}

        <tr
          id={data._id}
          data-content-id={data.content_id}
          onClick={handleClickItem}
        >
          <td>
            <div className='list__item__text' id={data._id}>
              {data.content_id}
            </div>
            <div className='text-gray-600 text-xs whitespace-nowrap mt-0.5'></div>
          </td>

          <td>
          <div className='list__item__text'>
            {data.package_id}
          </div>
        </td>

          <td>
            {excludeNe(data.photo.thumb.small_url) ||
            excludeNe(data.photo.thumb.middle_url) ||
            excludeNe(data.photo.thumb.large_url) ? (
              <img
                className='object-cover w-24 h-16'
                src={
                  excludeNe(data.photo.thumb.small_url)
                    ? data.photo.thumb.small_url
                    : excludeNe(data.photo.thumb.middle_url)
                    ? data.photo.thumb.middle_url
                    : excludeNe(data.photo.thumb.large_url)
                    ? data.photo.thumb.large_url
                    : null
                }
                alt='thumb'
                crossOrigin='anonymous'
              />
            ) : (
              // 썸네일 이미지 없으면 스켈레톤 UI를 보여준다.
              <div className='thumb__skeleton'></div>
            )}
          </td>

          {/*  */}
          <td>
            <div className='text-lg font-bold whitespace-nowrap'>
              {excludeNe(data.name['en-US'])}
            </div>
            <br />
            <div className='cms__item__desc__wrapper'>
              <span className='cms__item__desc__text'>
                {excludeNe(data.desc['en-US'])}
              </span>
            </div>
          </td>

          {/* 라이브일 경우 라이브 표시를 보여준다. live.status -> service_status로 변경 04.21 */}
          <td className='w-5'>
            {data.service_status === 1 &&
              <div className='badge-live'>{t('list:live')}</div>
            }
            {/* {data.live.status === 1 && (
              <div className='badge-live'>{t('list:live')}</div>
            )} */}
          </td>

          {/*  */}
          <td className=''>{returnAutoUploadTag(data.video_type_id)}</td>

          <td>
            <div className='list__item__text'>
              {getLocalDate(data.live.start_time)?.split('T')[0]}
            </div>
          </td>
          <td className='list__item__text'>
            {getLocalDate(data.live.end_time)?.split('T')[0]}
          </td>

          <td className=''>
            <Button
              color='btn-primary'
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenInfoModal(true);
              }}
            >
              {t('list:editPlayBoardInfo')}
            </Button>
          </td>

          <td className=''>
            <ButtonEdit onClick={(e) => handelEditItem(e)} />
            <ButtonDelete onClick={(e) => handleDeleteClick(e)} />
          </td>
        </tr>
      </>
    );
  }
);

export default Item;
