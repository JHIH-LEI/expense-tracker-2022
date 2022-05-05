type Category = {
  id: number;
  name: string;
  icon: string;
  type: CategoryType;
};

enum CategoryType {
  "REVENUE" = "REVENUE",
  "EXPENSE" = "EXPENSE",
}
