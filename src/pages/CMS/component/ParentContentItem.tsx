import React, { useState, lazy } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useCMSListRequest } from '@/apis/CMS/list/index';

import { CMS_CONTENT_LIST } from 'sets/constants';

import { useAppDispatch } from '@/redux/hooks';
import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';

// new redux data
import {
  setParentCurrent,
  resetChildList,
  resetChildCurrent,
  setParentList,
} from '@/redux/CMS/contentSlices';

import { excludeNe, getLocalDate } from '@/utils/commonFn';

const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
import Button, { ButtonEdit, ButtonDelete } from 'comp/Button/Button';

interface ItemProps {
  data: TotalItemType;
  list?: TotalItemType[];
  setList: (data) => void;
}

const Item: React.FC<ItemProps> = ({ data, list, setList }: ItemProps) => {

  const history = useHistory();
  const { t, i18n } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const { deleteData } = useCMSListRequest();
  const user = useAppSelector(
    (state: ReducerType): User => state.users.authUser
  );

  const handelClickItem = async () => {
    dispatch(setParentCurrent(data));
    dispatch(resetChildList());
    dispatch(resetChildCurrent());

    history.push({ pathname: CMS_CONTENT_LIST });
  };

  // 아이템 수정 이벤트
  const handelEditItem = (e) => {
    // ? 혹시 클릭, 수정 액션이 달라질 수도 있으므로 따로 메서드 만들어둠, 필요없으면 지울 것
    handelClickItem();
  };

  // 삭제
  const handelRequestDelete = async () => {
    closeModal();
    const result = await deleteData(data.content_id, data._id, data.league_id);
    if (!result) return;

    const updatedList = list.filter((item) => item._id !== data._id);
    setList(updatedList);

    dispatch(setParentList(updatedList));
  };

  const handelDeleteClick = (e) => {
    e.stopPropagation();
    openModal();
  };

  const closeModal = () => setIsModalOpen(false);
  const openModal = () => setIsModalOpen(true);

  return (
    <>
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
          <Button color='btn-danger' onClick={handelRequestDelete}>
            {t('list:delete')}
          </Button>
        </Modal>
      </>

      <tr
        id={data._id}
        data-content-id={data.content_id}
        className='cursor-pointer intro-x'
        onClick={handelClickItem}
      >
        <td>
          <div className='list__item__text' id={data._id}>
            {data.content_id}
          </div>
        </td>
        <td>
          <div className='list__item__text'>
            {data.package_id}
          </div>
        </td>
        <td>
          {excludeNe(data?.photo.thumb.small_url) ||
          excludeNe(data?.photo.thumb.middle_url) ||
          excludeNe(data?.photo.thumb.large_url) ? (
            <img
              className='object-cover w-24 h-16'
              src={
                excludeNe(data?.photo.thumb.small_url)
                  ? data?.photo.thumb.small_url
                  : excludeNe(data?.photo.thumb.middle_url)
                  ? data?.photo.thumb.middle_url
                  : excludeNe(data?.photo.thumb.large_url)
                  ? data?.photo.thumb.large_url
                  : null
              }
              alt='thumbnail'
              crossOrigin='anonymous'
            />
          ) : (
            // 썸네일 이미지 없으면 스켈레톤 UI를 보여준다.
            <div className='thumb__skeleton'></div>
          )}
        </td>
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
        {/* 라이브일 경우 라이브 표시를 보여준다. */}
        <td className='w-5'>
          {data.live.status === 1 && (
            <div className='badge-live'>{t('list:live')}</div>
          )}
        </td>
        <td>
          <div className='list__item__text'>
            {getLocalDate(data.live.start_time)?.split('T')[0]}
          </div>
        </td>
        {/* end time */}
        <td className='list__item__text'>
          {getLocalDate(data.live.end_time)?.split('T')[0]}
        </td>
        {
          user.state === 1 &&
          <td className='w-56 table-report__action'>
            <div className='flex items-center justify-center'>
              <ButtonEdit onClick={(e) => handelEditItem(e)} />
              <ButtonDelete onClick={(e) => handelDeleteClick(e)} />
            </div>
          </td>
        }
      </tr>
    </>
  );
};

export default Item;
