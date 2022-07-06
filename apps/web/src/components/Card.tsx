type CardProps = {
  children?: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div className="runescape-panel shadow-lg">
      <div className="p-3">{children}</div>
    </div>
  );
};
