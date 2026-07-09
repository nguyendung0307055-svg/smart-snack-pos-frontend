import httpAxios from "./httpAxios";

const paymentService = {

  // CASH
  cashPayment: (orderId: number) => {

    return httpAxios.post(
      `/payments/cash/${orderId}`
    );
  },

  // CREATE VNPAY
  createVnpay: (orderId: number) => {

    return httpAxios.post(
      `/payments/vnpay/create?orderId=${orderId}`
    );
  },
};

export default paymentService;