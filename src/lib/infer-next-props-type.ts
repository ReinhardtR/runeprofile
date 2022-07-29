// type GetSSRResult<TProps> =
//   //
//   { props: TProps } | { redirect: any } | { notFound: true };

// type GetSSRFn<TProps extends any> = (
//   args: any
// ) => Promise<GetSSRResult<TProps>>;

// export type InferSSRProps<TFn extends GetSSRFn<any>> = TFn extends GetSSRFn<
//   infer TProps
// >
//   ? NonNullable<TProps>
//   : never;

type AsyncReturnType<T> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : any;

type Filter<T, U> = T extends U ? T : never;

export type InferNextProps<T> = Filter<
  AsyncReturnType<T>,
  { props: any }
>["props"];
