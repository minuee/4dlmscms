import React, {
  ChangeEvent,
  useLayoutEffect,
  useState,
  useRef,
  useEffect,
} from 'react';
import styled from 'styled-components';

interface TwoPointsSliderProps {
  min: number;
  max: number;
  onChange?: (e: string | ChangeEvent<any>) => void;
  minName: string;
  maxName: string;
}

const thumbsize = 14;

const TwoPointsSlider: React.FC<TwoPointsSliderProps> = ({
  min,
  max,
  onChange,
  minName,
  maxName,
}: TwoPointsSliderProps) => {
  const elemRef = useRef<HTMLInputElement | null>(null);
  const [avg, setAvg] = useState<number>((min + max) / 2);
  const [minVal, setMinVal] = useState<number>(avg);
  const [maxVal, setMaxVal] = useState<number>(avg);
  const [width, setWidth] = useState<number>(0);

  //   화면의 너비에 맞춰 슬라이더 너비를 맞추기 위한 코드
  useEffect(() => {
    handleResize();
  }, [elemRef, width]);

  const handleResize = () => {
    if (!elemRef) return;
    const screenWidth = elemRef.current.offsetWidth;
    setWidth(screenWidth);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      // cleanup
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const minWidth =
    thumbsize + ((avg - min) / (max - min)) * (width - 2 * thumbsize);
  const minPercent = Math.ceil(((minVal - min) / (avg - min)) * 100);
  const maxPercent = Math.ceil(((maxVal - avg) / (max - avg)) * 100);
  const styles = {
    min: {
      width: minWidth,
      left: 0,
      '--minRangePercent': `${minPercent}%`,
    },
    max: {
      width: thumbsize + ((max - avg) / (max - min)) * (width - 2 * thumbsize),
      left: minWidth,
      '--maxRangePercent': `${maxPercent}%`,
    },
  };

  useLayoutEffect(() => {
    setAvg((maxVal + minVal) / 2);
  }, [minVal, maxVal]);

  //   console.log(maxVal, avg, min, max, maxPercent);

  const changeValue = (e, type: 'min' | 'max', OnChange) => {
    type === 'min'
      ? setMinVal(Number(e.target.value))
      : setMaxVal(Math.ceil(Number(e.target.value)));

    OnChange(e);
  };

  return (
    <>
      <div
        ref={elemRef}
        className='min-max-slider'
        data-legendnum='2'
        data-rangemin={min}
        data-rangemax={max}
        data-thumbsize={thumbsize}
        data-rangewidth={width}
      >
        <input
          id='min'
          className='min'
          style={styles.min}
          name={minName}
          type='range'
          step={1}
          min={min}
          max={avg}
          value={minVal}
          // onChange={({ target }) => setMinVal(Number(target.value))}
          onChange={(e) => changeValue(e, 'min', onChange)}
        />
        <input
          id='max'
          className='max'
          style={styles.max}
          name={maxName}
          type='range'
          step={1}
          min={avg}
          max={max}
          value={maxVal}
          // onChange={({ target }) => setMaxVal(Number(target.value))}
          onChange={(e) => changeValue(e, 'max', onChange)}
        />
      </div>
      <div className='flex items-center justify-between'>
        <label htmlFor='min'>Minimum price: {minVal}</label>
        <label htmlFor='max'>Maximum price: {maxVal}</label>
      </div>
    </>
  );
};
export default TwoPointsSlider;
