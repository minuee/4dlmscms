import React, { useState, useEffect, useContext } from 'react';
import { PlayerContext  } from '@/container/Player/Video/VideoPlayer';
import iconRefreshPlayer from 'imgs/controller/icon_refresh_player.svg';

const BtnReplay = () => {

  const playerContext = useContext(PlayerContext); 

  const [iconSize, setIconSize] = useState(88);  
  
  const maxIconSize = 88;

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.addEventListener('resize', handleResize);
    }
  }, []);

  const handleResize = () => {
    if(playerContext && playerContext.playerContainer) {
      const container = playerContext.playerContainer.current;
      if(container && container.offsetHeight && container.offsetHeight !== 0) {
        let resizeRatio = container.offsetHeight  / 600;
        if(resizeRatio > 1) resizeRatio = 1;
        setIconSize(maxIconSize*resizeRatio);
      }
    }
  };

  const onClickVideoReplay = () => {
    const player = playerContext.player;
    if(player && player.getPrevHlsInfo()) {
      if(player.checkStreamState()) { 
        player.play();
        window.callByInBtnReplay(false);
        window.callByInIsPlaying(true);
      }
    } else {
      console.log('The player is not ready yet!!');
    }
  }

  return (
    <button className="btn-controller ab-img-center" onClick={onClickVideoReplay}>
      <img 
        src={iconRefreshPlayer}
        style={{                
          width: `${iconSize}px`,
          height: `${iconSize}px`,          
        }}
        alt="replay"
      />
    </button>
  );
};

export default BtnReplay;