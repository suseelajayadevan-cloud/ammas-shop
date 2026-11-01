import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  filterProducts,
  validateShippingForm,
  generateOrderId,
  formatINR,
  calculateEstimatedDelivery,
  INITIAL_PRODUCTS,
  CartItem,
  ShippingFormData,
  generateOwnerMailtoLink,
  buildWeb3FormsPayload,
  isStoreOwnerEmail,
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  WHATSAPP_PHONE_NUMBER,
  STORE_OWNER_EMAIL
} from './storeLogic';

test('calculateCartTotals calculates subtotal and standard delivery correctly', () => {
  const items: CartItem[] = [
    {
      id: 'prod-4',
      title: 'Handcrafted Silk Tassels',
      price: 750,
      imageUrl: '',
      category: 'Brass & Beads',
      quantity: 1
    }
  ];

  const result = calculateCartTotals(items);
  assert.equal(result.subtotal, 750);
  assert.equal(result.deliveryFee, 120, 'Under ₹1500 should incur standard delivery fee');
  assert.equal(result.total, 870);
  assert.equal(result.itemCount, 1);
  assert.equal(result.freeDeliveryRemaining, 750);
});

test('calculateCartTotals gives free delivery for orders >= ₹1500', () => {
  const items: CartItem[] = [
    {
      id: 'prod-1',
      title: 'Traditional Gold Nettipatam 3ft',
      price: 4999,
      imageUrl: '',
      category: 'Nettipatam',
      quantity: 1
    }
  ];

  const result = calculateCartTotals(items);
  assert.equal(result.subtotal, 4999);
  assert.equal(result.deliveryFee, 0, 'Orders >= 1500 have free delivery');
  assert.equal(result.total, 4999);
  assert.equal(result.freeDeliveryRemaining, 0);
});

test('calculateCartTotals handles empty cart', () => {
  const result = calculateCartTotals([]);
  assert.equal(result.subtotal, 0);
  assert.equal(result.deliveryFee, 0);
  assert.equal(result.total, 0);
  assert.equal(result.itemCount, 0);
});

test('INITIAL_PRODUCTS starts empty for live store catalog', () => {
  assert.equal(INITIAL_PRODUCTS.length, 0, 'Catalog should start empty without demo products');
});

test('filterProducts filters by category and search keywords', () => {
  const mockProducts = [
    {
      id: 'prod-1',
      title: 'Traditional Gold Nettipatam 3ft',
      category: 'Nettipatam',
      price: 4999,
      imageUrl: '',
      description: 'Authentic handcrafted Kerala elephant caparison with brass beads',
      stock: 'In Stock' as const
    },
    {
      id: 'prod-2',
      title: 'Miniature Desk Caparison',
      category: 'Nettipatam',
      price: 1299,
      imageUrl: '',
      description: 'Compact desk caparison with brass',
      stock: 'In Stock' as const
    },
    {
      id: 'prod-3',
      title: 'Brass Bell & Bead DIY Nettipatam Kit',
      category: 'DIY Kits',
      price: 1850,
      imageUrl: '',
      description: 'Complete DIY craft kit featuring 120+ spun brass beads',
      stock: 'In Stock' as const
    }
  ];

  const nettipatamOnly = filterProducts(mockProducts, 'Nettipatam', '');
  assert.equal(nettipatamOnly.length, 2);
  assert.ok(nettipatamOnly.every((p) => p.category === 'Nettipatam'));

  const diySearch = filterProducts(mockProducts, 'All', 'DIY');
  assert.equal(diySearch.length, 1);
  assert.equal(diySearch[0].id, 'prod-3');

  const beadSearch = filterProducts(mockProducts, 'All', 'brass');
  assert.ok(beadSearch.length >= 2);
});

test('validateShippingForm validates phone numbers and pin codes correctly', () => {
  const validData: ShippingFormData = {
    fullName: 'Ananya Nair',
    phone: '9847123456',
    pincode: '682001',
    address: 'Flat 4B, Lotus Apartments, MG Road',
    city: 'Kochi',
    state: 'Kerala'
  };

  const validResult = validateShippingForm(validData);
  assert.equal(validResult.isValid, true);
  assert.equal(validResult.errors.phone, '');
  assert.equal(validResult.errors.pincode, '');

  const invalidData: ShippingFormData = {
    fullName: 'A',
    phone: '12345',
    pincode: '99',
    address: 'No',
    city: '',
    state: ''
  };

  const invalidResult = validateShippingForm(invalidData);
  assert.equal(invalidResult.isValid, false);
  assert.ok(invalidResult.errors.phone.length > 0);
  assert.ok(invalidResult.errors.pincode.length > 0);
  assert.ok(invalidResult.errors.fullName.length > 0);
});

test('generateOrderId formats order identifier with ACW prefix and year', () => {
  const orderId = generateOrderId();
  const currentYear = new Date().getFullYear().toString();
  assert.ok(orderId.startsWith(`ACW-${currentYear}-`));
});

test('calculateEstimatedDelivery returns valid delivery range', () => {
  const baseDate = new Date('2026-11-01T10:00:00Z');
  const estimate = calculateEstimatedDelivery(baseDate);
  assert.ok(estimate.includes('4-7 Business Days'));
});

test('generateOwnerMailtoLink compiles recipient, subject, customer info, and items correctly', () => {
  const sampleOrder = {
    orderId: 'ACW-2026-TEST1',
    total: 4999,
    subtotal: 4999,
    deliveryFee: 0,
    items: [
      {
        id: 'prod-1',
        title: 'Traditional Gold Nettipatam 3ft',
        price: 4999,
        imageUrl: '',
        category: 'Nettipatam',
        quantity: 1
      }
    ],
    shipping: {
      fullName: 'Sujith Kumar',
      phone: '9847123456',
      pincode: '680001',
      address: '12 Temple Lane, Palace Road',
      city: 'Thrissur',
      state: 'Kerala'
    },
    paymentMethod: 'UPI'
  };

  const { subject, body, mailtoUrl } = generateOwnerMailtoLink(sampleOrder);

  assert.equal(subject, 'NEW ORDER #ACW-2026-TEST1 - Tharavadu Store');
  assert.ok(mailtoUrl.startsWith('mailto:sujajayadevan1@gmail.com'));
  assert.ok(mailtoUrl.includes(encodeURIComponent('NEW ORDER #ACW-2026-TEST1 - Tharavadu Store')));
  assert.ok(body.includes('Order ID: ACW-2026-TEST1'));
  assert.ok(body.includes('Customer Name: Sujith Kumar'));
  assert.ok(body.includes('Phone Number: 9847123456'));
  assert.ok(body.includes('PIN Code: 680001'));
  assert.ok(body.includes('Traditional Gold Nettipatam 3ft'));
  assert.ok(body.includes('TOTAL PAYABLE: ₹4,999'));
});

test('buildWeb3FormsPayload formats payload with access_key, subject, message, and customer details', () => {
  const sampleOrder = {
    orderId: 'ACW-2026-W3F01',
    total: 3100,
    subtotal: 3100,
    deliveryFee: 0,
    items: [
      {
        id: 'prod-2',
        title: 'Miniature Desk Caparison (Nettipatam)',
        price: 1299,
        imageUrl: '',
        category: 'Nettipatam',
        quantity: 2
      }
    ],
    shipping: {
      fullName: 'Gita Menon',
      phone: '9846001122',
      pincode: '682016',
      address: 'House 5, MG Road',
      city: 'Kochi',
      state: 'Kerala'
    },
    paymentMethod: 'Cash on Delivery (COD)'
  };

  const payload = buildWeb3FormsPayload(sampleOrder, 'ab37735a-a596-4911-ad66-bc4fa8841979', 'gita@example.com');

  assert.equal(payload.access_key, 'ab37735a-a596-4911-ad66-bc4fa8841979');
  assert.equal(payload.subject, 'New Order #ACW-2026-W3F01 - Tharavadu Store');
  assert.equal(payload.email, 'gita@example.com');
  assert.equal(payload.customer_name, 'Gita Menon');
  assert.equal(payload.customer_phone, '9846001122');
  assert.equal(payload.pin_code, '682016');
  assert.ok(payload.message.includes('Order ID: ACW-2026-W3F01'));
  assert.ok(payload.message.includes('Miniature Desk Caparison (Nettipatam)'));
  assert.ok(payload.message.includes('TOTAL PAYABLE: ₹3,100'));
});

test('isStoreOwnerEmail only permits sujajayadevan1@gmail.com', () => {
  assert.equal(isStoreOwnerEmail('sujajayadevan1@gmail.com'), true);
  assert.equal(isStoreOwnerEmail('  SUJAJAYADEVAN1@GMAIL.COM  '), true);
  assert.equal(isStoreOwnerEmail('someoneelse@gmail.com'), false);
  assert.equal(isStoreOwnerEmail('admin@ammascrafts.com'), false);
  assert.equal(isStoreOwnerEmail(''), false);
  assert.equal(isStoreOwnerEmail(null), false);
  assert.equal(isStoreOwnerEmail(undefined), false);
});

test('buildWhatsAppOrderMessage & buildWhatsAppOrderUrl compile receipt and wa.me link for 919846140051', () => {
  const sampleOrder = {
    orderId: 'ACW-2026-WA984',
    total: 3500,
    subtotal: 3500,
    deliveryFee: 0,
    items: [
      {
        id: 'prod-10',
        title: 'Traditional Gold Nettipatam 3ft',
        price: 3500,
        imageUrl: '',
        category: 'Nettipatam',
        quantity: 1
      }
    ],
    shipping: {
      fullName: 'Lakshmi Nair',
      phone: '9847000111',
      pincode: '680020',
      address: 'Temple View Villa, Chembukkavu',
      city: 'Thrissur',
      state: 'Kerala'
    },
    paymentMethod: 'UPI'
  };

  const message = buildWhatsAppOrderMessage(sampleOrder);
  assert.ok(message.includes('#ACW-2026-WA984'), 'Must contain Order Reference ID');
  assert.ok(message.includes('Lakshmi Nair'), 'Must contain customer name');
  assert.ok(message.includes('9847000111'), 'Must contain phone number');
  assert.ok(message.includes('Temple View Villa, Chembukkavu'), 'Must contain delivery address');
  assert.ok(message.includes('Thrissur'), 'Must contain city');
  assert.ok(message.includes('680020'), 'Must contain PIN code');
  assert.ok(message.includes('UPI'), 'Must contain payment method');
  assert.ok(message.includes('Traditional Gold Nettipatam 3ft'), 'Must contain item name');
  assert.ok(message.includes('₹3,500'), 'Must contain price');

  const waUrl = buildWhatsAppOrderUrl(sampleOrder);
  assert.ok(waUrl.startsWith('https://wa.me/919846140051?text='), 'Must target 919846140051');
  assert.ok(waUrl.includes(encodeURIComponent('#ACW-2026-WA984')));
  assert.ok(waUrl.includes(encodeURIComponent('Lakshmi Nair')));
});

