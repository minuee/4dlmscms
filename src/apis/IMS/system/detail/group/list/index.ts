import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { IMS_PAGING_COUNT } from '@/settings/constants';

export const useGroupListRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getList = async (
    isTestPage: boolean,
    system_id: string,
    pageNo: number = 1,
    pageSize: number = IMS_PAGING_COUNT,
    sortColumn: string = 'group_index'
  ) => {
    const data = JSON.stringify({
      isDecending: false,
      pageNo,
      pageSize,
      sortColumn,
      system_id,
    });

    const responseData = await sendRequest(
      `/web/group/listGroups`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    console.log(responseData);

    return responseData;
  };

  // 그룹 / 채널 정보가 변경 되었을 시 연관된 시스템에 그룹/채널 정보를 전파한다.
  const requestNotification = async (
    system_id: string,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
    });

    const responseData = await sendRequest(
      `/web/group/notificationGroupChannelInfo`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  const requestExcelImport = async (
    system_id: string,
    file: File,
    isTestPage: boolean
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('system_id', system_id);

    const responseData = await sendRequest(
      `/web/group/upLoadIMSGroupChannelExcel`,
      'restful',
      'post',
      undefined,
      formData,
      false,
      isTestPage
    );

    return responseData;
  };

  return {
    getList,
    requestNotification,
    requestExcelImport,
    isLoading,
  };
};
