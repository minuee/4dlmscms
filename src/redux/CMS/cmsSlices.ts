import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const cms = createSlice({
  name: 'cms',
  initialState: {
    cms: {} as any,
  },
  reducers: {
    addCMS(state, action: PayloadAction<any>) {
      state.cms = action.payload;
    },
    delCMS(state) {
      state.cms = {};
    },
  },
});

export const { addCMS, delCMS } = cms.actions;
export default cms.reducer;
