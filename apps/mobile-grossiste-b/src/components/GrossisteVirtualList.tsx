import { memo, useMemo, type ReactNode } from "react";

type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  maxHeight?: number;
  testId?: string;
};

/** Lightweight windowed list — no heavy deps (MacBook 2017 friendly). */
export const GrossisteVirtualList = memo(function GrossisteVirtualList<T>({
  items,
  renderItem,
  keyExtractor,
  maxHeight = 420,
  testId,
}: Props<T>) {
  const slice = useMemo(() => items.slice(0, 80), [items]);

  return (
    <div
      className="grossiste-b-virtual-list"
      data-testid={testId}
      style={{ maxHeight }}
      role="list"
    >
      {slice.map((item, index) => (
        <div key={keyExtractor(item)} role="listitem">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}) as <T>(props: Props<T>) => React.ReactElement;
