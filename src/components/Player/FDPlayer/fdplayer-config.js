// author: Jinsung Park
// email: jspark@4dreplay.com

import { EventDispatcher } from './common/EventDispatcher';
import COMMON_VAL from './common/CommonVariable';

export class FDPlayerConfig extends EventDispatcher {

  constructor(utils, props) {
    super();
    this.utils = utils;
    this.props = props;

    this.fVolume = 1;
		this.isMobile = this.utils.isMobile();
    this.isHasPointerEvent = this.utils.hasPointerEvent();    
    this.init();
  }

  init() {
    this.parseProperties();
  }  

  parseProperties() {
    try{
      this.fVolume = this.props.volume;
      if(!this.fVolume) this.fVolume = 1;
      if(this.fVolume > 1) {
        this.fVolume = 1;
      } else if(this.fVolume <= 0) {
        this.fVolume = 0;
      }   
      
      this.isPlaysinline = this.utils.convertStrToBool(this.props.playsinline); 

      setTimeout(() => {
        this.onPreloaderLoadHandler();
      }, 1);
    } catch(err) {
      console.log(err);
    }
  }

  onPreloaderLoadHandler = () => {
    this.dispatchEvent(COMMON_VAL.PLAYER_EVENT.PRELOADER_LOAD_DONE);        
  }
}