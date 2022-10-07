import React, { useState, useContext } from 'react';
import { PlayerContext  } from 'comp/Player/HlsPlayer';
import btnPlay from 'imgs/player/icon_play_portrait_normal.svg';
import btnPause from 'imgs/player/icon_pause_portrait_normal.svg';

const BtnPlayNPause = () => {

  window.callByInIsPlaying = (state) => {
    setIsPlaying(state);
  }

  const playerContext = useContext(PlayerContext); 

  const [isPlaying, setIsPlaying] = useState(false);  

  const setPlaybackState = () => {
    const player = playerContext.player;
    if(player && player.getPrevHlsInfo()) {
      const playing = !isPlaying;
      if(player.checkStreamState()) { 
        if(playing) {
          player.play();
        } else {
          player.pause();
        }
        setIsPlaying(playing);
      }
    } else {
      console.log('The player is not ready yet!!');
    }
  }

  return (
    <button className="btn-controller" onClick={setPlaybackState}>
      <img src={ isPlaying ? btnPause : btnPlay} alt="playback"/>
    </button>
  );
};

export default BtnPlayNPause;