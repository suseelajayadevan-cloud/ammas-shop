export interface Product {
  id: string;
  title: string;
  category: 'Nettipatam' | 'DIY Kits' | 'Brass & Beads' | 'Wall Hangings' | string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  description: string;
  stock: 'In Stock' | 'Low Stock' | 'Made to Order';
  dimensions?: string;
  material?: string;
  rating?: number;
  reviewsCount?: number;
  isBestseller?: boolean;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  category: string;
  quantity: number;
}

export interface ShippingFormData {
  fullName: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
}

export interface OrderDetails {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  shipping: ShippingFormData;
  paymentMethod: 'UPI' | 'COD' | 'NetBanking';
  upiId?: string;
  orderDate: string;
  estimatedDelivery: string;
}

export const FREE_DELIVERY_THRESHOLD = 1500;
export const STANDARD_DELIVERY_FEE = 120;

export const INITIAL_PRODUCTS: Product[] = [];

export interface GrievanceOfficerInfo {
  name: string;
  designation: string;
  email: string;
  address: string;
  responseWindow: string;
  resolutionWindow: string;
}

export const LEGAL_COMPLIANCE = {
  businessName: 'Tharavadu Store',
  legalEntity: 'Tharavadu Store Sole Proprietorship',
  countryOfOrigin: 'India',
  operatingAddress: 'Heritage Craft Nagar, Chembukkavu, Thrissur, Kerala – 680020, India',
  supportEmail: 'sujajayadevan1@gmail.com',
  supportPhone: '+91 98471 23456',
  workingHours: 'Monday – Saturday: 9:00 AM – 6:00 PM IST',
  grievanceOfficer: {
    name: 'Mrs. Suja Jayadevan',
    designation: 'Statutory Grievance Redressal Officer',
    email: 'sujajayadevan1@gmail.com',
    address: 'Heritage Craft Nagar, Chembukkavu, Thrissur, Kerala – 680020, India',
    responseWindow: 'Within 48 hours of complaint receipt',
    resolutionWindow: 'Within 30 calendar days as per Consumer Protection (E-Commerce) Rules, 2020'
  } as GrievanceOfficerInfo,
  taxPolicy: 'All product prices displayed on the storefront are strictly inclusive of all applicable taxes (GST where applicable).',
  handcraftedDisclosure: 'Each Nettipatam, caparison, and brass fitting is handcrafted by Kerala master artisans. Organic variations in bell acoustics, metal patina, thread hue, and bead symmetry are intrinsic signs of authentic manual craftsmanship, not defects.'
};

export function calculateCartTotals(items: CartItem[]): {
  subtotal: number;
  deliveryFee: number;
  freeDeliveryRemaining: number;
  total: number;
  itemCount: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * Math.max(0, item.quantity), 0);
  const itemCount = items.reduce((count, item) => count + Math.max(0, item.quantity), 0);
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const total = subtotal + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    freeDeliveryRemaining,
    total,
    itemCount
  };
}

export function filterProducts(products: Product[], category: string, searchQuery: string): Product[] {
  const query = searchQuery.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();

  return products.filter((p) => {
    const matchesCategory =
      normalizedCategory === 'all' ||
      normalizedCategory === '' ||
      p.category.toLowerCase() === normalizedCategory;

    if (!matchesCategory) return false;

    if (!query) return true;

    return (
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.material && p.material.toLowerCase().includes(query))
    );
  });
}

export function validateShippingForm(data: ShippingFormData): {
  isValid: boolean;
  errors: Record<keyof ShippingFormData, string>;
} {
  const errors: Record<keyof ShippingFormData, string> = {
    fullName: '',
    phone: '',
    pincode: '',
    address: '',
    city: '',
    state: ''
  };

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Please enter a valid full name (minimum 2 characters)';
  }

  const cleanPhone = data.phone.replace(/[\s-]/g, '');
  if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number';
  }

  const cleanPincode = data.pincode.replace(/\s/g, '');
  if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
    errors.pincode = 'Enter a valid 6-digit Indian Postal PIN Code';
  }

  if (!data.address || data.address.trim().length < 6) {
    errors.address = 'Please provide detailed delivery address (min 6 characters)';
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'Please enter your city/town';
  }

  if (!data.state || data.state.trim().length < 2) {
    errors.state = 'Please enter your state';
  }

  const isValid = Object.values(errors).every((err) => err === '');
  return { isValid, errors };
}

export function generateOrderId(): string {
  const prefix = 'ACW';
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${year}-${randomChars}`;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function calculateEstimatedDelivery(baseDate: Date = new Date()): string {
  const deliveryStart = new Date(baseDate);
  deliveryStart.setDate(deliveryStart.getDate() + 4);

  const deliveryEnd = new Date(baseDate);
  deliveryEnd.setDate(deliveryEnd.getDate() + 7);

  const startFormatted = deliveryStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const endFormatted = deliveryEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return `${startFormatted} – ${endFormatted} (4-7 Business Days)`;
}

export const STORE_OWNER_EMAIL = 'sujajayadevan1@gmail.com';
export const WHATSAPP_PHONE_NUMBER = '919846140051';

export function isStoreOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === STORE_OWNER_EMAIL.toLowerCase();
}

export interface OrderEmailPayload {
  orderId: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  items: CartItem[];
  shipping: ShippingFormData;
  paymentMethod: string;
  orderDate?: string;
}

export function buildOrderReceiptText(order: OrderEmailPayload): string {
  const formattedItems = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.title}\n   Quantity: ${item.quantity} | Unit Price: ₹${item.price.toLocaleString('en-IN')} | Subtotal: ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
    )
    .join('\n\n');

  return `==================================================
THARAVADU STORE - NEW ORDER NOTIFICATION
==================================================
Order ID: ${order.orderId}
Order Date: ${order.orderDate || new Date().toLocaleString('en-IN')}
Total Amount: ₹${order.total.toLocaleString('en-IN')}
Payment Method: ${order.paymentMethod}

--------------------------------------------------
CUSTOMER & DELIVERY DETAILS:
--------------------------------------------------
Customer Name: ${order.shipping.fullName}
Phone Number: ${order.shipping.phone}
Delivery Address: ${order.shipping.address}
City: ${order.shipping.city}
State: ${order.shipping.state}
PIN Code: ${order.shipping.pincode}

--------------------------------------------------
ITEMIZED PRODUCT LIST:
--------------------------------------------------
${formattedItems}

--------------------------------------------------
ORDER BREAKDOWN:
--------------------------------------------------
Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}
Delivery Fee: ${order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toLocaleString('en-IN')}`}
TOTAL PAYABLE: ₹${order.total.toLocaleString('en-IN')}
==================================================`;
}

export function buildWhatsAppOrderMessage(order: OrderEmailPayload): string {
  const itemsText = order.items
    .map(
      (item, idx) =>
        `  ${idx + 1}. *${item.title}*\n     • Qty: ${item.quantity} × ₹${item.price.toLocaleString('en-IN')} = ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
    )
    .join('\n');

  const deliveryStr = order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toLocaleString('en-IN')}`;

  return `*THARAVADU STORE - NEW ORDER SUBMISSION* 🪔\n` +
    `--------------------------------------------------\n` +
    `*Order Reference ID:* #${order.orderId}\n` +
    `*Payment Method:* ${order.paymentMethod}\n\n` +
    `*CUSTOMER & DELIVERY DETAILS:*\n` +
    `• *Name:* ${order.shipping.fullName}\n` +
    `• *Phone:* ${order.shipping.phone}\n` +
    `• *Address:* ${order.shipping.address}\n` +
    `• *City:* ${order.shipping.city}\n` +
    `• *State:* ${order.shipping.state}\n` +
    `• *PIN Code:* ${order.shipping.pincode}\n\n` +
    `*ITEMIZED PRODUCT BREAKDOWN:*\n` +
    `${itemsText}\n\n` +
    `*ORDER FINANCIAL SUMMARY:*\n` +
    `• Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}\n` +
    `• Delivery Fee: ${deliveryStr}\n` +
    `• *TOTAL AMOUNT:* ₹${order.total.toLocaleString('en-IN')}\n` +
    `--------------------------------------------------\n` +
    `_Hello Tharavadu Store, I have placed this order on your website. Please verify and confirm availability._`;
}

export function buildWhatsAppOrderUrl(order: OrderEmailPayload, phoneNumber: string = WHATSAPP_PHONE_NUMBER): string {
  const message = buildWhatsAppOrderMessage(order);
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generateOwnerMailtoLink(order: OrderEmailPayload): {
  subject: string;
  body: string;
  mailtoUrl: string;
} {
  const subject = `NEW ORDER #${order.orderId} - Tharavadu Store`;
  const body = buildOrderReceiptText(order);
  const mailtoUrl = `mailto:${STORE_OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}

// Web3Forms Public Access Key (Create or manage free access keys at https://web3forms.com)
export const WEB3FORMS_ACCESS_KEY = 'ab37735a-a596-4911-ad66-bc4fa8841979';

export interface Web3FormsOrderPayload {
  access_key: string;
  subject: string;
  from_name: string;
  email: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  pin_code: string;
  payment_method: string;
  total_amount: string;
  message: string;
}

export function buildWeb3FormsPayload(
  order: OrderEmailPayload,
  accessKey: string = WEB3FORMS_ACCESS_KEY,
  customerEmail?: string
): Web3FormsOrderPayload {
  const summaryMessage = buildOrderReceiptText(order);
  return {
    access_key: accessKey,
    subject: `New Order #${order.orderId} - Tharavadu Store`,
    from_name: 'Tharavadu Store Storefront',
    email: customerEmail || STORE_OWNER_EMAIL,
    order_id: order.orderId,
    customer_name: order.shipping.fullName,
    customer_phone: order.shipping.phone,
    delivery_address: `${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state}`,
    pin_code: order.shipping.pincode,
    payment_method: order.paymentMethod,
    total_amount: `₹${order.total.toLocaleString('en-IN')}`,
    message: summaryMessage
  };
}

