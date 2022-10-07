import React, { useState, useEffect, lazy, memo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IMS_PAGES_PER_BLOCK,
  IMS_PAGING_COUNT,
  IS_IMS_TEST,
  PAGING_STRING,
  SYSTEM,
  SYSTEM_CREATE_INFO,
  TEST_SYSTEM,
  TEST_SYSTEM_CREATE_INFO,
} from 'sets/constants';

import { useSystemListRequest } from '@/apis/IMS/system/list/index';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';

import {
  setList as setReduxList,
  resetList,
} from '@/redux/IMS/system/infoSlices';
import { ItemType } from '@/types/IMS/system/info/index';

import Item from './component/Item';
const Button = lazy(() => import('comp/Button/Button'));
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
import { ButtonAdd } from 'comp/Button/Button';
import Pagination from '@/components/Pagination/Pagination';

interface ItemListProps {}

interface LocationStateType {
  venue_id: string;
}

export const ItemList: React.FC<ItemListProps> = memo(({}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const history = useHistory();
  const location = useLocation<LocationStateType>();
  const pathName = location.pathname;
  const compName =
    pathName.split('/')[1][0].toUpperCase() + pathName.split('/')[1].slice(1);

  const isTestPage = pathName.includes(IS_IMS_TEST);

  const venueData = useAppSelector((state: ReducerType) => state.venue.current);
  // console.log(location.state.venue_id); // 왜 6번 찍히지?

  // ! 베뉴아이디
  const venue_id = location.state?.venue_id
    ? location.state.venue_id
    : venueData.id;

  const { getList, isLoading } = useSystemListRequest();
  const reduxListData = useAppSelector((state: ReducerType) => state.info.list);
  const [list, setList] = useState<ItemType[]>([]);
  const [pagingInfo, setPagingInfo] = useState({
    pagingCount: IMS_PAGING_COUNT, // 몇 개씩 가져올지 결정
    totalCount: 0,
    totalPage: 0,
    currentPage: 1,
    currentCount: 0,
  });

  // ********************
  // paging
  // ********************
  const getListData = async (page: number) => {
    const result = await getList(
      isTestPage,
      page,
      pagingInfo.pagingCount,
      undefined,
      venue_id
    );
    if (!result || !result.list) return;
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

  // 페이지 바꿈 처리
  const handleChangePage = (page: number) => {
    // url 처리
    history.push(
      isTestPage ? `${TEST_SYSTEM}?page=${page}` : `${SYSTEM}?page=${page}`
    );
    getListData(page);
  };

  // 리스트를 받아온다.
  useEffect(() => {
    // 맨 처음 화면에 진입할 때에는 리스트를 모두 지우고,
    // 페이지 첫 진입 시
    if (!location.search) {
      dispatch(resetList());
      getListData(1);
      return;
    }

    const newPageNum = location.search.split(PAGING_STRING)[1];
    getListData(Number(newPageNum));
  }, [location.search]);

  // 아이템 추가
  const handleAddEvent = () => {
    history.push({
      pathname: isTestPage ? TEST_SYSTEM_CREATE_INFO : SYSTEM_CREATE_INFO,
    });
  };

  ////////////////////////////////////////////////////
  return (
    <>
      <PageLoaderModal isOpen={isLoading} />
      <section>
        <div className='list__header'>
          <h2 className='list__header__text'>{`${compName} ${t(
            'list:list'
          )}`}</h2>
        </div>
        <div className='list__body__wrapper'>
          <div className='list__body__wrapper__top'>
            <Button color={'btn-primary'} onClick={handleAddEvent}>
              {t('list:addNewSystem')}
            </Button>
            <ButtonAdd onClick={handleAddEvent} />
          </div>

          <div className='table_wrapper--scroll'>
            <table className='table table-report -mt-2'>
              {list?.length !== 0 && (
                <thead>
                  <tr>
                    <th className='th--basic'>{t('list:id')}</th>
                    <th className='th--basic'>{t('list:name')}</th>
                    <th className='th--basic'>{t('list:fps')}</th>
                    <th className='th--basic'>{t('list:width')}</th>
                    <th className='th--basic'>{t('list:height')}</th>
                    <th className='th--basic'>{t('list:isExtra')}</th>
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
