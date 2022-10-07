import React from 'react';
import { InputProps } from './InputText';

interface SliderProps extends Partial<InputProps> {
  sliderType?: 'normal' | 'twoPointsChild';
  step?: number;
  min: number;
  max: number;
  values?: any;
}

const Slider: React.FC<SliderProps> = React.memo((props: SliderProps) => {
  return (
    <>
      <div className='rounded-sm capitalize'>
        <label className='font-bold' htmlFor={props.name}>
          {props.label}
        </label>
        {/* <div> */}
        <input
          type='range'
          min={props.min}
          max={props.max}
          step={props.step | 0.5}
          name={props.name}
          value={props.value}
          onChange={props.onChange}
        />
        {/* </div> */}
      </div>
    </>
  );
});

export default Slider;
