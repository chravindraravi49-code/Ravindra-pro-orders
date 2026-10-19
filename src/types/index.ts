export type UserRole = 'customer' | 'admin' | 'delivery';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  hostelBlock?: string;
  roomNumber?: string;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductCategory =
  | 'All'
  | 'Snacks & Munchies'
  | 'Instant Meals & Noodles'
  | 'Beverages & Drinks'
  | 'Study & Stationery'
  | 'Toiletries & Hygiene'
  | 'Hostel Essentials';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'assigned'
  | 'preparing'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface ShopSettings {
  ownerWhatsApp: string;
  shopName: string;
  isStoreOpen: boolean;
  freeDeliveryThreshold: number;
  deliveryFee: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  hostelBlock: string;
  hostelRoom: string;
  instructions?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'cod' | 'online';
  paymentStatus: 'pending' | 'completed';
  assignedDeliveryManId?: string | null;
  assignedDeliveryManName?: string | null;
  deliveryNotes?: string;
  deliveredAt?: string | null;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryManId: string;
  deliveryManName: string;
  customerName: string;
  hostelRoom: string;
  hostelBlock: string;
  status: 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered';
  assignedAt: string;
  deliveredAt?: string | null;
  notes?: string;
}
