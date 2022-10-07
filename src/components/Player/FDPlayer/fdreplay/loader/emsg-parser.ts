import { findBox } from '../utils/mp4-tools';
import type { Emsg, FrameEmsg, FrameEmsgList, SegmentEmsgList } from '../types/emsg';

export type EmsgParserSegments = Array<SegmentEmsgList | null>;
export type EmsgParserFrames = Array<FrameEmsgList | null>;

const segmentByteSize = 8*30*9; // 8byte * 30fps * 9segmentInfo
export default class EmsgParser {

  static parseSegment(file: ArrayBuffer): EmsgParserSegments {
    const dataView = new DataView(file);
    const uintData = new Uint8Array(file);
    const emsgBox = findBox(uintData, ['emsg']);
    const segments: EmsgParserSegments = [];

    (window as any).global = window;
    window.Buffer = window.Buffer || require('buffer').Buffer;

    let timestamp = 0;

    if(emsgBox && emsgBox.length > 0) {
      
      emsgBox.forEach((emsg, index) => {
        
        let scheme_id_uri: Emsg = readCString(dataView, emsg.start, emsg.end);
        let value: Emsg = readCString(dataView, emsg.start + scheme_id_uri.id, emsg.end);

        let message_size = (4*4 + (scheme_id_uri.message.length + 1) + (value.message.length + 1));

        const startMessage = emsg.start + message_size;
        const messageData = emsg.data.subarray(startMessage, emsg.end);
        const segmentsEmsgs: Array<Uint8Array> = [];

        if(messageData && messageData.length === segmentByteSize ) {    
          let start = 0;
          for(let i = 0; i < 9; i++) {            
            const segmentTemp = messageData.slice(start, (i+1)*8*30);
            segmentsEmsgs.push(segmentTemp);
            start += 8*30;
          }

          if(segmentsEmsgs) {
            segmentsEmsgs.forEach((segmentEmsg, index) => {
              if(index === 4) {
                ////console.log(index);
              }
              const framesEmsgs: Array<FrameEmsgList> = [];
              timestamp = window.performance.now();
              let frameStart = 0;
              for(let j = 0; j < 30; j++) {
                const frameTemp = segmentEmsg.slice(frameStart, (j+1)*8);
                const offset = frameTemp.slice(0, 4);
                const size = frameTemp.slice(4);

                // let bufOffset = Buffer.from(offset);
                // let bufSize = Buffer.from(size);
                let bufOffset = window.Buffer.from(offset);
                let bufSize = window.Buffer.from(size);
                let message: FrameEmsg = {
                  id: j+1,
                  offset: bufOffset.readUIntBE(0, offset.length),
                  size: bufSize.readUIntBE(0, size.length)
                }

                framesEmsgs.push({
                  frameId: j+1,
                  data: frameTemp,
                  messages: message,
                });
                
                if(index === 4) {
                  ////console.log(message.offset);
                }

                frameStart += 8;
              }
              
              timestamp = window.performance.now() - timestamp;
              segments.push({
                segmentId: index,
                orginData: segmentEmsg,
                messages: framesEmsgs,
                timestamp: timestamp
              });
            });
          }
        }        
      });
    } else {
      console.log('Emsg is null');
    }

    return segments;
  }

  static parseFrame(file: ArrayBuffer): EmsgParserFrames {
    const dataView = new DataView(file);
    ////console.log(`DataView Size: ${dataView.byteLength}`);
    const uintData = new Uint8Array(file);
    const emsgBox = findBox(uintData, ['emsg']);
    const frames: EmsgParserFrames = [];

    (window as any).global = window;
    window.Buffer = window.Buffer || require('buffer').Buffer;

    let timestamp = 0;

    if(emsgBox && emsgBox.length > 0) {
      
      emsgBox.forEach((emsg, index) => {
        timestamp = window.performance.now();
        //let scheme_id_uri = buffer.readCString();
        //let value 						= buffer.readCString();
        //let timescale 					= buffer.readUint32();
        //let presentation_time_delta 	= buffer.readUint32();
        //let event_duration			 	= buffer.readUint32();
        //let id 						= buffer.readUint32();

        let scheme_id_uri: Emsg = readCString(dataView, emsg.start, emsg.end);
        let value: Emsg = readCString(dataView, emsg.start + scheme_id_uri.id, emsg.end);

        let message_size = (4*4 + (scheme_id_uri.message.length + 1) + (value.message.length + 1));

        const startMessage = emsg.start + message_size;
        const messageData = emsg.data.subarray(startMessage, emsg.end);
        const messages: Array<FrameEmsg> = [];

        if(messageData) {          
          let seq = 1;          
          for (let i = 0; i < messageData.length; i+=8) {
            const offset = emsg.data.subarray(startMessage + i, startMessage + i + 4);
            const size = emsg.data.subarray(startMessage + i + 4, startMessage + i + 8);

            // let bufOffset = Buffer.from(offset);
            // let bufSize = Buffer.from(size);  
            let bufOffset = window.Buffer.from(offset);
            let bufSize = window.Buffer.from(size);  
            let message: FrameEmsg = {
              id: seq,
              offset: bufOffset.readUIntBE(0, offset.length),
              size: bufSize.readUIntBE(0, size.length)
            }
            messages.push(message);
            seq++;
          }
        } 

        if(messages.length === 0) {
          //console.log(`Loaded Emsg is Null.`);
        }

        timestamp = window.performance.now() - timestamp;
        frames.push({
          frameId: index,
          data: messageData,
          messages: messages,
          timestamp: timestamp
        });
      });
    } else {
      //console.log(`Loaded EmsgBox is Null.`);
    }

    return frames;
  }
}

function readCString(dataView: DataView, start: number, end: number ): Emsg {
  let arr: Array<number> = [];
  let i = 0;
  let temp = 0;
  try{
    while(true) {  
      if(start + i <= end) {
        let b = dataView.getUint8(start + i);
        if (b !== 0) {
          if(temp === 0) {
            temp = i;
          }
          arr.push(b);
        } else {
          if(temp > 0) {
            break;
          }
        }
      } else {
        break;
      }
      i++;
    }
  } catch (err) {
    //console.log(err);
  }

  return {
    id: i,
    message: String.fromCharCode.apply(null, arr)
  }
}