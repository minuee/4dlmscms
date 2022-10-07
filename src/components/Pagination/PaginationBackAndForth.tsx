import React, { useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';

let isMonted = false;

interface PaginationProps {
  currentPage?: number;
  onClickNext: (p: number) => void;
  onClickPrev: (p: number) => void;
}

// 다음버튼
const Next = ({ onChange }) => {
  const { t } = useTranslation();

  return (
    <button onClick={() => onChange('next')} className='pagination__only__next'>
      <span className=''>{t('list:next')}</span>
    </button>
  );
};

// 이전 버튼
const Previous = ({ onChange }) => {
  const { t } = useTranslation();

  return (
    <button onClick={() => onChange('prev')} className='pagination__only__prev'>
      <span className=''>{t('list:previous')}</span>
    </button>
  );
};

///////////////////
const Pagination: React.FC<PaginationProps> = memo((props: PaginationProps) => {
  const { onClickPrev, onClickNext } = props;

  // mount됐는지 여부 확인
  useEffect(() => {
    if (isMonted === false) {
      isMonted = true;
    }
  }, []);

  return (
    <div className='intro-y col-span-12 flex flex-wrap sm:flex-row sm:flex-nowrap items-center justify-center'>
      <nav aria-label='Pagination' className='pagination-wrapper'>
        <Previous onChange={onClickPrev} />
        <Next onChange={onClickNext} />
      </nav>
    </div>
  );
});
export default Pagination;
