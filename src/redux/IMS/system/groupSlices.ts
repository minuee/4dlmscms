import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialValues } from '@/pages/IMS/System/Detail/Group/Detail';
import { ValueType } from '@/types/IMS/system/group/index';

export const group = createSlice({
  name: 'group',
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

export const { setCurrent, setList, resetCurrent, resetList } = group.actions;

export default group.reducer;
