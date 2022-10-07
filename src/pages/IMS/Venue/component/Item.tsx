import React, { useState, lazy, Dispatch, SetStateAction, memo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IS_IMS_TEST,
  SYSTEM,
  TEST_SYSTEM,
  TEST_VENUE_UPDATE,
  VENUE_UPDATE,
} from 'sets/constants';

import { useVenueDetailRequest } from '@/apis/IMS/venue/detail/index';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { ItemType } from '@/types/IMS/venue/index';

import {
  setCurrent,
  setList as setReduxList,
} from '@/redux/IMS/venue/venueSlices';

import { excludeNe } from '@/utils/commonFn';

import Button, { ButtonEdit } from 'comp/Button/Button';
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
interface ItemProps {
  data: ItemType;
  list: ItemType[];
  setList: Dispatch<SetStateAction<ItemType[]>>;
}

function Item(props: ItemProps) {
  const { data, list, setList } = props;

  const { t } = useTranslation();
  const { deleteData, isLoading } = useVenueDetailRequest();

  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const reduxListData = useAppSelector(
    (state: ReducerType) => state.venue.list
  );

  // 클릭 이벤트(아이템 수정 이벤트와 같다)
  const handelClickItem = async () => {
    dispatch(setCurrent(data));
    // 페이지 이동 -> 시스템 페이지로
    history.push({
      pathname: isTestPage ? TEST_SYSTEM : SYSTEM,
      state: {
        venue_id: data.id,
      },
    });
  };

  // 아이템 수정 이벤트
  const handelEditItem = (e) => {
    e.stopPropagation();
    dispatch(setCurrent(data));
    history.push({ pathname: isTestPage ? TEST_VENUE_UPDATE : VENUE_UPDATE });
  };

  // 삭제 요청 날리는 메서드
  const handelDeleteItem = async () => {
    // 모달 닫기
    closeModal();
    // 삭제 요청
    const result = await deleteData(data.id, isTestPage);
    if (!result) return;
    const updatedList = reduxListData.filter((item) => item.id !== data.id);
    setList(updatedList);
    dispatch(setReduxList(updatedList));
  };

  // 삭제버튼 클릭 메서드
  const handelDeleteClick = (e) => {
    e.stopPropagation();
    openModal();
  };

  // 삭제 모달을 여닫는 메소드들
  const closeModal = () => setIsModalOpen(false);
  const openModal = () => setIsModalOpen(true);

  return (
    <>      
      <Backdrop isShow={isModalOpen} onClick={closeModal} />
      <Modal
        isShow={isModalOpen}
        title={t('list:delete')}
        content={t('list:checkDelete')}
        type='danger'
        closeBtn
        onClose={closeModal}
      >
        <Button color='btn-danger' onClick={handelDeleteItem}>
          {t('list:delete')}
        </Button>
      </Modal>      

      <tr id={data.id} className='intro-x cursor-pointer'>
        {/* id */}
        <td>
          <div className='list__item__text'>{data.id}</div>
        </td>

        <td>
          {/* name */}
          <div id={data.id} className='list__item__text underline' onClick={handelClickItem}>
            {data.name}
          </div>
        </td>

        {/* event code */}
        <td>
          <div className='list__item__text'>{data.event_code}</div>
        </td>

        {/* desc */}
        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>
              {excludeNe(data.description)}
            </span>
          </div>
        </td>

        <td>
          <div className='list__item__text'>
            {data.updated_at?.split('T')[0]}
          </div>
        </td>

        <td>
          <div className='list__item__text'>
            {data.registered_at.split('T')[0]}
          </div>
        </td>

        <td className='table-report__action w-56'>
          <div className='flex justify-center items-center'>
            <ButtonEdit onClick={(e) => handelEditItem(e)} />
          </div>
        </td>
      </tr>
    </>
  );
};

export default memo(Item);
