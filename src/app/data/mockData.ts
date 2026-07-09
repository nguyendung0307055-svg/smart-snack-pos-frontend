// Mock data for Smart Snack POS System

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  basePrice: number;
  image: string;
  description: string;
  available: boolean;
}

export interface ProductSize {
  id: string;
  productId: string;
  name: string;
  priceModifier: number;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  barcode: string;
  unit: string;
  stock: number;
  minimumStock: number;
  cost: number;
}

export interface Recipe {
  id: string;
  productId: string;
  ingredientId: string;
  quantity: number;
}

export interface DiningTable {
  id: number;
  number: number;
  qrCode: string;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  size: string;
  toppings: string[];
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'cooking' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'vnpay';
  createdAt: string;
  createdBy: string;
  kitchenStatus?: 'pending' | 'cooking' | 'done';
}

export interface FlashSale {
  id: string;
  name: string;
  discountPercent: number;
  startTime: string;
  endTime: string;
  productIds: string[];
  active: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usageCount: number;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'kitchen' | 'warehouse';
  avatar: string;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  endingCash?: number;
  revenue?: number;
  orderCount?: number;
  status: 'active' | 'closed';
}

export interface Schedule {
  id: string;
  userId: string;
  userName: string;
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  shiftType: 'morning' | 'evening';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface OrderHistory {
  id: string;
  orderNumber: string;
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  voucher?: string;
}

// Mock Data
export const categories: Category[] = [
  { id: '1', name: 'Trà Sữa', icon: 'coffee', color: '#F59E0B' },
  { id: '2', name: 'Nước Ép', icon: 'glass-water', color: '#10B981' },
  { id: '3', name: 'Bánh Ngọt', icon: 'cake', color: '#EC4899' },
  { id: '4', name: 'Đồ Ăn Vặt', icon: 'popcorn', color: '#8B5CF6' },
];

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Trà Sữa Trân Châu Đường Đen',
    categoryId: '1',
    basePrice: 35000,
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400',
    description: 'Trà sữa thơm ngon với trân châu đường đen',
    available: true,
  },
  {
    id: 'p2',
    name: 'Trà Sữa Matcha',
    categoryId: '1',
    basePrice: 40000,
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400',
    description: 'Trà sữa matcha Nhật Bản nguyên chất',
    available: true,
  },
  {
    id: 'p3',
    name: 'Nước Ép Dâu',
    categoryId: '2',
    basePrice: 30000,
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400',
    description: 'Nước ép dâu tươi 100%',
    available: true,
  },
  {
    id: 'p4',
    name: 'Bánh Bông Lan Trứng Muối',
    categoryId: '3',
    basePrice: 25000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400',
    description: 'Bánh bông lan mềm mịn với nhân trứng muối',
    available: true,
  },
  {
    id: 'p5',
    name: 'Khoai Tây Chiên',
    categoryId: '4',
    basePrice: 20000,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    description: 'Khoai tây chiên giòn rụm',
    available: true,
  },
];

export const productSizes: ProductSize[] = [
  { id: 's1', productId: 'p1', name: 'M', priceModifier: 0 },
  { id: 's2', productId: 'p1', name: 'L', priceModifier: 10000 },
  { id: 's3', productId: 'p2', name: 'M', priceModifier: 0 },
  { id: 's4', productId: 'p2', name: 'L', priceModifier: 10000 },
  { id: 's5', productId: 'p3', name: 'M', priceModifier: 0 },
  { id: 's6', productId: 'p3', name: 'L', priceModifier: 8000 },
];

export const toppings: Topping[] = [
  { id: 't1', name: 'Trân châu', price: 5000, available: true },
  { id: 't2', name: 'Thạch dừa', price: 5000, available: true },
  { id: 't3', name: 'Pudding', price: 7000, available: true },
  { id: 't4', name: 'Kem cheese', price: 10000, available: true },
];

export const ingredients: Ingredient[] = [
  { id: 'i1', name: 'Trà đen', barcode: '8934567890123', unit: 'g', stock: 5000, minimumStock: 1000, cost: 100 },
  { id: 'i2', name: 'Sữa tươi', barcode: '8934567890124', unit: 'ml', stock: 8000, minimumStock: 2000, cost: 15 },
  { id: 'i3', name: 'Đường', barcode: '8934567890125', unit: 'g', stock: 3000, minimumStock: 1000, cost: 20 },
  { id: 'i4', name: 'Bột matcha', barcode: '8934567890126', unit: 'g', stock: 500, minimumStock: 200, cost: 300 },
  { id: 'i5', name: 'Trân châu đen', barcode: '8934567890127', unit: 'g', stock: 2000, minimumStock: 500, cost: 50 },
  { id: 'i6', name: 'Dâu tươi', barcode: '8934567890128', unit: 'g', stock: 800, minimumStock: 500, cost: 80 },
  { id: 'i7', name: 'Khoai tây', barcode: '8934567890129', unit: 'kg', stock: 15, minimumStock: 5, cost: 25000 },
];

export const recipes: Recipe[] = [
  { id: 'r1', productId: 'p1', ingredientId: 'i1', quantity: 50 },
  { id: 'r2', productId: 'p1', ingredientId: 'i2', quantity: 100 },
  { id: 'r3', productId: 'p1', ingredientId: 'i3', quantity: 30 },
  { id: 'r4', productId: 'p1', ingredientId: 'i5', quantity: 50 },
  { id: 'r5', productId: 'p2', ingredientId: 'i1', quantity: 40 },
  { id: 'r6', productId: 'p2', ingredientId: 'i2', quantity: 100 },
  { id: 'r7', productId: 'p2', ingredientId: 'i4', quantity: 20 },
  { id: 'r8', productId: 'p3', ingredientId: 'i6', quantity: 150 },
];

export const diningTables: DiningTable[] = [
  { id: 1, number: 1, qrCode: 'QR-TABLE-001', status: 'available' },
  { id: 2, number: 2, qrCode: 'QR-TABLE-002', status: 'occupied' },
  { id: 3, number: 3, qrCode: 'QR-TABLE-003', status: 'available' },
  { id:4, number: 4, qrCode: 'QR-TABLE-004', status: 'available' },
  { id: 5, number: 5, qrCode: 'QR-TABLE-005', status: 'occupied' },
  { id: 6, number: 6, qrCode: 'QR-TABLE-006', status: 'available' },
];
export const orders: Order[] = [
  {
    id: 'ord1',
    orderNumber: 'ORD-001',
    tableId: 'tb2',
    items: [
      {
        id: 'oi1',
        productId: 'p1',
        productName: 'Trà Sữa Trân Châu Đường Đen',
        size: 'L',
        toppings: ['Trân châu', 'Pudding'],
        quantity: 2,
        price: 57000,
      },
    ],
    subtotal: 114000,
    discount: 0,
    total: 114000,
    status: 'cooking',
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString(),
    createdBy: 'Nguyễn Văn A',
    kitchenStatus: 'cooking',
  },
  {
    id: 'ord2',
    orderNumber: 'ORD-002',
    items: [
      {
        id: 'oi2',
        productId: 'p3',
        productName: 'Nước Ép Dâu',
        size: 'M',
        toppings: [],
        quantity: 1,
        price: 30000,
      },
      {
        id: 'oi3',
        productId: 'p5',
        productName: 'Khoai Tây Chiên',
        size: '',
        toppings: [],
        quantity: 1,
        price: 20000,
      },
    ],
    subtotal: 50000,
    discount: 0,
    total: 50000,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    createdBy: 'Nguyễn Văn A',
    kitchenStatus: 'pending',
  },
];

export const flashSales: FlashSale[] = [
  {
    id: 'fs1',
    name: 'Giảm giá giờ vàng',
    discountPercent: 30,
    startTime: '15:00',
    endTime: '17:00',
    productIds: ['p1', 'p2'],
    active: true,
  },
  {
    id: 'fs2',
    name: 'Happy Hour',
    discountPercent: 20,
    startTime: '18:00',
    endTime: '20:00',
    productIds: ['p3', 'p4', 'p5'],
    active: true,
  },
];

export const vouchers: Voucher[] = [
  {
    id: 'v1',
    code: 'WELCOME20',
    discountType: 'percent',
    discountValue: 20,
    minOrder: 50000,
    maxDiscount: 30000,
    usageLimit: 100,
    usageCount: 45,
    validFrom: '2026-04-01',
    validTo: '2026-04-30',
    active: true,
  },
  {
    id: 'v2',
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 15000,
    minOrder: 100000,
    usageLimit: 50,
    usageCount: 12,
    validFrom: '2026-04-01',
    validTo: '2026-04-30',
    active: true,
  },
];

export const users: User[] = [
  {
    id: 'u1',
    name: 'Nguyễn Văn A',
    email: 'admin@smartsnack.vn',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
  },
  {
    id: 'u2',
    name: 'Trần Thị B',
    email: 'cashier@smartsnack.vn',
    role: 'cashier',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  },
  {
    id: 'u3',
    name: 'Lê Văn C',
    email: 'kitchen@smartsnack.vn',
    role: 'kitchen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
  },
];

export const shifts: Shift[] = [
  {
    id: 'sh1',
    userId: 'u2',
    userName: 'Trần Thị B',
    startTime: new Date().toISOString(),
    startingCash: 1000000,
    status: 'active',
  },
  {
    id: 'sh2',
    userId: 'u2',
    userName: 'Trần Thị B',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 57600000).toISOString(),
    startingCash: 1000000,
    endingCash: 1850000,
    revenue: 850000,
    orderCount: 25,
    status: 'closed',
  },
];

export const schedules: Schedule[] = [
  // Trần Thị B - Cashier
  { id: 'sc1', userId: 'u2', userName: 'Trần Thị B', dayOfWeek: 1, shiftType: 'morning', startTime: '08:00', endTime: '14:00' },
  { id: 'sc2', userId: 'u2', userName: 'Trần Thị B', dayOfWeek: 2, shiftType: 'morning', startTime: '08:00', endTime: '14:00' },
  { id: 'sc3', userId: 'u2', userName: 'Trần Thị B', dayOfWeek: 3, shiftType: 'morning', startTime: '08:00', endTime: '14:00' },
  { id: 'sc4', userId: 'u2', userName: 'Trần Thị B', dayOfWeek: 4, shiftType: 'evening', startTime: '14:00', endTime: '20:00' },
  { id: 'sc5', userId: 'u2', userName: 'Trần Thị B', dayOfWeek: 5, shiftType: 'evening', startTime: '14:00', endTime: '20:00' },

  // Lê Văn C - Kitchen
  { id: 'sc6', userId: 'u3', userName: 'Lê Văn C', dayOfWeek: 1, shiftType: 'evening', startTime: '14:00', endTime: '22:00' },
  { id: 'sc7', userId: 'u3', userName: 'Lê Văn C', dayOfWeek: 2, shiftType: 'evening', startTime: '14:00', endTime: '22:00' },
  { id: 'sc8', userId: 'u3', userName: 'Lê Văn C', dayOfWeek: 3, shiftType: 'evening', startTime: '14:00', endTime: '22:00' },
  { id: 'sc9', userId: 'u3', userName: 'Lê Văn C', dayOfWeek: 4, shiftType: 'morning', startTime: '08:00', endTime: '16:00' },
  { id: 'sc10', userId: 'u3', userName: 'Lê Văn C', dayOfWeek: 5, shiftType: 'morning', startTime: '08:00', endTime: '16:00' },
  { id: 'sc11', userId: 'u3', userName: 'Lê Văn C', dayOfWeek: 6, shiftType: 'morning', startTime: '08:00', endTime: '16:00' },
  { id: 'sc12', userId: 'u3', userName: 'Lê Văn C', dayOfWeek: 7, shiftType: 'evening', startTime: '14:00', endTime: '22:00' },
];

export const orderHistory: OrderHistory[] = [
  {
    id: 'oh1',
    orderNumber: 'ORD-0001',
    tableId: 'tb1',
    items: [
      { id: 'oi1', productId: 'p1', productName: 'Trà Sữa Trân Châu Đường Đen', size: 'L', toppings: ['Trân châu'], quantity: 2, price: 50000 },
      { id: 'oi2', productId: 'p3', productName: 'Nước Ép Dâu', size: 'M', toppings: [], quantity: 1, price: 30000 },
    ],
    subtotal: 130000,
    discount: 13000,
    total: 117000,
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 6900000).toISOString(),
    createdBy: 'Trần Thị B',
    voucher: 'WELCOME20',
  },
  {
    id: 'oh2',
    orderNumber: 'ORD-0002',
    items: [
      { id: 'oi3', productId: 'p5', productName: 'Khoai Tây Chiên', size: '', toppings: [], quantity: 3, price: 20000 },
    ],
    subtotal: 60000,
    discount: 0,
    total: 60000,
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'vnpay',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    completedAt: new Date(Date.now() - 5100000).toISOString(),
    createdBy: 'Trần Thị B',
  },
  {
    id: 'oh3',
    orderNumber: 'ORD-0003',
    tableId: 'tb3',
    items: [
      { id: 'oi4', productId: 'p2', productName: 'Trà Sữa Matcha', size: 'L', toppings: ['Pudding', 'Kem cheese'], quantity: 1, price: 57000 },
      { id: 'oi5', productId: 'p4', productName: 'Bánh Bông Lan Trứng Muối', size: '', toppings: [], quantity: 2, price: 25000 },
    ],
    subtotal: 107000,
    discount: 0,
    total: 107000,
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3300000).toISOString(),
    createdBy: 'Trần Thị B',
  },
];