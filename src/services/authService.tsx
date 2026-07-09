import httpAxios from "./httpAxios";

const authService = {
  login: async (data: any) => {
    const response = await httpAxios.post(
      "/auth/login",
      data
    );
    return response.data;
  },

  register: async (data: any) => {
    const response = await httpAxios.post(
      "/auth/register",
      data
    );
    return response.data;
  },
  getAll: async () => {
    const response = await httpAxios.get("/auth/users");
    return response.data; 
  },
  update: async (id: number, data: any) => {
    const response = await httpAxios.put(`/auth/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await httpAxios.delete(`/auth/users/${id}`);
    return response.data;
  }
};

export default authService;