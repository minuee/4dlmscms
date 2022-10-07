import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialValues } from '@/pages/IMS/System/Detail/Rule/Detail';
import { ValueType } from '@/types/IMS/system/rule/index';

export const rule = createSlice({
  name: 'rule',
  initialState: {
    current: initialValues,
    list: [] as ValueType[],
  },
  reducers: {
    setCurrent(state, action: PayloadAction<any>) {
      state.current = action.payload;
    },
    setList(state, action: PayloadAction<any>) {
      state.list = action.payload;
    },
    resetCurrent(state) {
      state.current = initialValues;
    },
    resetList(state) {
      state.list = [] as ValueType[];
    },
  },
});

export const { setCurrent, setList, resetCurrent, resetList } = rule.actions;

export default rule.reducer;
