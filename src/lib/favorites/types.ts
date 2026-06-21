export type FavoriteType = "play" | "archetype" | "pattern" | "feature";

export type FavoriteItem = {
  type: FavoriteType;
  key: string;
  title: string;
  addedAt: number;
};
