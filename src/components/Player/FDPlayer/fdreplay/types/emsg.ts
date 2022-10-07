export interface Emsg {
  id: number,
  message: string
}

export interface FrameEmsg {
  id: number,
  offset: number,
  size: number,
}

export interface FrameEmsgList {
  frameId: number,
  data: Uint8Array,
  messages: FrameEmsg | Array<FrameEmsg>,
  timestamp?: number
}

export interface SegmentEmsgList {
  segmentId: number,
  orginData: Uint8Array,
  messages: Array<FrameEmsgList>,
  timestamp: number
}