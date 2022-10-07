import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const basicVideoUpload = createSlice({
  name: 'progress',
  initialState: {
    progress: '0%',
  },
  reducers: {
    setUploadProgress(state, action: PayloadAction<string>) {
      state.progress = action.payload;
    },
  },
});

export const { setUploadProgress } = basicVideoUpload.actions;
export default basicVideoUpload.reducer;
