import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ItemType } from '@/types/IMS/system/info/index';
import { initialValues } from '@/pages/IMS/System/Detail/Info/index';

export const info = createSlice({
  name: 'info',
  initialState: {
    current: initialValues,
    list: [] as ItemType[],
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
      state.list = [] as ItemType[];
    },
  },
});

export const { setCurrent, setList, resetCurrent, resetList } = info.actions;

export default info.reducer;
