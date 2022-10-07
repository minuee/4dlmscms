import React, { useLayoutEffect, useEffect, useState, memo } from 'react';

// TODO: 디자인 커스텀 추가하기

let isMonted = false;

interface PaginationProps {
  //   hasPrev?: boolean;
  //   hasNext?: boolean;
  // 중간에 ...버튼이 있는지 여부
  //   hasEllipsis?: boolean;
  // 위 세 개는 여기서 자체적으로 결정해야 하지 않을까?
  //   children: ReactNode;
  currentPage?: number;
  totalPage: number;
  pagesPerBlock: number;
  itemsPerPage?: number;
  onClick: (p: number) => void;
}
type DirectionType = 'next' | 'prev';
// 페이징 각 아이템
type PageItemProps = {
  pageTo: number;
  // onClick?: (p: number) => void;
};
///////////////////
const Pagination: React.FC<PaginationProps> = memo((props: PaginationProps) => {
  // console.log('pagination');
  // console.log('토탈페이지: ', props.totalPage);

  const totalBlocks = Math.ceil(props.totalPage / props.pagesPerBlock);
  // console.log('totalBlocks: ', totalBlocks);

  const [currentPage, setCurrentPage] = useState<number>(props.currentPage);
  const [currentBlock, setCurrentBlock] = useState<number>(1);
  const [blockStartPage, setBlockStartPage] = useState<number>(1);
  const [blockEndPage, setBlockEndPage] = useState<number>(props.pagesPerBlock);
  const [blockArray, setBlockArray] = useState<Array<number>>([]);

  // 블록안의 페이지 만큼 미리 array를 만들어둔다.
  // ...Array(props.pagesPerBlock),
  // 기존의 위의 코드를 사용하여 만들면 [0,0,0...]이런식으로 들어가서
  // UI렌더링 시 idx를 키값으로 넘겼어야 했음
  useLayoutEffect(() => {
    const arr = [];
    // pagesPerBlock 수에 맞는 UI를 만들기 위해 해당 수를 길이로 가지는 배열을 만든다.
    for (let index = 0; index < props.pagesPerBlock; index++) {
      arr.push(index);
    }
  }, []);

  // 6페이지(2번째 블록)에서 뒤로가기 해서 1페이지(1번째 블록)으로 가는 등
  // 클릭이 아닌 뒤로가기, 앞으로 가기 등의 이벤트로 블록 이동 시 제대로
  // 블록이 변경되도록 하는 코드
  useEffect(() => {
    if (!props.currentPage || props.currentPage === currentPage) return;
    // console.log(props.currentPage);
    // console.log({ currentPage });
    // console.log({ currentBlock });
    // console.log({ blockStartPage });
    // console.log({ blockEndPage });

    // 현재 페이지가 어디 블록에 속하는지 알아 내서 그 블록으로 이동
    const currBlock = Math.ceil(props.currentPage / props.pagesPerBlock);
    // console.log({ currBlock });
    setCurrentPage(props.currentPage);
    setCurrentBlock(currBlock);
  }, [props.currentPage]);

  // 페이지 전환
  const changePage = ({ pageTo }) => {
    setCurrentPage(pageTo);
    props.onClick(pageTo);
  };

  const changeCurrentBlock = (direction: DirectionType) => {
    // 다음버튼을 눌렀을 경우
    if (direction === 'next') {
      setCurrentBlock((prev) =>
        prev === totalBlocks ? totalBlocks : prev + 1
      );
    } else {
      setCurrentBlock((prev) => (prev === 1 ? 1 : prev - 1));
    }
  };

  //   페이지 블록도 바꿔준다.
  useEffect(() => {
    const newArray = [];
    for (let index = blockStartPage; index <= blockEndPage; index++) {
      // if (index > props.totalPage) return;
      newArray.push(index);
    }

    setBlockArray(newArray);
    // console.log({ currentPage });
    // console.log({ blockStartPage });
    // console.log({ blockEndPage });

    // 현재 페이지가 blockEndPage 보다 크면 전 블록으로 간 것
    // 현재 페이지가  blockStartPage보다 작으면 다음 블록으로 간 것
    if (currentPage > blockEndPage) {
      changePage({ pageTo: blockEndPage });
    } else if (currentPage < blockStartPage) {
      changePage({ pageTo: blockStartPage });
    }
    // else {
    // }
  }, [blockEndPage, blockStartPage]);

  // 페이징 블록 시작, 끝 페이지 처리
  useEffect(() => {
    setBlockStartPage(
      currentBlock * props.pagesPerBlock - (props.pagesPerBlock - 1)
    );
    setBlockEndPage(
      currentBlock * props.pagesPerBlock >= props.totalPage
        ? props.totalPage
        : currentBlock * props.pagesPerBlock
    );

    // console.clear();
  }, [currentBlock]);

  // mount됐는지 여부 확인
  useEffect(() => {
    if (isMonted === false) {
      isMonted = true;
    }
  }, []);

  // 다음버튼
  const Next = () => {
    return (
      <button
        onClick={() => changeCurrentBlock('next')}
        className='pagination-next'
      >
        <span className='sr-only'>Next</span>
        <svg
          className='h-5 w-5'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 20 20'
          fill='currentColor'
          aria-hidden='true'
        >
          <path
            fillRule='evenodd'
            d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
            clipRule='evenodd'
          />
        </svg>
      </button>
    );
  };

  // 이전 버튼
  const Previous = () => {
    return (
      <button
        onClick={() => changeCurrentBlock('prev')}
        className='pagination-prev'
      >
        <span className='sr-only'>Previous</span>
        <svg
          className='h-5 w-5'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 20 20'
          fill='currentColor'
          aria-hidden='true'
        >
          <path
            fillRule='evenodd'
            d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
            clipRule='evenodd'
          />
        </svg>
      </button>
    );
  };

  const PageItem: React.FC<PageItemProps> = (pageTo: PageItemProps) => {
    return (
      <button
        onClick={() => changePage(pageTo)}
        className={
          currentPage === pageTo.pageTo ? `pagination-current` : `pagination`
        }
      >
        {pageTo.pageTo}
      </button>
    );
  };

  return (
    <div className='intro-y col-span-12 flex flex-wrap sm:flex-row sm:flex-nowrap items-center justify-center'>
      <nav aria-label='Pagination' className='pagination-wrapper'>
        <Previous />
        {blockArray.map((n, index) => {
          return <PageItem key={n} pageTo={n} />;
        })}
        <Next />
      </nav>
    </div>
  );
});
export default Pagination;
