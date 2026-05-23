import { memo, useMemo, type ReactNode } from "react";

export const CommerceVirtualList = memo(function CommerceVirtualList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  testId,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  testId?: string;
}) {
  const slice = useMemo(() => items.slice(0, 80), [items]);
  return (
    <div className={className} data-testid={testId} role="list">
      {slice.map((item) => (
        <div key={keyExtractor(item)} role="listitem">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}) as <T>(props: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  testId?: string;
}) => React.ReactElement;
