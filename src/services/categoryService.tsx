import httpAxios from "./httpAxios";

const categoryService = {
    // Lấy danh sách tất cả danh mục
    getAll: async () => {
        const response = await httpAxios.get("/categories");
        return response.data;
    },
    getProductsByCategory: async (id: number | string) => {
        const response = await httpAxios.get(`/products/category/${id}`);
        return response.data;
    },
    // Tạo danh mục mới
    create: async (data: any) => {
        const response = await httpAxios.post("/categories", data);
        return response.data;
    },

    // Cập nhật danh mục theo ID (Sử dụng PUT tương ứng với @PutMapping ở Backend)
    update: async (id: number | string, data: any) => {
        const response = await httpAxios.put(`/categories/${id}`, data);
        return response.data;
    },

    // Xóa danh mục theo ID (Sử dụng DELETE tương ứng với @DeleteMapping ở Backend)
    delete: async (id: number | string) => {
        const response = await httpAxios.delete(`/categories/${id}`);
        return response.data;
    }
};

export default categoryService;