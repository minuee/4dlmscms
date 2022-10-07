import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialValues } from '@/pages/IMS/System/Detail/Event/Detail';
import { ValueType } from '@/types/IMS/system/event/index';

export const event = createSlice({
  name: 'event',
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

export const { setCurrent, setList, resetCurrent, resetList } = event.actions;

export default event.reducer;
