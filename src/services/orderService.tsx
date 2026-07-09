import httpAxios from "./httpAxios";

// ITEM
export interface OrderItemRequest {

  productId: number;

  sizeId?: number;

  quantity: number;

  toppings?: string;
}

// ORDER
export interface OrderRequest {

  tableId?: number;

  orderType: string;

  note?: string;

  paymentMethod?: string;

  paymentStatus?: string;

  items: OrderItemRequest[];
}

const orderService = {

  // =========================
  // CREATE ORDER
  // =========================
  createOrder: (
    data: OrderRequest
  ) => {

    return httpAxios.post(
      "/orders",
      data
    );
  },

  // =========================
  // CUSTOMER QR ORDER
  // =========================
  createCustomerOrder: (
    data: OrderRequest
  ) => {

    return httpAxios.post(
      "/orders/customer",
      data
    );
  },

  // =========================
  // GET ALL
  // =========================
  getAllOrders: () => {

    return httpAxios.get(
      "/orders"
    );
  },

  // =========================
  // GET DETAIL
  // =========================
  getOrderById: (
    id: number
  ) => {

    return httpAxios.get(
      `/orders/${id}`
    );
  },

  // =========================
  // UPDATE STATUS
  // =========================
  updateStatus: (
    id: number,
    status: string
  ) => {

    return httpAxios.patch(
      `/orders/${id}/status`,
      null,
      {
        params: { status }
      }
    );
  },

  // =========================
  // GET BY TABLE
  // =========================
  getOrdersByTable: (
    tableId: number
  ) => {

    return httpAxios.get(
      `/orders/table/${tableId}`
    );
  },

  // =========================
  // PAYMENT SUCCESS
  // =========================
  completePayment: (
    orderId: number
  ) => {

    return httpAxios.patch(
      `/orders/${orderId}/payment`
    );
  },
  getOrdersByTableAndCustomer: (tableId: number, customerId: number) => {
    return httpAxios.get(
      `/orders/table/${tableId}/customer/${customerId}`
    );
  },
};

export default orderService;