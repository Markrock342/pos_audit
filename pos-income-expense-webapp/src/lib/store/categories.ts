import { mockCategories } from "@/data/mock";
import type { Category } from "@/types";

let categories: Category[] = [...mockCategories];

export function getCategories(type?: Category["type"]): Category[] {
  if (type) {
    return categories.filter((category) => category.type === type);
  }

  return [...categories];
}

export function addCategory(data: Omit<Category, "id">): Category {
  const newCategory: Category = {
    ...data,
    id: `cat-${Date.now()}`,
  };

  categories = [...categories, newCategory];
  return newCategory;
}
