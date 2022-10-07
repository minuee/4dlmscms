import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { Option } from '@/components/Input/Select';

interface UserSelectDropdownProps {
  list: Array<any>;
  onClose?: () => void;
  onSelect?: (updatedList: any) => void;
  onSearch?: (e: string | ChangeEvent<any>) => void;
}

type SearchOption = 'email' | 'name';

const UserSelectDropdown: React.FC<UserSelectDropdownProps> = ({
  list,
  onSelect,
  onClose,
}: UserSelectDropdownProps) => {
  const inputRef = useRef<HTMLInputElement>();
  const userListRef = useRef<HTMLDivElement>();

  const [state, setState] = useState({
    isOpen: false,
    inputValue: list,
  });

  const [searchOption, setSearchOption] = useState<SearchOption>('name');

  // 유저리스트 열기/닫기
  const handleOpenUserList = (p: 'open' | 'close') => {
    setState((prevState) => {
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

  useEffect(() => {
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 인풋을 클릭하면 dropdown을 오픈한다.
  const handleInputClick = (e) => {
    e.stopPropagation();

    handleOpenUserList('open');
  };

  // 필터링 기준을 바꾼다.
  const changeSearchOption = (e) => {
    e.stopPropagation();
    const value: SearchOption = e.target.value;
    // console.log(e.target.value);
    setSearchOption(value);
  };

  useEffect(() => {
    // inputRef.current && console.log(inputRef.current.value);
    const value = inputRef.current.value;
    // console.log('value: ', value);
    // console.log('searchOption: ', searchOption);

    const filteredList = list.filter((item) =>
      item[searchOption].toLowerCase().includes(value)
    );
    // console.log('filteredList: ', filteredList);

    setState({
      inputValue: filteredList,
      isOpen: true,
    });
  }, [searchOption]);

  // 유저 선택
  const handleSelectUser = (user, e) => {
    onSelect(user);
    // 인풋창에 값을 셋팅해준다.
    inputRef.current.value = searchOption === 'name' ? user.name : user.email;
    // 아래 나오는 유저 리스트 닫아주기
    handleOpenUserList('close');

    // onClose();
    // const value = e.target.value;
    // console.log('value: ', value);
  };

  // 입력 값의 텍스트를 지닌 유저만 보여준다.
  const filterList = (e) => {
    // console.log('option: ', searchOption);
    // const value = e.target.value;
    const value = inputRef.current.value;

    const filteredList = list.filter((item) =>
      item[searchOption].toLowerCase().includes(value)
    );

    // console.log('filteredList: ', filteredList);
    setState((prevState) => {
      return { ...prevState, inputValue: filteredList };
    });

    if (!state.isOpen) handleOpenUserList('open');

    // onSelect(filteredList);
  };

  return (
    <div className={'intro-y mt-4 col-span-12 sm:col-span-12'}>
      <div className='flex w-full input-group'>
        <select
          className='form-control form-select !w-max'
          name='userSelect'
          value={searchOption}
          onChange={(e) => changeSearchOption(e)}
        >
          <Option label='name' value='name'>
            name
          </Option>
          <Option label='email' value='email'>
            email
          </Option>
        </select>
        <input
          ref={inputRef}
          type='text'
          className='flex-1 form-control'
          autoComplete='off'
          //   label='Choose Manager'
          placeholder='search...'
          name='manager'
          onClick={(e) => handleInputClick(e)}
          onChange={(e) => filterList(e)}
        />
      </div>

      {/* user list */}
      {state.isOpen && state.inputValue.length > 0 && (
        <div
          id='container'
          className='dropdown multi-select__dropdown--full'
          ref={userListRef}
        >
          <ul className='container form-control py-3 px-4 block'>
            {state.inputValue.map((user) => {
              return (
                <li
                  key={user._id}
                  id={user._id}
                  className='p-2 flex items-center'
                  onClick={(e) => handleSelectUser(user, e)}
                >
                  name: {user.name}, email: {user.email}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserSelectDropdown;
