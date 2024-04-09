export function StatusLayout(props: { children: React.ReactNode }) {
  return (
    <div className="container flex flex-col items-center justify-center space-y-2 pt-48">
      {props.children}
    </div>
  );
}

export function StatusTitle(props: { children: React.ReactNode }) {
  return <p className="text-5xl font-bold text-primary">{props.children}</p>;
}

export function StatusMessage(props: { children: React.ReactNode }) {
  return <p className="pb-8 text-primary-foreground">{props.children}</p>;
}
