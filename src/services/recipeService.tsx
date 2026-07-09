import httpAxios from "./httpAxios";

const recipeService = {
  getAll: async () => {
    const response = await httpAxios.get("/recipes");
    return response.data;
  },

  create: async (data: { productId: number; ingredientId: number; quantity: number }) => {
    const response = await httpAxios.post("/recipes", data);
    return response.data;
  },

  // Lấy công thức riêng cho một sản phẩm cụ thể
  getByProductId: async (productId: number) => {
    const response = await httpAxios.get(`/recipes/product/${productId}`);
    return response.data;
  },

  delete: async (id: number) => {
    await httpAxios.delete(`/recipes/${id}`);
  }
};

export default recipeService;