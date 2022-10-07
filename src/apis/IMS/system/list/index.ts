import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { IMS_PAGING_COUNT } from '@/settings/constants';

export const useSystemListRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getList = async (
    isTestPage: boolean,
    pageNo: number = 1,
    pageSize: number = IMS_PAGING_COUNT,
    sortColumn: string = 'id',
    venue_id?: string
  ) => {
    const data = JSON.stringify({
      isDecending: false,
      pageNo,
      pageSize,
      sortColumn,
      venue_id,
    });

    const responseData = await sendRequest(
      `/web/system/listSystem`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    return responseData;
  };

  return {
    getList,
    isLoading,
  };
};
