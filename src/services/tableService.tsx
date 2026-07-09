import httpAxios from "./httpAxios";

const tableService = {

  getAll: () => {
    return httpAxios.get("/tables");
  },

  getById: (id: number) => {
    return httpAxios.get(`/tables/${id}`);
  },

  create: (data: any) => {
    return httpAxios.post("/tables", data);
  },

  updateStatus: (
    id: number,
    status: string
  ) => {

    return httpAxios.patch(
      `/tables/${id}/status`,
      null,
      {
        params: { status }
      }
    );
  },
  cleanTable(id: number) {
    return httpAxios.patch(`/tables/${id}/clean`);
  }

};

export default tableService;