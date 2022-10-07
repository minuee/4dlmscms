import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';
import { returnNe } from '@/utils/commonFn';

export const useCMSCategoryDetailRequest = () => {
  const { sendRequest } = useRestfulCustomAxios();

  const submitCategoryInfo = async (
    category_type,
    values,
    valuePerCategory
  ) => {
    const data = JSON.stringify({
      en_name: returnNe(values['name__en-US']),
      kr_name: returnNe(values['name__ko-KR']),
      en_subname: returnNe(values['sub_name__en-US']),
      kr_subname: returnNe(values['sub_name__ko-KR']),
      en_desc: returnNe(values['desc__en-US']),
      kr_desc: returnNe(values['desc__ko-KR']),
      ...valuePerCategory,
    });

    const responseData = await sendRequest(
      `/category/make/${category_type}`,
      'restful',
      'post',
      undefined,
      data,
      false,
      false
    );

    return responseData;
  };

  return { submitCategoryInfo };
};
