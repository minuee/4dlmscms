import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { ValueType } from '@/pages/IMS/System/Detail/Scale/Detail';

export const useScaleDetailRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getData = async (id: number, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });

    const responseData = await sendRequest(
      `/web/scale/getScale`,
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
      `/web/scale/deleteScale`,
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
    scale_id: number,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      scale_id,
      scale_group_count: values.scale_group_count,
      scale_image_id: values.scale_image_id,
      scale_instance_type: values.scale_instance_type,
      scale_instance_type2: values.scale_instance_type2,
      scale_subnet_ids: values.scale_subnet_ids,
      scale_monitoring_tag_name: values.scale_monitoring_tag_name,
      scale_monitoring_tag_value: values.scale_monitoring_tag_value,
      scale_on: values.scale_on,
      scale_out_resource: values.scale_out_resource,
      scale_in_resource: values.scale_in_resource,
      scale_out_limit_time: values.scale_out_limit_time,
      scale_ss_name: values.scale_ss_name,
      scale_key_name: values.scale_key_name,
      region: values.region,
      scale_security_group_ids: values.scale_security_group_ids,
    });

    const responseData = await sendRequest(
      `/web/scale/updateScale`,
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
      scale_group_count: values.scale_group_count,
      scale_image_id: values.scale_image_id,
      scale_instance_type: values.scale_instance_type,
      scale_instance_type2: values.scale_instance_type2,
      scale_subnet_ids: values.scale_subnet_ids,
      scale_monitoring_tag_name: values.scale_monitoring_tag_name,
      scale_monitoring_tag_value: values.scale_monitoring_tag_value,
      scale_on: values.scale_on,
      scale_out_resource: values.scale_out_resource,
      scale_in_resource: values.scale_in_resource,
      scale_out_limit_time: values.scale_out_limit_time,
      scale_ss_name: values.scale_ss_name,
      scale_key_name: values.scale_key_name,
      region: values.region,
      scale_security_group_ids: values.scale_security_group_ids,
    });
    const responseData = await sendRequest(
      `/web/scale/insertScale`,
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
