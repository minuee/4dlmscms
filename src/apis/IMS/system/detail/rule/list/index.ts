import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { IMS_PAGING_COUNT } from '@/settings/constants';

export const useRuleListRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getList = async (
    isTestPage: boolean,
    system_id: string,
    pageNo: number = 1,
    pageSize: number = IMS_PAGING_COUNT,
    sortColumn: string = 'id'
  ) => {
    const data = JSON.stringify({
      isDecending: false,
      pageNo,
      pageSize,
      sortColumn,
      system_id,
    });

    const responseData = await sendRequest(
      `/web/rule/listRule`,
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
