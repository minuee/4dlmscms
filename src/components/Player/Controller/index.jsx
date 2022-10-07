import React, { useState, useContext } from 'react';
import { PlayerContext  } from 'comp/Player/HlsPlayer';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import BtnPlayNPause from './BtnPlayNPause';
import BtnResolution from './BtnResolution';
import BtnFullScreen from './BtnFullScreen';

const settings = {
  start: 0,
  min: 0,
  max: 100,
  step: 0,
}

const Controller = () => {

  const [txtDuration, setTxtDuration] = useState('00:00');
  const [txtPlaybackTime, setTxtPlaybackTime] = useState('00:00');
  const [txtShowingTime, setTxtShowingTime] = useState('00:00');
  const [duration, setDuration] = useState(0);
  const [playbactTime, setPlaybackTime] = useState(0);
  const [percentPlayed, setPercentPlayed] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isNow, setIsNow] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const playerContext = useContext(PlayerContext); 

  window.callUpdateDuration = (duration) => {
    const playDuration = playerContext.utils.getCurrentTimeWithSecond(duration);
    setDuration(duration);
    setTxtDuration(playDuration);
  }

  window.callUpdatePlaybackTime = (currentTime) => {
    let played;
    if (isLive && isNow) {
      played = 100;
    } else {
      let playtime, realTime = currentTime, realDuration = duration;
      played = parseFloat(((realTime / realDuration)*100).toFixed(2));
      
      if (isLive) {
        playtime = '-' + playerContext.utils.getCurrentTimeWithSecond(realDuration - realTime);
        setTxtShowingTime(playtime); 
      } else {            
        playtime = playerContext.utils.getCurrentTimeWithSecond(realTime);
        setTxtPlaybackTime(playtime);
      }      
    }

    setPercentPlayed(played);
    setPlaybackTime(currentTime);
  }

  window.callUpdateIsLive = (isValue) => {
    setIsLive(isValue);
  }

  window.callUpdateIsNow = (isValue) => {
    setIsNow(isValue);
  }

  const onChangeSeekbar = (value) => {
    if(duration > 0) {
      if (!isSeeking) {
        playerContext.player.setMediaLiveOff(false);
        playerContext.player.seekBarMouseDownHandler();
        setIsSeeking(true);
      }

      let seekTime, playtime;
      seekTime =duration * value * 0.01;

      if (isLive) {        
        playtime = '- ' + playerContext.utils.getCurrentTimeWithSecond(duration - seekTime);        
        setTxtShowingTime(playtime);
      } else {
        playtime = playerContext.utils.getCurrentTimeWithSecond(seekTime);             
        setTxtPlaybackTime(playtime);
      }

      setPlaybackTime(seekTime);
      setPercentPlayed(value);
    }
  }

  // Excepting Event (Fired twice)
  const onBeforeChangeSeekbar = () => {
    //console.log('Seeking: On');    
  }

  const onAfterChangeSeekbar = () => {    
    if (isSeeking) {
      playerContext.player.seekBarMouseUpHandler(playbactTime);
      setIsSeeking(false);
    }
  }

  const onClickChangeIsNow = () => {
    playerContext.player.setMediaLiveOn(true);
    window.callByInIsPlaying(true);
    playerContext.player.startLiveOnNow();
  }

  return (
    <div className="absolute z-40 w-full bottom-1">
      <div className="flex h-5 items-center px-8">        
        <div className={`text-white font-openSans font-semibold ${isLive && isNow? 'hidden' : ''}`} style={{fontSize: '1.7vw'}}>
          <div className={`${isLive? 'hidden' : ''}`}>{ txtPlaybackTime } / { txtDuration }</div>
          <div className={`${isLive && !isNow? '' : 'hidden'}`}>{ txtShowingTime }</div>
        </div>                  
      </div>
      <div className="flex items-center px-3">
        <BtnPlayNPause />
        <div className="flex-1 px-4">
          <Slider 
            style={{height: '14px'}}                         
            railStyle={{
              height: 3,
              background: "#90918d"
            }}
            handleStyle={{
              height: 14,
              width: 14,
              marginTop: -5, 
              backgroundColor: "red",
              border: 0
            }}
            trackStyle={{
              background: "#e31414"
            }}
            settings={settings}
            value={percentPlayed}
            onChange={onChangeSeekbar}
            onBeforeChange={onBeforeChangeSeekbar}
            onAfterChange={onAfterChangeSeekbar}
            //handle={handle}                   
          />
        </div>          
        <BtnResolution />
        <BtnFullScreen />
      </div>
    </div>
  );
};

export default Controller;