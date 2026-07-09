import { useEffect } from "react";

import {
  useNavigate,
  useSearchParams
} from "react-router";

import axios from "axios";

import { CheckCircle } from "lucide-react";

import { Button } from "../../components/ui/button";

export function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const responseCode = searchParams.get("vnp_ResponseCode");
        const transactionNo = searchParams.get("vnp_TransactionNo");
        
        // SỬA TẠI ĐÂY: Lấy vnp_TxnRef từ VNPay trả về thay vì 'orderId'
        const orderId = searchParams.get("vnp_TxnRef"); 

        // SUCCESS "00"
        if (responseCode === "00" && orderId) {
          await axios.get(
            "http://localhost:8080/api/payments/vnpay/success",
            {
              params: {
                orderId, // Giá trị vnp_TxnRef (ID đơn hàng) sẽ được truyền lên đây
                transactionNo,
              },
            }
          );
          console.log("VNPay cập nhật DB thành công");
        } else {
          console.log("VNPay thanh toán thất bại hoặc thiếu thông tin");
        }
      } catch (error) {
        console.error("Lỗi gọi API verify:", error);
      }
    };

    verifyPayment();
  }, [searchParams]);


  return (

    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">

        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">

          <CheckCircle className="w-14 h-14 text-green-600" />

        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-3">

          Thanh toán thành công

        </h1>

        <p className="text-gray-500 mb-8">

          Giao dịch VNPay đã hoàn tất

        </p>

        <Button
          className="w-full h-12 text-lg"
          onClick={() =>
            navigate('/orders')
          }
        >
          Quay về đơn hàng
        </Button>

      </div>

    </div>
  );
}