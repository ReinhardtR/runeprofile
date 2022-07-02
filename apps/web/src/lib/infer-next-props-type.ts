type GetSSRResult<TProps> =
  //
  { props: TProps } | { redirect: any } | { notFound: true };

type GetSSRFn<TProps extends any> = (
  args: any
) => Promise<GetSSRResult<TProps>>;

export type InferSSRProps<TFn extends GetSSRFn<any>> = TFn extends GetSSRFn<
  infer TProps
>
  ? NonNullable<TProps>
  : never;
