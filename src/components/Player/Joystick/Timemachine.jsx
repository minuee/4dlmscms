import React, { useRef, useState, useEffect, useContext, useCallback } from 'react';
import { PlayerContext  } from 'comp/Player/HlsPlayer';
import IconTimeslice from 'imgs/player/icon_time_machine_fullscreen.svg';
import BarTimeslice from 'imgs/player/icon_time_slice_progress_bar.svg';

const Timemachine = () => {

  const playerContext = useContext(PlayerContext); 

  const [iconSize, setIconSize] = useState(95);
  const [barWidth, setBarWidth] = useState(233);
  const [barHeight, setBarHeight] = useState(15);
  const [position, setPosition] = useState(50);
  const [ratio, setRatio] = useState(1);
  const [marginLeft, setMarginLeft] = useState(0);
  const [direction, setDirection] = useState(null);

  const sliderBarRef = useRef();
  const sliderIconRef = useRef(); 

  const maxBarWidth = 233;
  const maxBarHeight = 15;
  const maxIconSize = 95;

  const estimateMarginLeft = useCallback(() => {
    const container = playerContext.playerContainer.current;
    if(container && container.offsetHeight && container.offsetHeight !== 0) {
      let resizeRatio = container.offsetHeight  / 600;
      if(resizeRatio > 1) resizeRatio = 1;
      const centerIcon = (maxIconSize*resizeRatio / 100) * position * -1;

      setBarWidth(maxBarWidth*resizeRatio);
      setBarHeight(maxBarHeight*resizeRatio);
      setIconSize(maxIconSize*resizeRatio);
      setRatio(resizeRatio);
      setMarginLeft(centerIcon);
    }
  }, [playerContext.playerContainer, position]);

  const moveX = useCallback(() => {
    const centerIcon = (maxIconSize*ratio / 100) * position * -1;
    setMarginLeft(centerIcon);
  }, [position, ratio]);

  const handleResize = () => {
    estimateMarginLeft();
  };  

  const estimateDirection = (value) => {
    if(value > 90) {
      setDirection('F');
    } else if(value < 10) {
      setDirection('B');
    } 
  }

  const onChangeSlider = (e) => {
    setPosition(e.target.value);
    estimateDirection(e.target.value);
  }  

  const onMouseUpSlider = (e) => {
    setDirection(null);
    setPosition(50);
  }

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }     
  }, [])
  
  useEffect(() => {
    sliderIconRef.current.addEventListener('load', () => {
      estimateMarginLeft();
    });
  }, [sliderIconRef, estimateMarginLeft]);

  useEffect(() => {
    if(position > 0) {
      moveX();
    }
  }, [position, moveX]);

  useEffect(() => {  
    const player = playerContext.player;  
    if(player) {
      if(player.checkTimemachineAvailable(direction)) {
        if(direction) { 
          player.stopLoad();
          player.setInitFrameSegment();
          player.setFrameDirection(direction);
          player.setMediaLiveOff(false);
          player.changeStateRequestAniFrameForFrame(true);
          player.executeFrameSwitch();
        } else {
          player.changeStateRequestAniFrameForFrame(false);
          player.stopFrameSwitch();
        }
      }
    }
  }, [direction]);  

  return (
    <div className='slider-container' style={{width: `${barWidth}px`}}>
      <img 
        className='slider-bar-bg' src={BarTimeslice} alt="bar" 
        style={{
          width: `${barWidth}px`,
          height: `${barHeight}px`
        }}  
      />
      <img
        ref={sliderIconRef} 
        className='slider-icon'
        style={{
          left: `${position}%`,
          marginLeft: `${marginLeft}px`,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
        }}         
        src={IconTimeslice} alt="Icon" 
      />
      <input
        ref={sliderBarRef}
        type='range'
        className='slider-bar-temp'
        step='0.01'
        value={position}
        onChange={onChangeSlider}
        onMouseUp={onMouseUpSlider}
        onTouchEnd={onMouseUpSlider}
        style={{
          height: `${iconSize}px`,
        }}
      />
    </div>
  );
};

export default Timemachine;