import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ValueType,
  initialValues,
} from '@/pages/IMS/System/Detail/Scale/Detail';

export const scale = createSlice({
  name: 'scale',
  initialState: {
    current: {} as ValueType,
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
      state.current = {} as ValueType;
    },
    resetList(state) {
      state.list = [] as ValueType[];
    },
  },
});

export const { setCurrent, setList, resetCurrent, resetList } = scale.actions;

export default scale.reducer;
