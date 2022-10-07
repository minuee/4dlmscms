import { showNotification, validationSchema } from '@/utils/commonFn';
import { useTranslation } from 'react-i18next';

//? 만일 이 로직으로 검사할 수 없는 경우에는 온섭밋에서 리턴하는 방식으로 진행하기
export const useValidation = () => {
  const { t } = useTranslation();

  const validateFormData = async (noCheckList, formSchemaName, values, langFileName) => {
    const formSchema = validationSchema(formSchemaName);
    const validateField = async (key) => {
      const fieldError = await formSchema
        .pick([key])
        .validate({ [key]: values[key] })
        .catch((err) => {
          let message = langFileName ? t(`${langFileName}:${err.errors[0]}`) : t(`${err.errors[0]}`);

          if (!message) message = err.errors[0];
          showNotification(message, 'error');
          return err.errors[0];
        });

      if (typeof fieldError === 'object') return;
      return { key, fieldError };
    };

    const validateAll = async () => {
      const allErr = {};
      const promises = [];
      Object.keys(values).map((key) => {
        if (
          ['current', 'id', '_id', 'group_id', 'saved', 'savedId', 'checked']
            .concat(noCheckList)
            .includes(key)
        )
        return;

        const promiseOne = validateField(key);
        promises.push(promiseOne);
      });

      await Promise.all(promises).then((err) => {
        if (err.filter((e) => e === undefined).length === err.length)
          return allErr;

        err.map((e) => {
          if (!e) return;
          const key = e.key;
          Object.assign(allErr, { [key]: e.fieldError && e.fieldError });
        });
        return allErr;
      });

      return allErr;
    };

    const totalErr = await validateAll();
    return totalErr;
  };

  return { validateFormData };
};
