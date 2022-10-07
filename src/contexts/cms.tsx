import React, { createContext, useState } from 'react';

type CMSProps = {
  step: number;
  updateStep: (step: number) => void;
  isUpdate: boolean;
  changeIsUpdate: (bool: boolean) => void;
};

export const CMSContext = createContext({} as CMSProps);

const CMSProvider = (props: any) => {
  const [step, setStep] = useState<number>(0);
  const [isUpdate, setIsUpdate] = useState<boolean>(false);

  const updateStep = (step: number) => { setStep(step); };
  const changeIsUpdate = (bool: boolean) => { setIsUpdate(bool); };

  return (
    <CMSContext.Provider value={{ step, updateStep, isUpdate, changeIsUpdate }}>
      {props.children}
    </CMSContext.Provider>
  );
};

export default CMSProvider;
