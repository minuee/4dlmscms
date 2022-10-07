import React from 'react';
import iconNetworkError from 'imgs/player/icon_network_error.svg';

const ErrorNetwork = ({isShow}) => {
  return (
    <div className={`absolute z-40 w-full top-14 sm:top-28 md:top-1/3 ${isShow ? "" : "hidden"}`}>
      <div className="flex flex-col justify-center items-center">
        <img src={iconNetworkError} alt="null" style={{width: '15vw', height: '8vh'}}/>
        <div className="flex flex-col items-center text-white font-openSans font-normal" style={{fontSize: '1.5vw'}}>
          <p>A network error has occurred.</p>
          <p>Please try again.</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorNetwork;