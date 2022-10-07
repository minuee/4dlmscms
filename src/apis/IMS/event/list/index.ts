import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';

export const useEventListRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getList = async (
    isTestPage: boolean,
    pageNo: number = 1,
    pageSize: number = 100,
    sortColumn: string = 'id'
  ) => {

    const data = JSON.stringify({
      isDecending: false,
      pageNo,
      pageSize,
      sortColumn,
    });

    const responseData = await sendRequest(
      `/web/event/listEvents`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    return responseData;
  };

  return { getList, isLoading };
};
