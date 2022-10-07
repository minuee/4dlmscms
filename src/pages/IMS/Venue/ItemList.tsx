import React, { useState, useEffect, useCallback, lazy, memo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IMS_PAGES_PER_BLOCK,
  IMS_PAGING_COUNT,
  IS_IMS_TEST,
  PAGING_STRING,
  TEST_VENUE,
  TEST_VENUE_CREATE,
  VENUE,
  VENUE_CREATE,
} from 'sets/constants';

import { useVenueListRequest } from '@/apis/IMS/venue/list/index';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import {
  setList as setReduxList,
  resetList,
} from '@/redux/IMS/venue/venueSlices';
import { ValueType,  } from '@/types/IMS/venue/index';

import Item from './component/Item';
import Button, { ButtonAdd } from 'comp/Button/Button';
const Pagination = lazy(() => import('@/components/Pagination/Pagination'));

interface ItemListProps {}

const compName = 'Venue';

const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
const ImportExcel = lazy(() => import('./ImportExcel'));

export const ItemList: React.FC<ItemListProps> = memo(({}) => {

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const dispatch = useAppDispatch();

  const { getList, isLoading } = useVenueListRequest();
  const reduxListData = useAppSelector(
    (state: ReducerType) => state.venue.list
  );
  const [list, setList] = useState<ValueType[]>([]);

  const [pagingInfo, setPagingInfo] = useState({
    pagingCount: IMS_PAGING_COUNT, // 몇 개씩 가져올지 결정
    totalCount: 0,
    totalPage: 0,
    currentPage: 1,
    currentCount: 0,
  });

  const handleClickModalState = useCallback((e:React.MouseEvent<HTMLButtonElement>, isOpen: boolean) => {
    e.preventDefault();
    setIsModalOpen(isOpen);
  },[isModalOpen]);  

  // ********************
  // paging
  // ********************
  // 페이징 처리
  const getListData = async (isRequireReset: boolean, page: number) => {
    // redux 데이터를 필요 시 초기화 해준다.
    if (isRequireReset) dispatch(resetList());
    const result = await getList(
      isTestPage,
      page,
      pagingInfo.pagingCount,
      undefined
    );
    if (!result || !result.list) return;

    // 받아온 결과를 화면에 보여주는 메서드
    setDataList(result, isRequireReset, page);
  };

  // 받아온 결과를 화면에 보여주는 메서드
  const setDataList = (result, isRequireReset: boolean, page) => {
    setList(result.list);
    dispatch(setReduxList(result.list));

    // paging 처리
    setPagingInfo((prev) => ({
      ...prev,
      totalCount: result.totalCount,
      totalPage: Math.ceil(result.totalCount / prev.pagingCount),
      currentPage: page ? page : prev.currentPage + 1,
      // 이제 서버에서 받은 데이터로 페이징하니까 아래 필요없는 듯
      currentCount: prev.currentCount + pagingInfo.pagingCount,
    }));
  };

  // test -> poc, poc -> test 클릭 시
  useEffect(() => {
    // 페이지 첫 진입 시
    if (!location.search) {
      getListData(true, 1);
      return;
    }

    const newPageNum = location.search.split(PAGING_STRING)[1];
    getListData(true, Number(newPageNum));

    // getListData(true);
  }, [location.search]);
  // }, [isTestPage, location.search]);

  // 페이지 바꿈 처리
  const handleChangePage = (page: number) => {
    // url 처리
    history.push(
      isTestPage ? `${TEST_VENUE}?page=${page}` : `${VENUE}?page=${page}`
    );
    getListData(true, page);
  };

  const handleClickModalClose = (isReload: boolean) => {
    //console.log('2222');
    setIsModalOpen(false); 
    if(isReload) {
      getListData(true, 1);   
      //console.log('33333');
    }
  }

  // 아이템 추가
  const handleAddEvent = () => {
    history.push(isTestPage ? TEST_VENUE_CREATE : VENUE_CREATE);
  };

  //////////////////////////////////////////////////
  return (
    <>
      <>
        <Backdrop isShow={isModalOpen} />
        <Modal
          isShow={isModalOpen}
          title={'Import Excel File'}
          content={
            <div className='flex flex-col'> 
              <ImportExcel handleClose={handleClickModalClose} isOpen={isModalOpen} />
            </div>
          }
          type='info' 
          closeBtn={false}         
        >
          <Button color='btn-secondary' onClick={(e) => handleClickModalState(e, false)}>
            {t('user:close')}
          </Button>
        </Modal>
      </>
      <section>
        <div className='list__header'>
          <h2 className='list__header__text'>{`${compName} ${t(
            'list:list'
          )}`}</h2>
        </div>
        <div className='list__body__wrapper'>
          <div className='list__body__wrapper__top'>
            <div className='flex items-center'>
              <Button color={'btn-primary'} onClick={handleAddEvent}>
                {t('list:addNewVenue')}
              </Button>
              <ButtonAdd onClick={handleAddEvent} />
            </div>
            <div className='mt-3 sm:mt-0 sm:ml-auto'>
              <Button color={'btn-primary'} onClick={(e) => handleClickModalState(e, true)}>
                {t('system:importExcel')}
              </Button>              
            </div>
          </div>

          <div className='table_wrapper--scroll'>
            <table className='table -mt-2 table-report'>
              {list?.length !== 0 && (
                <thead>
                  <tr>
                    <th className='th--basic'>{t('list:id')}</th>
                    <th className='th--basic'>{t('list:name')}</th>
                    <th className='th--basic'>{t('list:eventCode')}</th>
                    <th className='th--basic'>{t('list:description')}</th>
                    <th className='th--basic'>{t('list:updatedAt')}</th>
                    <th className='th--basic'>{t('list:registeredAt')}</th>
                  </tr>
                </thead>
              )}

              <tbody>
                {list?.length === 0 ? (
                  <tr>
                    <td>
                      <span>{t('list:noData')}</span>
                    </td>
                  </tr>
                ) : (
                  list?.map((item) => {
                    return (
                      <Item
                        key={item.id}
                        data={item}
                        list={list}
                        setList={setList}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {pagingInfo.totalPage > 1 && (
        <Pagination
          // key={location.search}
          totalPage={pagingInfo.totalPage}
          onClick={(page: number) => handleChangePage(page)}
          pagesPerBlock={IMS_PAGES_PER_BLOCK}
          currentPage={
            Number(location.search.split(PAGING_STRING)[1])
              ? Number(location.search.split(PAGING_STRING)[1])
              : 1
          }
        />
      )}
    </>
  );
});

export default ItemList;
