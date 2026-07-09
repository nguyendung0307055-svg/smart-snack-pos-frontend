import httpAxios from "./httpAxios";

const toppingService = {
    // Lấy danh sách tất cả topping
    getAll: async () => {
        const response = await httpAxios.get("/toppings");
        return response.data;
    },

    // Lấy chi tiết 1 topping theo ID
    getById: async (id) => {
        const response = await httpAxios.get(`/toppings/${id}`);
        return response.data;
    },

    // Thêm topping mới
    create: async (data) => {
        const response = await httpAxios.post("/toppings", data);
        return response.data;
    },

    // Cập nhật thông tin topping (bao gồm cả hình ảnh)
    update: async (id, data) => {
        const response = await httpAxios.put(`/toppings/${id}`, data);
        return response.data;
    },

    // Xóa topping
    delete: async (id) => {
        const response = await httpAxios.delete(`/toppings/${id}`);
        return response.data;
    }
};

export default toppingService;