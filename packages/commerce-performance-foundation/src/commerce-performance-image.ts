export type LazyImageProps = {
  loading: "lazy";
  decoding: "async";
  fetchPriority?: "low" | "high" | "auto";
};

export function lazyImageProps(priority: "low" | "high" = "low"): LazyImageProps {
  return {
    loading: "lazy",
    decoding: "async",
    fetchPriority: priority === "high" ? "high" : "low",
  };
}

export function catalogThumbnailSize(): { width: number; height: number } {
  return { width: 96, height: 96 };
}
