import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from 'comp/Button/Button';
import { classNames } from '@/utils/commonFn';

interface SearchModalProps {
  isShow: boolean;
  title: string;
  buttonOkText: string;
  onClick?: () => void;
  onClose?: () => void;
  topCloseButton?: boolean;
  bottomCloseButton?: boolean;
}

const SearchModal: React.FC<SearchModalProps & WithChildren> = (
  props: SearchModalProps & WithChildren
) => {
  return ReactDOM.createPortal(
    <>
      {/* <!-- BEGIN: Modal Content --> */}
      <div
        id='search-modal'
        className={classNames`${
          props.isShow ? 'search-modal' : 'invisible-and-take-no-space'
        }`}
        tab-index='-1'
      >
        <div className='modal-dialog'>
          <div className='modal-content'>
            {/* <!-- BEGIN: Modal Header --> */}
            <div className='modal-header'>
              <h2 className='capitalize font-medium text-base mr-auto'>
                {props.title}
              </h2>

              {props.topCloseButton && (
                <button onClick={props.onClose}>X</button>
              )}
            </div>
            {/* <!-- END: Modal Header --> */}
            {/* <!-- BEGIN: Modal Body --> */}
            <div className='modal-body'>{props.children}</div>
            {/* <!-- END: Modal Body --> */}
            {/* <!-- BEGIN: Modal Footer --> */}
            <div className='modal-footer btns-wrapper'>
              {props.bottomCloseButton && (
                <Button outline='btn-outline-secondary' onClick={props.onClose}>
                  Cancel
                </Button>
              )}
              <Button
                type='button'
                color='btn-primary'
                onClick={props.onClick ? props.onClick : props.onClose}
              >
                {props.buttonOkText}
              </Button>
            </div>
            {/* <!-- END: Modal Footer --> */}
          </div>
        </div>
      </div>
      {/* <!-- END: Modal Content --> */}
    </>,

    document.getElementById('modal-hook')
  );
};
export default SearchModal;
