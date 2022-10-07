declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const value: any;
  export default value;
}
declare module '*.jpg' {
  const value: any;
  export default value;
}

// allSettled에 value에 접근할 수 없어서 선언한 타입
declare interface PromiseConstructor {
  allSettled(
    promises: Array<Promise<any>>
  ): Promise<
    Array<{ status: 'fulfilled' | 'rejected'; value?: any; reason?: any }>
  >;
}

interface PromiseFulfilledResult<T> {
  status: 'fulfilled';
  value: T;
}

interface PromiseRejectedResult {
  status: 'rejected';
  reason: any;
}

// type PromiseSettledResult<T> =
//   | PromiseFulfilledResult<T>
//   | PromiseRejectedResult;
