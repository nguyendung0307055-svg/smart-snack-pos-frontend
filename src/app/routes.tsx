import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./layouts/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";
import { Products } from "./pages/admin/Products";
import { Inventory } from "./pages/admin/Inventory";
import Orders from "./pages/admin/Orders";
import { Tables } from "./pages/admin/Tables";
import { Users } from "./pages/admin/Users";
import { Shifts } from "./pages/admin/Shifts";
import { Schedules } from "./pages/admin/Schedules";
import { OrderHistory } from "./pages/admin/OrderHistory";
import { POSPage } from "./pages/pos/POSPage";
import { KitchenDisplay } from "./pages/kitchen/KitchenDisplay";
import { QRMenu } from "./pages/customer/QRMenu";
import { RoleSelector } from "./pages/RoleSelector";
import { Categories } from "./pages/admin/Categories";
import { Recipes } from "./pages/admin/Recipes";
import Topping from "./pages/admin/Topping";
import { OrderTrackingPage } from "./pages/pos/OrderTrackingPage";
import { PaymentSuccess } from "./pages/payment/PaymentSuccess";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import { ImportRequests } from "./pages/admin/ImportRequests";
import CustomerLayout from "./layouts/CustomerLayout";
import { CustomerReview } from "./pages/customer/CustomerReview";
import { CustomerPayment } from "./pages/customer/CustomerPayment";
import { CustomerProfile } from "./pages/customer/CustomerProfile";
import { CustomerOrders } from "./pages/customer/CustomerOrders";
import { UserAvailability } from "./pages/employee/UserAvailability";

export const router = createBrowserRouter([
  {
    path: "/roles",
    Component: RoleSelector,
  },
  {
    path: "/",
    Component: Login,
  },

  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "products", Component: Products },
      { path: "toppings", Component: Topping },

      { path: "categories", Component: Categories },
      { path: "import-requests", Component: ImportRequests },
      { path: "inventory", Component: Inventory },
      { path: "recipes", Component: Recipes },

      { path: "orders", Component: Orders },
      { path: "order-history", Component: OrderHistory },
      { path: "tables", Component: Tables },
      { path: "users", Component: Users },
      { path: "shifts", Component: Shifts },
      { path: "schedules", Component: Schedules },
      { path: "my-availability", Component: UserAvailability },

    ],
  },
    // 3. THIẾT LẬP ROUTE RIÊNG CHO NHÂN VIÊN (Nếu bạn có EmployeeLayout riêng thì bọc ngoài tương tự CustomerLayout)
  {
    path: "/employee",
    // Nếu có EmployeeLayout thì bổ sung ở đây, hiện tại gọi trực tiếp Component:
    children: [
      {
        path: "register-availability",
        Component: UserAvailability, // Truy cập qua URL: /employee/register-availability
      }
    ]
  },
  {
    path: "/pos",
    Component: POSPage,
  },
  {
    path: "/orders",
    Component: OrderTrackingPage,
  },
  {
    path: "/kitchen",
    Component: KitchenDisplay,
  },
  // {
  //   path: "/customer/menu/:tableId",
  //   Component: QRMenu,
  // },

  {
    path: "/payment-success",
    Component: PaymentSuccess,
  },
  {
    path: "/customer",
    Component: CustomerLayout,

    children: [

      {
        path: "menu/:tableId",
        Component: QRMenu,
      },

      {
        path: "orders",
        Component: CustomerOrders,
      },

      {
        path: "orders/:id",
        Component: CustomerReview,
      },

      {
        path: "payment",
        Component: CustomerPayment,
      },

      {
        path: "profile",
        Component: CustomerProfile,
      }

    ]
  },
]);