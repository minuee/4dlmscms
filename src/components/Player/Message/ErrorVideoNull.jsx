import React from 'react';
import iconNullClip from 'imgs/player/icon_null_clip.svg';

const ErrorVideoNull = ({isShow}) => {
  return (
    <div className={`absolute z-40 w-full top-14 sm:top-28 md:top-1/3 ${isShow ? "" : "hidden"}`}>
      <div className="flex flex-col justify-center items-center">
        <img src={iconNullClip} alt="null" style={{width: '15vw', height: '8vh'}}/>
        <div className="flex flex-col items-center text-white font-openSans font-normal" style={{fontSize: '1.5vw'}}>
          <p>There seems to be a problem with the video.</p>
          <p>Please watch another video.</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorVideoNull;