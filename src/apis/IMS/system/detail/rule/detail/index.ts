import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { ValueType } from '@/pages/IMS/System/Detail/Rule/Detail';

export const useRuleDetailRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getData = async (id: number, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });

    const responseData = await sendRequest(
      `/web/rule/getRule`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    return responseData;
  };

  const deleteData = async (id: number, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });
    const responseData = await sendRequest(
      `/web/rule/deleteRule`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  const updateData = async (
    system_id: string,
    rule_id: number,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      rule_id,
      name: values.name,
      node_type: values.node_type,
      region: values.region,
      session: values.session,
      max_instances: values.max_instances,
      description: values.description,
    });

    const responseData = await sendRequest(
      `/web/rule/updateRule`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  const createData = async (
    system_id: string,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      name: values.name,
      node_type: values.node_type,
      region: values.region,
      session: values.session,
      max_instances: values.max_instances,
      description: values.description,
    });
    const responseData = await sendRequest(
      `/web/rule/insertRule`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  return {
    createData,
    getData,
    updateData,
    deleteData,
    isLoading,
  };
};
