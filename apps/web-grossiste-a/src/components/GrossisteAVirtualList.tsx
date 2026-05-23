import { memo, useMemo, type ReactNode } from "react";

export const GrossisteAVirtualList = memo(function GrossisteAVirtualList<T>({
  items,
  renderItem,
  keyExtractor,
  testId,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  testId?: string;
}) {
  const slice = useMemo(() => items.slice(0, 100), [items]);
  return (
    <div className="ga-virtual-list" data-testid={testId} role="list">
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
  testId?: string;
}) => React.ReactElement;
