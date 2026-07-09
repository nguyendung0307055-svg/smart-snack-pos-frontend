import httpAxios from "./httpAxios";

// Định nghĩa kiểu dữ liệu Khách hàng trả về từ Backend
export interface Customer {
  id: number;
  name: string;
  phone: string;
  points: number;
  totalSpent: number;
}

const customerService = {
  // Tìm kiếm khách hàng bằng số điện thoại khi gõ tại quầy POS
  searchByPhone: async (phone: string): Promise<Customer> => {
    // Gọi đúng endpoint @GetMapping("/search") của CustomerController bên Spring Boot
    const response = await httpAxios.get(`/customers/search?phone=${phone}`);
    return response.data; 
  },
  createCustomer: async (customerData: { name: string; phone: string }): Promise<Customer> => {
    const response = await httpAxios.post('/customers', customerData);
    return response.data;
  } 
};

export default customerService;