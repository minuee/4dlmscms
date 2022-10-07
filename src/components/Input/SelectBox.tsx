import React, { useEffect } from 'react';

interface SelectBoxProps {
  data: Array<any>;
  dataCopy: Array<any>;
  onChangeCheck: (any) => void;
  // design?: "inputGroupHeader"|"normal"
}

const SelectBox: React.FC<SelectBoxProps> = ({
  data = [],
  dataCopy = [],
  onChangeCheck,
}: SelectBoxProps) => {
  // useEffect(() => {
  //   console.log('selectbox props data: ', data);
  // }, []);

  const handleChange = (e) => {
    const elementKey = e.target.name;

    const elementState = e.target.checked;

    const changedItemIndex = dataCopy.findIndex(
      (item) => item.name === elementKey
    );
    const updatedItem = {
      ...dataCopy[changedItemIndex],
      isSelected: elementState,
    };
    const newData = [...dataCopy];
    newData[changedItemIndex] = updatedItem;
    onChangeCheck(newData);
  };

  return (
    // options 역할을 하는 컴포넌트
    <div className='container form-control py-3 px-4 block'>
      {data.map(({ name, isSelected }, index) => {
        return (
          <div key={name} className='p-2 flex items-center'>
            <input
              id={index.toString()}
              className='mr-2 cursor-pointer'
              type='checkbox'
              name={name}
              checked={!!isSelected}
              onChange={(e) => handleChange(e)}
            />
            <label className='cursor-pointer' htmlFor={index.toString()}>
              {name}
            </label>
          </div>
        );
      })}
    </div>
  );
};

export default SelectBox;
