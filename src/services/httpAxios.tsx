// services/httpAxios.ts
import axios from "axios";

const httpAxios = axios.create({
  baseURL: "http://10.68.174.38:8080/api",
  withCredentials: true, // Quan trọng vì Java của bạn đã set config.setAllowCredentials(true)
});

export default httpAxios;