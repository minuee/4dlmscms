import React, { useState, useEffect, lazy, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IMS_PAGES_PER_BLOCK,
  IMS_PAGING_COUNT,
  IS_IMS_TEST,
  PAGING_STRING,
  SYSTEM_CREATE_GROUP,
  SYSTEM_UPDATE_GROUP,
  TEST_SYSTEM_CREATE_GROUP,
  TEST_SYSTEM_UPDATE_GROUP,
} from 'sets/constants';

import { useGroupListRequest } from '@/apis/IMS/system/detail/group/list';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { setList as setReduxList } from '@/redux/IMS/system/groupSlices';

import {
  ItemType,
  ClickedItemValueType,
  ClickedItemType,
} from '@/types/IMS/system/group/index';
import { showNotification } from '@/utils/commonFn';

import Item from '../../component/GroupItem';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
import Button, { ButtonAdd } from 'comp/Button/Button';
const Slider = lazy(() => import('@/containers/Drawer/ChannelListDrawer'));
const Pagination = lazy(() => import('@/components/Pagination/Pagination'));

interface ItemListProps {}

const compName = 'Group';

export const ItemList: React.FC<ItemListProps> = ({}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  // const groupData = useAppSelector((state: ReducerType) => state.group.current);

  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const {
    getList,
    requestNotification,
    requestExcelImport,
    isLoading,
  } = useGroupListRequest();

  const systemData = useAppSelector((state: ReducerType) => state.info.current);
  const wrapperRef = useRef<HTMLElement>(null);

  const [list, setList] = useState<ItemType[]>([]);
  const [pagingInfo, setPagingInfo] = useState({
    pagingCount: IMS_PAGING_COUNT, // 몇 개씩 가져올지 결정
    totalCount: 0,
    totalPage: 0,
    currentPage: 1,
    currentCount: 0,
  });

  const [clickedItem, setClickedItem] = useState<ClickedItemType>({
    isOpen: false,
    clickedIdx: 0,
    currentValue: {} as ClickedItemValueType,
  });

  // ********************
  // paging
  // ********************
  const getListData = async (page: number) => {
    const result = await getList(
      isTestPage,
      systemData.id,
      page,
      pagingInfo.pagingCount,
      undefined
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

  // 리스트를 받아온다.
  useEffect(() => {
    // 페이지 첫 진입 시
    if (!location.search) {
      getListData(1);
      return;
    }

    const newPageNum = location.search.split(PAGING_STRING)[1];
    getListData(Number(newPageNum));
  }, [location.search]);

  // 페이지 바꿈 처리
  const handleChangePage = (page: number) => {
    // url 처리
    let nextPath;
    if (pathName.includes('create')) {
      nextPath = isTestPage
        ? `${TEST_SYSTEM_CREATE_GROUP}?page=${page}`
        : `${SYSTEM_CREATE_GROUP}?page=${page}`;
    } else {
      nextPath = isTestPage
        ? `${TEST_SYSTEM_UPDATE_GROUP}?page=${page}`
        : `${SYSTEM_UPDATE_GROUP}?page=${page}`;
      // nextPath = isTestPage ? TEST_SYSTEM_UPDATE : SYSTEM_UPDATE;
    }
    history.push(nextPath);
    getListData(page);
  };

  // 아이템 추가
  const handleAddEvent = () => {
    showNotification('service not ready', 'info');
    // 리덕스에 있는 데이터 초기화
    // history.push(
    //   pathName.includes('create')
    //     ? SYSTEM_CREATE_RULE_CREATE
    //     : SYSTEM_UPDATE_RULE_CREATE
    // );
  };

  const toggleSlider = (state: boolean) => {
    setClickedItem((prev) => ({ ...prev, isOpen: state }));
  };

  const handleClick = (clickedIdx: number, data: ClickedItemValueType) => {
    // console.log({ data });

    // 슬라이더를 열고 정보를 set한다.
    setClickedItem((prev) => ({
      isOpen: true,
      clickedIdx,
      currentValue: data,
    }));

    // 위로 스크롤 업
    wrapperRef.current &&
      wrapperRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 그룹 노티피케이션,
  // 그룹 / 채널 정보가 변경 되었을 시 연관된 시스템에 그룹/채널 정보를 전파한다.
  const handleNotify = async () => {
    const result = await requestNotification(systemData.id, isTestPage);
    // if (!result) return;
  };

  // 엑셀 업로드 기능(import)
  const handleExcelImport = async (e) => {
    const file = e.target.files?.item(0);
    const fileType = file.name.split('.').pop();

    if (fileType.toLowerCase() !== 'xlsx') {
      showNotification('pleaseUploadeOnlyXlsxFile', 'error');
      return;
    }
    const result = await requestExcelImport(systemData.id, file, isTestPage);
    if (!result || !result.list) return;

    // 리턴 받은 값으로 화면을 변경해준다.
    setList(result.list);
  };

  ///////////////////////////////////////////////////////////
  return (
    <>
      <section ref={wrapperRef}>
        <PageLoaderModal isOpen={isLoading} />

        <div className='list__header'>
          <h2 className='sr-only'>
            {compName} {t('list:list')}
          </h2>
        </div>
        <div className='list__body__wrapper'>
          <div className='list__body__wrapper__top'>
            <div className='flex items-center'>
              <Button color={'btn-primary'} onClick={handleAddEvent}>
                {t('list:addNewGroup')}
              </Button>
              <ButtonAdd onClick={handleAddEvent} />
            </div>

            <div className='mt-3 sm:mt-0 sm:ml-auto'>
              {/* import */}
              <label htmlFor='excelFile' className='btn btn-primary'>
                {t('system:importExcel')}
              </label>
              <input
                className='sr-only'
                type='file'
                name='excelFile'
                id='excelFile'
                onChange={(e) => {
                  handleExcelImport(e);
                  (e.target as HTMLInputElement).value = null;
                }}
              />
              {/* export */}
              {/* <label
                htmlFor='excelFileExport'
                className='ml-3 btn btn-primary'
                onClick={() => {
                  showNotification('service not ready', 'info');
                }}
              >
                Excel export
              </label> */}
              {/* <input
                className='sr-only'
                type='file'
                name='excelFileExport'
                id='excelFileExport'
                onClick={() => {
                  showNotification('service not ready', 'info');
                  return;
                }}
                onChange={(e) => {
                  null;
                  // showNotification('service not ready', 'info');
                  // handleExcelImport(e);
                  // (e.target as HTMLInputElement).value = null;
                }}
              /> */}

              {/* <button className='ml-3 btn btn-primary' onClick={handleNotify}>
                {t('list:notify')}
              </button> */}
            </div>
          </div>
          <div className='table_wrapper--scroll'>
            <table className='table -mt-2 table-report'>
              {list?.length !== 0 && (
                <thead>
                  <tr>
                    <th className='th__padding-small th--basic--uppercase'>
                      {t('list:id')}
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      {t('list:group')}
                      <br />
                      {t('list:index')}
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      {t('list:name')}
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      {/* view type */}
                      view
                      <br />
                      type
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      {t('list:desc')}
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      {t('list:type')}
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      is
                      <br />
                      external
                      <br />
                      group
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      default
                      <br />
                      channel
                      <br />
                      index
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      default
                      <br />
                      audio
                      <br />
                      index
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      is
                      <br />
                      default
                      <br />
                      group
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      is
                      <br />
                      inter-
                      <br />
                      active
                    </th>
                    <th className='th__padding-small th--basic--uppercase '>
                      is
                      <br />
                      replay
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      is
                      <br />
                      time
                      <br />
                      machine
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      is
                      <br />
                      pdview
                    </th>

                    <th className='th__padding-small th--basic--uppercase '>
                      UPDATED
                      <br />
                      AT
                    </th>
                    <th className='th__padding-small th--basic--uppercase '>
                      REGISTERED
                      <br />
                      AT
                    </th>
                  </tr>
                </thead>
              )}

              <tbody>
                {list?.length === 0 ? (
                  <tr>
                    <td>
                      <span> {t('list:noData')}</span>
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
                        onClick={handleClick}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Slider onToggle={toggleSlider} clickedItem={clickedItem} />
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
};

export default ItemList;
