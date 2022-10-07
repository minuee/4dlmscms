import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  lazy,
  memo,
  Fragment,
} from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { excludeNe, classNames, returnIcon } from '@/utils/commonFn';
import { useCMSListRequest } from '@/apis/CMS/list/index';

import {
  CMS_CONTENT,
  CMS_CONTENT_LIST,
  CMS_CONTENT_LIST_CREATE,
  CMS_CONTENT_UPDATE,
  CMS_PAGING_COUNT,
  PAGING_STRING,
} from 'sets/constants';

// import { useCMS } from '@/hooks/cms-hooks';
import { usePlayInfoHooks } from '@/hooks/CMS/usePlayInfo-hooks';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';

// new redux data
import {
  setChildList,
  resetChildCurrent,
  setParentCurrent,
} from '@/redux/CMS/contentSlices';
import { CMSContext } from 'cont/cms';

const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));

const InfoInputs = lazy(() => import('comp/Modal/CmsInfoModal'));
const PageLoaderModal = lazy(() => import('comp/PageLoader/PageLoaderModal'));

import Item from './component/ChildContentItem';
import Button, { ButtonAdd } from 'comp/Button/Button';
const Pagination = lazy(
  () => import('@/components/Pagination/PaginationBackAndForth')
);

const compName = 'Content Child';

interface ItemListProps {}

// TODO: vod list 순서 -> list 말고 totalRawList에서 만들기
export const ItemList: React.FC<ItemListProps> = memo(({}) => {
  const { updateStep, changeIsUpdate } = useContext(CMSContext);
  const { t } = useTranslation();

  const history = useHistory();
  // updated redux
  const cmsData = useAppSelector((state: ReducerType) => state.content);

  const dispatch = useAppDispatch();

  const { getContentChildList, getData, isLoading } = useCMSListRequest();
  // const { updateCMSChildListReduxData } = useCMS();
  const { playInfoData, handleSetPlayInfoValues, handleUpdatePlayInfoValues } =
    usePlayInfoHooks();

  // 추가 데이터를 로드하는지 아닌지를 담기위한 state
  // const [isAllFetched, setIsAllFetched] = useState<boolean>(false);

  const [list, setList] = useState([]);
  const [pagingInfo, setPagingInfo] = useState({
    pagingCount: CMS_PAGING_COUNT, // 몇 개씩 가져올지 결정
    totalCount: 0,
    totalPage: 0,
    currentPage: 1,
    currentCount: 0,
  });

  const [isReady, setIsReady] = useState<boolean>(false);
  const [isAppListModalOpen, setIsAppListModalOpen] = useState<boolean>(false);
  const [isOpenInfoModal, setIsOpenInfoModal] = useState<boolean>(false);

  const appItemList = useRef([]);
  const appItemRawTotalList = useRef([]);

  // 라이브 인포 세팅(모달에 보여줄 값)
  // 페어런트 정보를 세팅하는 이유 -> child content 정보는 Item에서 세팅함
  useEffect(() => {
    // updated redux
    handleUpdatePlayInfoValues(cmsData.parentCurrent?.live?.info, 'saved');
  }, []);

  // ********************
  // paging
  // ********************
  useEffect(() => {
    // cmsData.parentCurrent?.content_id(부모컨텐츠) 없으면 페어런트 콘텐트 리스트 페이지로 이동
    // updated redux
    if (!cmsData.parentCurrent?.content_id) history.push(CMS_CONTENT_LIST);

    // dispatch(resetChildCurrent());
    // 페이지 첫 진입 시
    if (!location.search) {
      // 해당 컨텐트의 브이오디 리스트를 받아온다.
      getAllData('c', 1, 0, pagingInfo.pagingCount, 1);
      return;
    }

    const newPageNum = location.search.split(PAGING_STRING)[1];
    getAllData(
      'c',
      1,
      (Number(newPageNum) - 1) * pagingInfo.pagingCount,
      pagingInfo.pagingCount,
      Number(newPageNum)
    );
  }, [location.search]);

  const goNextPage = () => {
    // 마지막데이터까지 다 받아오면 더이상 데이터를 요청하지 않는다.
    // if (isAllFetched) return;
    if (
      pagingInfo.totalPage !== 0 &&
      pagingInfo.totalPage === pagingInfo.currentPage
    ) {
      return;
    }
    history.push(
      `${CMS_CONTENT_LIST}${PAGING_STRING}${pagingInfo.currentPage + 1}`
    );
  };
  const goPrevPage = () => {
    if (pagingInfo.currentPage === 1) return; // 마지막데이터까지 다 받아오면 더이상 데이터를 요청하지 않는다.
    history.push(
      `${CMS_CONTENT_LIST}${PAGING_STRING}${pagingInfo.currentPage - 1}`
    );
  };

  // 클릭한 cms 라운드 아이템 list 정보를 불러오는 메소드
  const getAllData = async (
    item: ItemOrderType,
    desc: OrderingType,
    skip: number,
    limit: number,
    page?: number
  ) => {
    // cmsData.content?.content_id(부모컨텐츠) 없으면 페어런트 콘텐트 리스트 페이지로 이동
    // if (!cmsData.content?.content_id) history.push(CMS_CONTENT);
    // updated redux
    if (!cmsData.parentCurrent?.content_id) history.push(CMS_CONTENT);

    // 서버 저장 요청
    const result = await getContentChildList(
      // updated redux
      cmsData.parentCurrent?.content_id,
      cmsData.parentCurrent?._id,
      item,
      desc,
      skip,
      limit
    );

    setIsReady(true);
    // 서버 요청 성공 시에만 리덕스 업데이트
    if (!result) {
      return;
    }

    // 결과 세팅
    handleSetList(result, page);
  };

  // paring 한 ui를 보여주기 위해 리스트를 변경하는 메서드
  const sortArrForParing = (result: TotalItemType[]) => {
    // add pair logic
    // sort한 다음에, 같은 아이템끼리 배열에 넣는다.
    const sortedArr = result.sort(function (a, b) {
      if (a?.vod?.exposure_order > b?.vod?.exposure_order) {
        return 1;
      }
      if (a?.vod?.exposure_order < b?.vod?.exposure_order) {
        return -1;
      }

      if (a?.vod?.exposure_order === b?.vod?.exposure_order) {
        if (a?.updatedAt > b?.updatedAt) {
          return 1;
        } else {
          return -1;
        }
      }
      // a must be equal to b
      return 0;
    });
    const totalArr = [];
    let exposeOrder = sortedArr[0]?.vod?.exposure_order;
    let sameOrderArr = [];
    sortedArr.forEach((item, idx) => {
      if (item?.vod?.exposure_order === exposeOrder) {
        sameOrderArr.push(item);
      } else {
        totalArr.push(sameOrderArr);
        exposeOrder = item?.vod?.exposure_order;
        sameOrderArr = [item];
      }

      if (idx === sortedArr.length - 1 && sameOrderArr.length !== 0) {
        totalArr.push(sameOrderArr);
        // return;
      }
    });

    return totalArr;
  };

  const handleSetList = (result: TotalItemType[], page?: number) => {
    // // add pair logic
    // // sort한 다음에, 같은 아이템끼리 배열에 넣는다.
    // const sortedArr = result.sort(function (a, b) {
    //   if (a?.vod?.exposure_order > b?.vod?.exposure_order) {
    //     return 1;
    //   }
    //   if (a?.vod?.exposure_order < b?.vod?.exposure_order) {
    //     return -1;
    //   }

    //   if (a?.vod?.exposure_order === b?.vod?.exposure_order) {
    //     if (a?.updatedAt > b?.updatedAt) {
    //       return 1;
    //     } else {
    //       return -1;
    //     }
    //   }

    //   // a must be equal to b
    //   return 0;
    // });
    // const totalArr = [];
    // let exposeOrder = sortedArr[0]?.vod?.exposure_order;
    // let sameOrderArr = [];
    // sortedArr.forEach((item, idx) => {
    //   if (item?.vod?.exposure_order === exposeOrder) {
    //     sameOrderArr.push(item);
    //   } else {
    //     totalArr.push(sameOrderArr);
    //     exposeOrder = item?.vod?.exposure_order;
    //     sameOrderArr = [item];
    //   }

    //   if (idx === sortedArr.length - 1 && sameOrderArr.length !== 0) {
    //     totalArr.push(sameOrderArr);
    //     // return;
    //   }
    // });

    const totalArr = sortArrForParing(result);
    // list update
    setList(totalArr);

    // redux update
    dispatch(setChildList(result));

    // 결과가 요청 수 보다 적으면 마지막 요청이라고 판단한다.
    // if (result.length < pagingInfo.pagingCount) setIsAllFetched(true);

    setPagingInfo((prev) => ({
      ...prev,
      currentPage: page ? page : prev.currentPage + 1,
      currentCount: result.length,
      totalPage:
        result.length < pagingInfo.pagingCount
          ? prev.currentPage + 1
          : prev.totalPage,
    }));

    const uniqueArr = [...appItemRawTotalList.current, ...result].reduce(
      (arr, content) => {
        !arr.find((item) => item._id === content._id) && arr.push(content);
        return arr;
      },
      []
    );

    appItemRawTotalList.current = uniqueArr;
  };

  const handleAddEvent = () => {
    updateStep(0);
    changeIsUpdate(false);

    // updated redux logic
    // 리덕스에 있는 데이터 초기화
    dispatch(resetChildCurrent());

    history.push({ pathname: CMS_CONTENT_LIST_CREATE });
  };

  // parent content 데이터를 수정하는 페이지로 이동하는 메서드
  const editParentContentInfo = async (content_id, _id) => {
    const result = await getData(content_id, _id);
    if (!result) return;

    // 결과를 리덕스에 담는다.
    updateStep(5);
    changeIsUpdate(true);

    // updated redux
    // 서버에서 받아온 데이터를 페어런트 컨텐트의 현재 데이터로 넣는다.
    dispatch(setParentCurrent(result));
    // 페이지 이동
    history.push({ pathname: CMS_CONTENT_UPDATE });
  };

  // mobile app 순서를 보여주는 모달 오픈 메서드
  const openModal = () => {
    getAppVodOrderList();
    setIsAppListModalOpen(true);
  };

  // mobile app 보여주는 순서와 맞춘 ui를 띄워주기 위해 컨텐츠를 정렬하는 메서드
  const getAppVodOrderList = () => {
    const appVodArr = [...appItemRawTotalList.current].filter((item) => {
      // const appVodArr = [...list].filter((item) => {
      if (
        item.have_parent === true &&
        item.video_type_id === 1 &&
        item.service_status === 1
      )
        return item;
    });

    appVodArr.sort(function (a, b) {
      if (a?.vod?.exposure_order > b?.vod?.exposure_order) {
        return 1;
      }
      if (a?.vod?.exposure_order < b?.vod?.exposure_order) {
        return -1;
      }

      if (a?.vod?.exposure_order === b?.vod?.exposure_order) {
        if (a?.updatedAt > b?.updatedAt) {
          return 1;
        } else {
          return -1;
        }
      }

      // TODO: replay랑 interacive 중 replay 하나만 보이게 한다.
      // order가 같으면 is_interactive확인
      // a에 isHide attr를 추가한다.
      // a must be equal to b
      return 0;
    });

    // setItemAppList(appVodArr);
    appItemList.current = appVodArr;
  };

  // info(플레이인포) modal을 닫는 메서드
  const closeInfoModal = () => setIsOpenInfoModal(false);

  // info modal에서 값을 받아오는 메서드, 받아서 infoRef의 값을 업데이트 한다.
  const getInfoValueFromModal = (values) => {
    handleSetPlayInfoValues(values);
    closeInfoModal();
  };

  ////////////////////////////////////////////////////
  return (
    <>
      <PageLoaderModal isOpen={!isReady} />
      {/* info modal */}
      {/* Content용  */}
      {isOpenInfoModal && (
        <>
          <Backdrop isShow={isOpenInfoModal} />
          <InfoInputs
            isShow={isOpenInfoModal}
            type='live'
            // parent정보를 set하는 이유 -> child content 정보는 Item에서 세팅함
            content_id={cmsData.parentCurrent?.content_id.toString()}
            _id={cmsData.parentCurrent?._id}
            league_id={cmsData.parentCurrent?.league_id.toString()}
            // idx={cmsData.parentCurrent?.idx}
            data={playInfoData}
            onClose={closeInfoModal}
            onCloseAndGetValue={(values) => getInfoValueFromModal(values)}
          />
        </>
      )}

      {/* app vod modal */}
      <>
        <Backdrop
          isShow={isAppListModalOpen}
          onClick={() => setIsAppListModalOpen(false)}
        />
        <Modal
          isShow={isAppListModalOpen}
          title='APP VOD Order'
          content={
            <ul className='cms__app-vod-list'>
              {appItemList.current?.map((item, idx) => {
                return (
                  <li
                    key={`${item._id}_${idx}`}
                    className={classNames`flex mb-3 items-start bg-dark-5 p-3 rounded-md
                      ${
                        (item?.vod?.exposure_order ===
                          list[idx + 1]?.vod?.exposure_order &&
                          item?.video.is_interactive) ||
                        (item?.vod?.exposure_order ===
                          list[idx - 1]?.vod?.exposure_order &&
                          item?.video.is_interactive)
                          ? 'hidden'
                          : ''
                      }
                      `}
                  >
                    {excludeNe(item?.photo.thumb.small_url) ||
                    excludeNe(item?.photo.thumb.middle_url) ||
                    excludeNe(item?.photo.thumb.large_url) ? (
                      <img
                        className='object-cover w-24 h-16'
                        src={
                          excludeNe(item?.photo.thumb.small_url)
                            ? item?.photo.thumb.small_url
                            : excludeNe(item?.photo.thumb.middle_url)
                            ? item?.photo.thumb.middle_url
                            : excludeNe(item?.photo.thumb.large_url)
                            ? item?.photo.thumb.large_url
                            : null
                        }
                        alt='content thumbnail'
                        crossOrigin='anonymous'
                      />
                    ) : (
                      <div className='w-24 h-16 bg-gray-700 rounded-sm skeleton'></div>
                    )}
                    <div className='flex flex-col ml-3'>
                      <span className='mb-1 text-lg font-bold leading-4 sm:text-base'>
                        {item.name['en-US']}
                      </span>
                      <span>{item.sub_name['en-US']}</span>
                      <span>{item.desc['en-US']}</span>
                    </div>

                    <span className='ml-auto mr-2 whitespace-nowrap'>
                      {t('list:order')} {item.vod.exposure_order}
                    </span>
                  </li>
                );
              })}
            </ul>
          }
          type='info'
          closeBtn
          onClose={() => setIsAppListModalOpen(false)}
        >
          <Button
            color='btn-primary'
            onClick={() => {
              setIsAppListModalOpen(false);
            }}
          >
            {t('list:close')}
          </Button>
        </Modal>
      </>
      {/* )} */}

      <div className='list__header'>
        <h2 className='list__header__text'>
          {`${compName} ${t('list:list')}`}
        </h2>
      </div>
      <div className='list__body__wrapper'>
        <div className='list__body__wrapper__top'>
          <Button color={'btn-primary'} onClick={handleAddEvent}>
            {t('list:addNewContent')}
          </Button>
          <ButtonAdd onClick={handleAddEvent} />
        </div>

        {/* //////////////////////////////////////////////////////////////// */}
        {/* parent content info */}
        {/* //////////////////////////////////////////////////////////////// */}
        <h3 className='block col-span-12 ml-5 font-bold uppercase'>
          {t('list:parentContent')}
        </h3>
        <div
          onClick={() =>
            editParentContentInfo(
              // updated redux
              cmsData.parentCurrent?.content_id,
              cmsData.parentCurrent?._id
            )
          }
          className='flex flex-wrap items-center col-span-12 px-4 py-6 mt-2 rounded-md cursor-pointer bg-dark-3 intro-y sm:flex-nowrap'
        >
          {/* content_id */}
          <div className='mr-5'>{cmsData.parentCurrent?.content_id}</div>
          {excludeNe(cmsData.parentCurrent?.photo.thumb.small_url) ||
          excludeNe(cmsData.parentCurrent?.photo.thumb.middle_url) ||
          excludeNe(cmsData.parentCurrent?.photo.thumb.large_url) ? (
            <img
              className='object-cover w-24 h-16'
              src={
                // updated redux
                excludeNe(cmsData.parentCurrent?.photo.thumb.small_url)
                  ? cmsData.parentCurrent?.photo.thumb.small_url
                  : excludeNe(cmsData.parentCurrent?.photo.thumb.middle_url)
                  ? cmsData.parentCurrent?.photo.thumb.middle_url
                  : excludeNe(cmsData.parentCurrent?.photo.thumb.large_url)
                  ? cmsData.parentCurrent?.photo.thumb.large_url
                  : null
              }
              alt='content thumbnail'
              crossOrigin='anonymous'
            />
          ) : (
            <div className='w-24 h-16 bg-gray-700 rounded-sm skeleton'></div>
          )}
          <span className='text-lg font-bold md:ml-8 whitespace-nowrap'>
            {/* updated redux */}
            {cmsData.parentCurrent?.name['en-US']}
          </span>
          <div className='flex items-center ml-auto transform hover:scale-110'>
            <Button
              color='btn-primary'
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenInfoModal(true);
              }}
            >
              {t('list:editPlayBoardInfo')}
            </Button>
            {/* <div className='flex ml-2.5'>
              {t('list:editContentData')}
              {returnIcon({ icon: 'EditPencil', className: 'w-4 ml-2' })}
            </div> */}
          </div>
        </div>
        {/*  */}

        <div className='table_wrapper--scroll'>
          <div className='w-full mb-4 ml-auto'>
            <Button color='btn-primary' onClick={openModal}>
              {t('list:checkAppVodOrder')}
            </Button>
          </div>
          <table className='table -mt-2 table-report table-report--content-list'>
            {list?.length !== 0 && (
              <thead className=''>
                <tr>
                  <th className='th--basic'>{t('list:id')}</th>
                  <th className='th--basic'>{t('list:package')}</th>
                  <th className='th--basic'>{t('list:thumbnail')}</th>
                  <th className='th--basic'>{t('list:title')}</th>
                  <th className='th--basic'></th>
                  <th className='th--basic'>{t('list:autoUploaded')}</th>
                  <th className='th--basic'>{t('list:startTime')}</th>
                  <th className='th--basic'>{t('list:endTime')}</th>
                </tr>
              </thead>
            )}
            <tbody className='list__wrapper'>
              {list?.length === 0 ? (
                <tr>
                  <td>
                    <span>{t('list:noData')}</span>
                  </td>
                </tr>
              ) : (
                list?.map((item, idx) => {
                  if (Array.isArray(item)) {
                    return (
                      <Fragment key={`table__separator__${idx}`}>
                        {item.map((comp, idx) => {
                          return (
                            <Item
                              key={comp._id}
                              data={comp}
                              setList={setList}
                              sortList={sortArrForParing}
                              idx={idx}
                              withTr={false}
                            />
                          );
                        })}
                        <tr className='pb-10 tr__seperator'>
                          <td className='tr__seperator__td '></td>
                        </tr>
                      </Fragment>
                    );
                  }

                  return (
                    <Item
                      key={item._id}
                      data={item}
                      setList={setList}
                      sortList={sortArrForParing}
                      idx={idx}
                      withTr
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination onClickPrev={goPrevPage} onClickNext={goNextPage} />
    </>
  );
});

export default ItemList;
