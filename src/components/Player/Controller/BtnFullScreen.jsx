import React, { useEffect, useState, useContext } from 'react';
import { PlayerContext  } from 'comp/Player/HlsPlayer';

import btnMax from 'imgs/player/icon_maximize_normal.svg';
import btnMin from 'imgs/player/icon_minimize_normal.svg';

const BtnFullScreen = () => {
 
  window.callBySetBtnFullScreenByESC = (value) => {
    setFullScreenStateByESC(value);
  }

  const playerContext = useContext(PlayerContext);
  const [isFull, setIsFull] = useState(false);

  const setFullScreenState = () => {
    const player = playerContext.player;
    let showFullScreen = !isFull;
    setIsFull(showFullScreen);

    if(showFullScreen) {
      player.showFullScreen(playerContext.playerContainer.current);      
    } else {
      player.showNormalScreen();     
    }
  }

  const setFullScreenStateByESC = (value) => {
    setIsFull(value);
  }

  useEffect(() => {
    const player = playerContext.player;
    if(player) {
      if(isFull) {
        player.showFullScreen(playerContext.playerContainer.current);
      } else {
        player.showNormalScreen();
      }
    }
  }, [playerContext.player]);


  return (
    <button className="btn-controller" onClick={setFullScreenState}>
      <img src={ isFull ? btnMin : btnMax} alt="FullScreen"/>
    </button>
  );
};

export default BtnFullScreen;