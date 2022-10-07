import React, { FC, memo } from 'react';
import tw from 'tailwind-styled-components';
import styled from 'styled-components'

import { ReactComponent as Loader } from 'imgs/loader/oval.svg';

const SpecialContainer = styled.div`
  background-color: ${p => p.color}
`;

const Container = tw(SpecialContainer)`
    flex
    items-center
    justify-center
    w-full
    h-screen
`;

export interface PageLoaderProps {
  color?: string;
}

export const PageLoader: FC<PageLoaderProps> = memo((props) => {
  const { color = "#4092de" } = props;
  return (
    <Container>
      <Loader />
    </Container>
  )
});
