import httpAxios from "./httpAxios";

const productService = {
    getAll: () => httpAxios.get("/products").then(res => res.data),

    getById: (id: number) => httpAxios.get(`/products/${id}`).then(res => res.data),

    create: (data: any) => httpAxios.post("/products", data).then(res => res.data),

    update: (id: number, data: any) => httpAxios.put(`/products/${id}`, data).then(res => res.data),

    delete: (id: number) => httpAxios.delete(`/products/${id}`),

    // Hàm quan trọng để xử lý ảnh qua Java
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file); // Tên "file" phải khớp @RequestParam("file") ở Java

        // Gửi request mà KHÔNG có tham số headers thứ 3
        const response = await httpAxios.post("/products/upload", formData);
        return response.data;
    },
    // 🌟 THÊM HÀM NÀY ĐỂ AI CHATBOX GỌI API XUỐNG JAVA
    getRecommendations: (type: string) => {
        return httpAxios.get(`/products/recommendations?type=${type}`).then(res => res.data);
    }
};

export default productService;