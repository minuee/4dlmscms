import React, { useState, useEffect, lazy } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';

import { excludeNe } from '@/utils/commonFn';

const Button = lazy(() => import('comp/Button/Button'));
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
import Select, { Option } from 'comp/Input/Select';
import { ButtonEdit, ButtonDelete } from 'comp/Button/Button';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
import { ReactComponent as Loader } from 'imgs/loader/oval.svg';

interface ItemProps {}

// TODO: type들도 받아야 하고
// 중간에 이미지 같은 애들이 들어오면 어떻게 처리할지도 생각해봐야 함

export const Item = ({
  data,
  list,
  setList,
  onClick,
  onEdit,
  onDelete,
  name,
}) => {
  const history = useHistory();
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const handleClickItem = async () => {
    // dispatch(addCategory({ ...categoryData, current: data }));
    // 페이지 이동
    // history.push({ pathname: `${QUIZ}/${data._id}/${QUIZ_PARTICIPANT_RAW}` });
  };

  // 아이템 수정 이벤트
  const handleEditItem = (e) => {
    e.stopPropagation();
    // 아이템 수정 페이지로 이동한다.
    // history.push({ pathname: QUIZ_UPDATE });
  };

  // 삭제
  const handleDeleteItem = async () => {
    // 모달 닫기
    closeModal();

    return;
    // ? api 아직 안 나옴
    // deleteCategoryData(data.content_id, data._id, data.league_id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    // console.log(data.content_id);
    openModal();
  };

  // 삭제 모달을 여닫는 메소드들
  const closeModal = () => setIsModalOpen(false);
  const openModal = () => setIsModalOpen(true);

  return (
    <>
      <>
        <Backdrop isShow={isModalOpen} onClick={closeModal} />
        <Modal
          isShow={isModalOpen}
          title={t('delete')}
          content={t('checkDelete')}
          type='danger'
          closeBtn
          onClose={closeModal}
        >
          <Button color='btn-danger' onClick={handleDeleteItem}>
            {t('delete')}
          </Button>
        </Modal>
      </>

      <tr className='intro-x cursor-pointer' onClick={handleClickItem}>
        {Object.keys(data).map((item) => {
          return (
            <td key={data.id}>
              <div className='font-medium whitespace-nowrap'>{data[item]}</div>
            </td>
          );
        })}

        <td className='table-report__action w-56'>
          <div className='flex justify-center items-center'>
            <ButtonEdit onClick={(e) => handleEditItem(e)} />
            <ButtonDelete onClick={(e) => handleDeleteClick(e)} />
          </div>
        </td>
      </tr>
    </>
  );
};
