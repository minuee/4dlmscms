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

    // ????????? ?????? ??????(????????? ????????? ???)
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

    // ?????? ?????????(????????? ?????? ???????????? ??????)
    const handleClickItem = async () => {
      // ?????? ???????????? ????????? ?????? ????????? ????????? ??? ???????????? ????????????.
      const result = await getData(data.content_id, data._id);
      if (!result) return;

      // ????????? ???????????? ?????????.
      // context update
      updateStep(5);
      changeIsUpdate(true);

      // updated redux
      dispatch(setChildCurrent(data));

      // ????????? ??????
      history.push({ pathname: CMS_CONTENT_LIST_UPDATE });
    };

    // ????????? ?????? ?????????
    const handelEditItem = (e) => {
      // e.stopPropagation();
      // ? ?????? ??????, ?????? ????????? ????????? ?????? ???????????? ?????? ????????? ????????????, ??????????????? ?????? ???
      handleClickItem();
    };

    // ??????
    const handleDeleteItem = async () => {
      // ?????? ??????
      closeModal();
      setIsLoading(true);

      const result = await deleteData(
        data.content_id,
        data._id,
        data.league_id
      );

      setIsLoading(false);
      // ?????? ?????? ?????? ????????? ????????? ????????????
      if (!result) return;

      // const updatedList = cmsData.child_content_list.filter(
      // updated redux
      const updatedList = cmsData.childList.filter(
        (item) => item._id !== data._id
      );
      // ????????? pair ??????
      const sortedList = sortList(updatedList);
      setList(sortedList);
      // setList(updatedList);

      // updated redux
      dispatch(setChildList(sortedList));
      // dispatch(setChildList(updatedList));
    };

    // ???????????? ????????? ??????.
    const handleDeleteClick = (e) => {
      e.stopPropagation();
      openModal();
    };

    // ?????? ????????? ????????? ????????????
    const closeModal = () => setIsModalOpen(false);
    const openModal = () => setIsModalOpen(true);

    // info modal??? ?????? ?????????
    const closeInfoModal = () => setIsOpenInfoModal(false);

    // info modal?????? ?????? ???????????? ?????????
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
              // ????????? ????????? ????????? ???????????? UI??? ????????????.
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

          {/* ???????????? ?????? ????????? ????????? ????????????. live.status -> service_status??? ?????? 04.21 */}
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
