import httpAxios from "./httpAxios";

const ingredientService = {
  getAll: async () => {
    const response = await httpAxios.get("/ingredients");
    return response.data;
  },

  create: async (data: any) => {
    const response = await httpAxios.post("/ingredients", data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response =
      await httpAxios.put(
        `/ingredients/${id}`,
        data
      );

    return response.data;
  },

  delete: async (id: number) => {
    await httpAxios.delete(`/ingredients/${id}`);
  },
  requestImport: async (data: any) => {
    const response =
      await httpAxios.post(
        "/ingredients/request-import",
        data
      );

    return response.data;
  },
  getImportRequests: async () => {
    const response =
      await httpAxios.get(
        "/ingredients/import-requests"
      );

    return response.data;
  },
  approveRequest: async (
    id: string | number
  ) => {

    const response =
      await httpAxios.put(
        `/ingredients/import-requests/${id}/approve`
      );

    return response.data;
  },

  rejectRequest: async (
    id: string | number
  ) => {

    const response =
      await httpAxios.put(
        `/ingredients/import-requests/${id}/reject`
      );

    return response.data;
  },
  addStock: async (
    id: number,
    quantity: number
  ) => {

    const response =
      await httpAxios.put(
        `/ingredients/${id}/add-stock?quantity=${quantity}`
      );

    return response.data;
  },
  receiveImport: async (
    requestId: number,
    quantity: number
  ) => {

    const response =
      await httpAxios.put(
        `/ingredients/import-requests/${requestId}/receive?quantity=${quantity}`
      );

    return response.data;
  },
};

export default ingredientService;