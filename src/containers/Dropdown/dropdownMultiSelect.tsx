import React, { useState, useEffect, ChangeEvent, useRef } from 'react';

import { FormikErrors } from 'formik';

import { classNames } from '@/utils/commonFn';

import MultiSelectBox from 'comp/Input/SelectBox';

import { Option } from '@/components/Input/Select';

type SearhOption = {
  name: string;
  value: string | number;
};
interface DropdownProps {
  name?: string;
  list: Array<any>;
  onClose?: () => void;
  onClick?: (e) => void;
  onSelect?: (updatedList: any) => void;
  onSearch?: (e: string | ChangeEvent<any>) => void;
  design?: 'inputGroupHeader' | 'normal';
  listLabel?: string;
  reload?: boolean | number;
  errMsg?: string | string[] | FormikErrors<any> | FormikErrors<any>[];
  searchOptions?: SearhOption[];
}

//TODO: 어떤 식으로 보여줄지도 받아야 함(예- name: 조남은, email: necho@dlkjfsdljk 이런 형식)
const Dropdown: React.FC<DropdownProps> = ({
  list,
  onSelect,
  design,
  listLabel,
  reload,
  errMsg,
  onClick,
  name,
  searchOptions,
}: DropdownProps) => {
  const inputRef = useRef<HTMLInputElement>();
  const userListRef = useRef<HTMLDivElement>();

  const [selectedItemNames, setSelectedItemNames] = useState({
    isOpen: false,
    inputValue: [...list.filter((country) => country.isSelected === true)],
  });

  const [searchOption, setSearchOption] = useState(searchOptions[0]);
  const [totalList, setTotalList] = useState(list);
  const [totalListCopy, setotalListCopy] = useState(list);
  // const totalListCopy = useRef(list);

  // ul 열기/닫기
  const handleOpenUserList = (p: 'open' | 'close') => {
    setSelectedItemNames((prevState) => {
      return { ...prevState, isOpen: p === 'open' ? true : false };
    });
  };

  // 리스트 외부영역을 클릭하면 유저 리스트를 닫는다.
  const handleClickOutside = ({ target }) => {
    // console.log('target: ', target);
    // if (target.tagName === 'LI') return;
    if (
      (userListRef.current && userListRef.current.contains(target)) ||
      target.tagName === 'LI'
    ) {
      return;
    }
    handleOpenUserList('close');
  };

  // useEffect(() => {
  //   window.addEventListener('click', handleClickOutside);
  //   return () => {
  //     window.removeEventListener('click', handleClickOutside);
  //   };
  // }, []);

  // 인풋을 클릭하면 dropdown을 오픈한다.
  const handleInputClick = (e) => {
    e.stopPropagation();

    handleOpenUserList('open');
    filterList();
  };

  // 필터링/검색 기준을 바꾼다(예: 이메일, 이름 검색).
  const changeSearchOption = (e) => {
    e.stopPropagation();
    const value = e.target.value;
    const option = searchOptions.find((o) => o.value === value);
    setSearchOption(option);
  };

  useEffect(() => {
    const value = inputRef.current.value;

    const filteredList = totalListCopy.filter((item) =>
      item[searchOption.name].toLowerCase().includes(value)
    );
    // console.log('filteredList useEffect: ', filteredList);

    setTotalList(filteredList);
    // setSelectedItemNames({
    //   isOpen: true,
    //   inputValue: filteredList,
    // });
  }, [searchOption]);

  // 유저 선택
  const handleSelectUser = (user, e) => {
    onSelect(user);
    // 인풋창에 값을 셋팅해준다.
    inputRef.current.value =
      searchOption.name === 'name' ? user.name : user.email;
    // 아래 나오는 유저 리스트 닫아주기
    handleOpenUserList('close');

    // onClose();
    // const value = e.target.value;
    // console.log('value: ', value);
  };

  // 입력(검색) 값의 텍스트를 지닌 유저만 보여준다.
  const filterList = () => {
    const value = inputRef.current.value;

    const filteredList = totalListCopy.filter((item) =>
      item[searchOption.name].toLowerCase().includes(value)
    );

    setTotalList(filteredList);

    if (!selectedItemNames.isOpen) handleOpenUserList('open');
  };

  return (
    <div className={'intro-y mt-4 col-span-12 sm:col-span-12'}>
      {/* 선택한 아이템들을 보여준다. */}
      <div
        className={classNames`
              dropdown-multi__wrapper
              intro-x form-control form-select pt-3 px-4 flex flex-wrap mb-1
               ${errMsg && 'has-error'} ${
          selectedItemNames.inputValue.length === 0 &&
          'invisible-and-take-no-space'
        }`}
        onClick={(e) => handleInputClick(e)}
      >
        {/* 선택한 항목을 보여준다. */}
        {selectedItemNames.inputValue.length === 0
          ? null
          : // <span>multi select</span>
            selectedItemNames.inputValue.map((item, index) => {
              return (
                <div
                  key={`
                ${index}${item}`}
                  className='bg-gray-500 self-center rounded-sm shadow-xl w-max px-2 mr-2 text-white cursor-pointer'
                >
                  {item.name}
                </div>
              );
            })}
        {/* test, 길어지면 'ㅇ외 ㅇ개 선택함' 이렇게 보여주는 UI */}
        {/* {selectedItemNames.inputValue.length === 1 ? (
                <span>{selectedItemNames.inputValue[0]} 선택</span>
              ) : selectedItemNames.inputValue.length === 0 ? (
                ''
              ) : (
                <span>
                  {selectedItemNames.inputValue[0]}개 외
                  {selectedItemNames.inputValue.length - 1}개 선택 함
                </span>
              )} */}
      </div>

      <div className='flex w-full input-group'>
        <select
          className='form-control form-select !w-max'
          name='userSelect'
          value={searchOption.value}
          onChange={(e) => changeSearchOption(e)}
        >
          {searchOptions.map((option) => {
            return (
              <Option
                key={option.value}
                label={option.name}
                value={option.value}
              >
                {option}
              </Option>
            );
          })}
        </select>
        <input
          ref={inputRef}
          type='text'
          className='flex-1 form-control'
          autoComplete='off'
          placeholder='search...'
          name='manager'
          onClick={(e) => handleInputClick(e)}
          onChange={(e) => filterList()}
        />
      </div>

      {/* list */}
      {selectedItemNames.isOpen && (
        <div className='dropdown multi-select__dropdown'>
          <MultiSelectBox
            data={totalList}
            dataCopy={totalListCopy}
            onChangeCheck={(updatedList) => {
              setTotalList([...updatedList]);
              setotalListCopy([...updatedList]);
              // totalListCopy.current = [...updatedList];

              setSelectedItemNames({
                inputValue: [
                  ...updatedList.filter((i) => i.isSelected === true),
                ],
                isOpen: false,
              });
              onSelect(updatedList);
            }}
          />
        </div>

        // <div
        //   id='container'
        //   className='dropdown multi-select__dropdown--full'
        //   ref={userListRef}
        // >
        //   <ul className='container form-control py-3 px-4 block'>
        //     {selectedItemNames.inputValue.map((user) => {
        //       return (
        //         <li
        //           key={user._id}
        //           id={user._id}
        //           className='p-2 flex items-center'
        //           onClick={(e) => handleSelectUser(user, e)}
        //         >
        //           {searchOptions[0].name}: {user[searchOptions[1].value]},{' '}
        //           {searchOptions[1].name}: {user[searchOptions[1].value]}
        //         </li>
        //       );
        //     })}
        //   </ul>
        // </div>
      )}
    </div>
  );
};

export default Dropdown;
