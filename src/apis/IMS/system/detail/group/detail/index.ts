import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { ValueType } from '@/types/IMS/system/group/index';

export const useGroupDetailRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getData = async (id: number, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });

    const responseData = await sendRequest(
      `/web/group/getGroups`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    return responseData;
  };

  // TODO: api나오면 해당 api로 수정해야 함
  const deleteData = async (id: number, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });
    const responseData = await sendRequest(
      `/web/group/deleteRule`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  // TODO: api나오면 해당 api로 수정해야 함
  const updateData = async (
    system_id: string,
    group_id: number,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      group_id,
      name: values.name,
      // node_type: values.node_type,
      // session: values.session,
      // max_instances: values.max_instances,
      description: values.description,
    });

    const responseData = await sendRequest(
      `/web/group/updateRule`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  // TODO: api나오면 해당 api로 수정해야 함
  const createData = async (
    system_id: string,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      name: values.name,
      // node_type: values.node_type,
      // session: values.session,
      // max_instances: values.max_instances,
      description: values.description,
    });
    const responseData = await sendRequest(
      `/web/group/insertRule`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  const getOtherGroupData = async (id: number, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });
    const responseData = await sendRequest(
      `/web/group/getGroupsIncludeChannel`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    // console.log({ responseData });

    return responseData;
  };

  return {
    createData,
    getData,
    getOtherGroupData,
    updateData,
    deleteData,
    isLoading,
  };
};
