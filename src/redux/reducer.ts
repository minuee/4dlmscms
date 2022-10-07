import { combineReducers } from '@reduxjs/toolkit';

import users from './Auth/authSlices';

// cms
// legacy
import cms from './CMS/cmsSlices';
// updated
import content from './CMS/contentSlices';
// category
import category from './CMS/categorySlices';

// video upload
// basic
import basicVideoUpload from './CMS/BasicVideoUploadSlices';

// ims
import venue from './IMS/venue/venueSlices';

import info from './IMS/system/infoSlices';
import rule from './IMS/system/ruleSlices';
import scale from './IMS/system/scaleSlices';
import node from './IMS/system/nodeSlices';
import group from './IMS/system/groupSlices';
import event from './IMS/system/eventSlices';

// paging(pagination)
import paging from './Paging/pagingSlices';

const reducer = combineReducers({
  users,
  cms,
  category,
  venue,
  rule,
  scale,
  node,
  info,
  group,
  event,
  content,
  paging,
  basicVideoUpload,
});

export type ReducerType = ReturnType<typeof reducer>;
export default reducer;
