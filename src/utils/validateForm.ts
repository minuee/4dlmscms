// TODO: 동적 임포트하기
import { showNotification, validationSchema } from '@/utils/commonFn';
import { useTranslation } from 'react-i18next';

// TODO: builder 패턴쓰기
class ValidateForm {
  noCheckList: Array<string>;
  formSchema: any;
  valueType: any;
  values: any;
  promises: any[];
  allErr: any[];
  totalErr: any[];
  langFileName: string; // equipment, group, event...

  constructor(params) {
    this.noCheckList = params.noCheckList;
    this.formSchema = validationSchema(params.formSchema);
    // this.valueType = params.valueType;
    this.values = params.values;
    // this.promises = [];
    // this.allErr = [];
    // this.totalErr = [];
    this.langFileName = params.langFileName;
  }

  validateForm = async () => {
    //  validateForm = async (values: Optional<this.valueType>) => {

    const { t } = useTranslation();
    const formSchema = validationSchema('CreateSolution');

    const validateField = async (key) => {
      // const validateField = async (key: keyof SolutionType) => {
      const fieldError = await formSchema
        .pick([key])
        .validate({ [key]: this.values[key] })
        .catch((err) => {
          const message = t(`${this.langFileName}:${err.errors[0]}`);
          showNotification(message, 'error');
          return err.errors[0];
        });

      if (!fieldError[key])
        return {
          key,
          fieldError,
        };
    };

    const validateAll = async () => {
      const allErr = {};
      // const allErr: Optional<Record<keyof SolutionType, string>> = {};
      const promises = [];
      Object.keys(this.values).map((key) => {
        // Object.keys(this.values).map((key: keyof SolutionType) => {
        if (
          ['current', 'id', '_id', 'group_id', 'saved', 'savedId', 'checked']
            .concat(this.noCheckList)
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
}

export default ValidateForm;
