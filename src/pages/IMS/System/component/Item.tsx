import React, { useState, lazy, memo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IS_IMS_TEST,
  SYSTEM_UPDATE,
  SYSTEM_UPDATE_GROUP,
  SYSTEM_UPDATE_INFO,
  TEST_SYSTEM_UPDATE,
  TEST_SYSTEM_UPDATE_GROUP,
  TEST_SYSTEM_UPDATE_INFO,
} from 'sets/constants';

import { ValueType, ItemType } from '@/types/IMS/system/info/index';

import { useSystemDetailRequest } from '@/apis/IMS/system/detail/index';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';

import {
  setCurrent,
  setList as setReduxList,
} from '@/redux/IMS/system/infoSlices';

const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
import Button, { ButtonEdit } from 'comp/Button/Button';

interface ItemProps {
  data: ItemType;
  list: ValueType[];
  setList: (data) => void;
}

export const Item: React.FC<ItemProps> = memo(
  ({ data, list, setList }: ItemProps) => {
    const history = useHistory();
    const location = useLocation();
    const pathName = location.pathname;
    const isTestPage = pathName.includes(IS_IMS_TEST);

    const { t } = useTranslation();

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const dispatch = useAppDispatch();
    const reduxListData = useAppSelector(
      (state: ReducerType) => state.info.list
    );

    const {
      getData,
      deleteData,
      updateData,
      isLoading,
    } = useSystemDetailRequest();

    // 클릭 이벤트(아이템 수정 이벤트와 같다)
    const handelClickItem = async () => {
      dispatch(setCurrent(data));
      // 페이지 이동
      history.push({
        // pathname: isTestPage ? TEST_SYSTEM_UPDATE : SYSTEM_UPDATE,
        pathname: isTestPage ? TEST_SYSTEM_UPDATE_GROUP : SYSTEM_UPDATE_GROUP,
      });
    };

    // 아이템 수정 이벤트
    const handelEditItem = (e) => {
      e.stopPropagation();

      // info edit 페이지로 이동
      history.push(isTestPage ? TEST_SYSTEM_UPDATE_INFO : SYSTEM_UPDATE_INFO);
    };

    // 삭제
    const handelDeleteItem = async () => {
      // 모달 닫기
      closeModal();
      // 삭제 요청
      const result = await deleteData(data.id, isTestPage);
      if (!result) return;
      // 리스트 업데이트
      const updatedList = reduxListData.filter((item) => item.id !== data.id);
      setList(updatedList);
      dispatch(setReduxList(updatedList));
    };

    const handelDeleteClick = (e) => {
      e.stopPropagation();
      openModal();
    };

    // 삭제 모달을 여닫는 메소드들
    const closeModal = () => setIsModalOpen(false);
    const openModal = () => setIsModalOpen(true);

    /////////////////////////////////////////////
    return (
      <>
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
        </>

        <tr
          id={data.id}
          data-solution-id={data.id}
          className='intro-x cursor-pointer'
        >
          {/* id */}
          <td>
            <div className='list__item__text' id={data.id}>
              {data.id}
            </div>
          </td>

          <td>
            {/* name */}
            <div
              className='list__item__text underline'
              id={data.name}
              onClick={handelClickItem}
            >
              {data.name}
            </div>
          </td>

          {/* fps */}
          <td>
            <div className='cms__item__desc__wrapper'>
              <span className='cms__item__desc__text'>{data.fps}</span>
            </div>
          </td>
          {/* width */}
          <td>
            <div className='cms__item__desc__wrapper'>
              <span className='cms__item__desc__text'>{data.width}</span>
            </div>
          </td>
          {/* height */}
          <td>
            <div className='cms__item__desc__wrapper'>
              <span className='cms__item__desc__text'>{data.height}</span>
            </div>
          </td>
          {/* is extra */}
          <td>
            <div className='cms__item__desc__wrapper'>
              <span className='cms__item__desc__text'>{data.is_extra}</span>
            </div>
          </td>

          <td>
            <div className='list__item__text'>
              {data.updated_at?.split('T')[0]}
            </div>
          </td>

          <td>
            <div className='list__item__text'>
              {data.registered_at?.split('T')[0]}
            </div>
          </td>

          <td className='table-report__action w-56'>
            <div className='flex justify-center items-center'>
              <ButtonEdit onClick={(e) => handelEditItem(e)} />
              {/* <ButtonDelete onClick={(e) => handelDeleteClick(e)} /> */}
            </div>
          </td>
        </tr>
      </>
    );
  }
);

export default Item;
