import React, { useEffect, useRef, useState, createContext, useCallback } from "react";
import { Spinner } from 'reactstrap';
import { FDPlayer } from "./FDPlayer/fdplayer";
import { NormalPlayer } from "./FDPlayer/hlsplayer";

import Controller from './Controller';
import Timeslice from './Joystick/Timeslice';
import Timemachine from './Joystick/Timemachine';
import ErrorNetwork from './Message/ErrorNetwork';
import ErrorVideoNull from './Message/ErrorVideoNull';
import BtnReplay from "./Controller/BtnReplay";

import imgNullPlayer from '@/assets/images/player/img_null_player.svg';

declare global {
  interface Window {
    callByInLoadingBar: any;
    callByInPlayerReady: any;
    callByInBtnReplay: any;
    callByLevel: any;
    callByError: any;
  }
}

interface PlayerContextProps {
  player: any,
  utils: any, 
  playerContainer: React.MutableRefObject<HTMLDivElement | null>, 
  isScreenFull: boolean
}

export const PlayerContext = createContext<PlayerContextProps | null>(null);

function HlsPlayer({url, videoChannel, defaultChannel, cmsVideoType, isShowModal}) {

  const [player, setPlayer] = useState<any>();
  const [utils, setUtils] = useState<any>();
  const [isScreenFull, setIsScreenFull] = useState(false);
  const [isScreenHeight, setIsScreenHeight] = useState(false);

  const [isAnimate, setIsAnimate] = useState<boolean>(true);
  const [isShowImgNull, setIsShowImgNull] = useState<boolean>(true);
  const [isShowReplay, setIsShowReplay] = useState<boolean>(false);
  const [isLoadingBar, setIsLoadingBar] = useState(true);
  const [isShowController, setIsShowController] = useState<boolean>(false);
  const [isErrorMsgNetwork, setIsErrorMsgNetwork] = useState(false);
  const [isErrorMsgMovieNull, setIsErrorMsgMovieNull] = useState(false);
  const [isShowJoystick, setIsShowJoystick] = useState<boolean>(false);

  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);

  //const [videoUrl, setVideoUrl] = useState<string>();
  //const [videoChannel, setVideoChannel] = useState<number>(0);
  const [videoType, setVideoType] = useState<string>('single');

  const playerContainer = useRef<HTMLDivElement>(null);

  const maxVideoScreenWidth = 1066;
  const maxVideoScreenHeight = 600;

  window.callByInPlayerReady = (state) => {
    if(state) {
      loadPlayer();
    }
  }

  window.callByInBtnReplay = (state) => {
    setIsShowReplay(state);
  }

  window.callByInLoadingBar = (state) => {
    setIsLoadingBar(state);
  }

  window.callByLevel = (level) => {
    if(level > -1) {
      player.updateLevelManual(level);
    } else {
      player.updateLevelAuto();
    }
  }

  window.callByError = (msg) => {
    console.log(msg);    
  }

  const createVideoPlayer = useCallback(async () => {
    let videoPlayer;
    let videoType;

    try {
      if(player) {
        player.destroyHLS();
      }

      if(videoChannel > 2 && cmsVideoType === 'multi' ) {
        videoPlayer = await new FDPlayer();
        videoType = 'multi';             
      } else {  
        videoPlayer = await new NormalPlayer(); 
        videoType = 'single';
      }

      if (videoPlayer) {
        setPlayer(videoPlayer);
        setVideoType(videoType);
        setUtils(videoPlayer.getPlayerUtils);
      }
    } catch (err) {
      console.log(err);
    }
  }, [player]);

  const loadPlayer = () => {
    if(url) {      
      if(videoType !== 'single') {
        setIsShowJoystick(true);
      }
      setIsShowController(true);
    }
  }

  const handleResize = () => {
    const screenWidth = window.innerWidth > maxVideoScreenWidth ? maxVideoScreenWidth : window.innerWidth;
    let resizeRatio = screenWidth  / maxVideoScreenWidth;
    setScreenWidth(maxVideoScreenWidth*resizeRatio*0.7);
    setScreenHeight(maxVideoScreenHeight*resizeRatio*0.7);    
  };

  useEffect(() => {   
    
    if(url) {
      setIsShowJoystick(false);
      setIsShowController(false);
      createVideoPlayer();
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.addEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if(playerContainer && playerContainer.current) {
      handleResize();
    }
  }, [playerContainer]);

  useEffect(() => {
    if(isShowModal) {
      handleResize(); 
      
      if(player) {
        if(videoChannel > 2 && cmsVideoType === 'multi') {
          player.openVideo(
            url, 
            videoChannel, 
            defaultChannel,
            1,
            videoChannel
          );
        } else {
          player.setSource(null, url);
        }
      }
    } else {
      if(player) {
        // player.stopLoad();
        // player.stop();
        player.clearVideo();
        //player.stopLoad();
        //player.destroyHLS();
        //setPlayer(null);
      }
    }   
  }, [isShowModal])

  return (
    <PlayerContext.Provider value={{player, utils, playerContainer, isScreenFull}}>
      <div 
        id="playerContainer" 
        ref={playerContainer} 
        className={`relative`} 
        style={{width:`${screenWidth}px`, height:`${screenHeight}px`, margin: 'auto'}}        
      >
        <div className={`absolute z-30 w-full flex justify-center top-1/2 ${isLoadingBar ? "" : "hidden"}`}>
          <Spinner color="light" />
        </div>       
        <ErrorNetwork isShow={isErrorMsgNetwork} />
        <ErrorVideoNull isShow={isErrorMsgMovieNull} />   
        {isShowJoystick &&
          <div className={`absolute z-30 w-full bottom-24 sm:bottom-24 xl:bottom-32 `}>
            <div className="flex justify-between w-full px-3 sm:px-5 xl:px-10" >          
              <Timeslice />
              <Timemachine />
            </div>
          </div> 
        }             
        <Controller />        
        <div className="flex">
            <div id="video-player"></div>              
        </div>
      </div>
    </PlayerContext.Provider>
  )
};

export default HlsPlayer;

