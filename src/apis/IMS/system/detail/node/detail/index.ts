import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { ValueType } from '@/pages/IMS/System/Detail/Node/Detail';

export const useNodeDetailRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getData = async (id: number, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });

    const responseData = await sendRequest(
      `/web/node/getNode`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    return responseData;
  };

  // Pick<ValueType, 'id'>
  const deleteData = async (id: number, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });
    const responseData = await sendRequest(
      `/web/node/deleteNode`,
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
    node_id: number,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      node_id,
      name: values.name,
      public_ip: values.public_ip,
      public_port: values.public_port,
      private_ip: values.private_ip,
      private_port: values.private_port,
      node_type: values.node_type,
      is_origin: values.is_origin,
      domain: values.domain,
      region: values.region,
      // region_name: values.region_name,
      instance_id: values.instance_id,
      initial_state: values.initial_state,
      state: values.state,
      // is_auto_scale_out: values.is_auto_scale_out,
      ls_type: values.ls_type,
      ml_type: values.ml_type,
      deploy_type: values.deploy_type,
      parent_node_id: values.parent_node_id,
    });

    const responseData = await sendRequest(
      `/web/node/updateNode`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    // console.log({ responseData });

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
      public_ip: values.public_ip,
      public_port: values.public_port,
      private_ip: values.private_ip,
      private_port: values.private_port,
      node_type: values.node_type,
      is_origin: values.is_origin,
      domain: values.domain,
      region: values.region,
      // region_name: values.region_name,
      instance_id: values.instance_id,
      initial_state: values.initial_state,
      state: values.state,
      // is_auto_scale_out: values.is_auto_scale_out,
      ls_type: values.ls_type,
      ml_type: values.ml_type,
      deploy_type: values.deploy_type,
      parent_node_id: values.parent_node_id,
    });
    const responseData = await sendRequest(
      `/web/node/insertNode`,
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
