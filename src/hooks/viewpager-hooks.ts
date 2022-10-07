import { useState, useCallback } from 'react';

export const useViewpager = () => {
  const [viewPager, setViewPager] = useState<string>('');

  const setViewPagerHandler = useCallback((className, id) => {
    const viewPagerTab = document.querySelectorAll(`.${className}_tab`);
    const viewPagerContent = document.querySelectorAll(`.${className}_content`);
    setViewPager(id);

    // 선택한 탭에 액티브 css 클래스 줌(언더라인 효과)
    for (let i = 0; i < viewPagerTab.length; i++) {
      viewPagerTab[i].classList.remove('active');
      viewPagerContent[i].classList.add('hidden');
    }

    // 선택한 뷰만 보여줌
    document.querySelector(`#${id}`).classList.add('active');
    document.querySelector(`#${id}_content`).classList.remove('hidden');
    document.querySelector(`#${id}_content`).classList.remove('hidden');
  }, []);

  return { viewPager, setViewPagerHandler };
};
