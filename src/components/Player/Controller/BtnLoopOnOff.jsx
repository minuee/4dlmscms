import React, { useState, useContext } from 'react';
import { PlayerContext  } from 'comp/Player/HlsPlayer';
import btnLoopOn from 'imgs/player/icon_loop_on_portrait_normal.svg';
import btnLoopOff from 'imgs/player/icon_loop_off_portrait_normal.svg';

const BtnLoopOnOff = () => {

  window.callByInIsLoop = (state) => {
    setIsLoop(state);
  }

  const playerContext = useContext(PlayerContext); 

  const [isLoop, setIsLoop] = useState(false);  

  const setLoopState = () => {
    const player = playerContext.player;
    if(player) {
      const loop = !isLoop;
      
      setIsLoop(loop);      
    } else {
      console.log('The player is not ready yet!!');
    }
  }

  return (
    <button className="btn-controller mt-2 mr-2" onClick={setLoopState}>
      <img src={ isLoop ? btnLoopOff : btnLoopOn} alt="loop"/>
    </button>
  );
};

export default BtnLoopOnOff;