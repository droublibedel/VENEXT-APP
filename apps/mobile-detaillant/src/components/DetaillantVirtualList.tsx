import { memo, useMemo, type ReactNode } from "react";

type Props<T> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  maxHeight?: number;
  testId?: string;
};

export const DetaillantVirtualList = memo(function DetaillantVirtualList<T>({
  items,
  renderItem,
  keyExtractor,
  maxHeight = 440,
  testId,
}: Props<T>) {
  const slice = useMemo(() => items.slice(0, 80), [items]);

  return (
    <div className="detaillant-virtual-list" data-testid={testId} style={{ maxHeight }} role="list">
      {slice.map((item) => (
        <div key={keyExtractor(item)} role="listitem">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}) as <T>(props: Props<T>) => React.ReactElement;
