export interface CategoryItemType extends TotalItemType {
  category_type: CategoryType;
}
export interface CategoryAllItemType {
  category: CategoryType[];
  genre: CategoryType[];
  league: CategoryType[];
  round: CategoryType[];
  season: CategoryType[];
  all: CategoryType[];
}
