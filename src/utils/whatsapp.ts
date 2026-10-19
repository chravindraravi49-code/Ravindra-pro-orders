import { Order } from '../types';

/**
 * Clean phone number for WhatsApp link (removes spaces, dashes, parentheses)
 * Ensures international format (defaults to India 91 if 10 digits provided)
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Builds standard WhatsApp click-to-chat URL
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumberForWhatsApp(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates formatted WhatsApp message for student to send to Shop Owner
 */
export function generateStudentOrderWhatsAppMessage(order: Order, shopName: string = 'Ravindra Pro Shop'): string {
  const dateFormatted = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const itemsList = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}*\n   Qty: ${item.quantity} × ₹${item.price} = *₹${item.quantity * item.price}*`
    )
    .join('\n');

  return `🛒 *NEW HOSTEL ORDER - ${shopName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* #${order.id.slice(-8).toUpperCase()}
📅 *Date & Time:* ${dateFormatted}

👤 *Student Details:*
• *Name:* ${order.customerName}
• *Hostel Block:* ${order.hostelBlock}
• *Room Number:* *${order.hostelRoom}*
• *Contact Phone:* ${order.customerPhone || 'Not provided'}
${order.instructions ? `• *Special Instructions:* _"${order.instructions}"_\n` : ''}
📋 *Ordered Items:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ₹${order.subtotal}
🛵 *Delivery Charge:* ${order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
💵 *TOTAL AMOUNT DUE:* *₹${order.total}*
💳 *Payment Mode:* Cash on Delivery (COD)

_Please confirm acceptance and dispatch to my hostel room. Thank you!_`;
}

/**
 * Generates formatted WhatsApp message for Shop Owner to dispatch to Delivery Person
 */
export function generateDeliveryStaffWhatsAppMessage(order: Order, deliveryStaffName: string): string {
  const itemsSummary = order.items
    .map((item) => `• ${item.quantity}x ${item.name} (₹${item.quantity * item.price})`)
    .join('\n');

  return `🛵 *DELIVERY TASK ASSIGNED - RAVINDRA PRO*
━━━━━━━━━━━━━━━━━━━━
Hello *${deliveryStaffName}*, you have been assigned an order for delivery:

📦 *Order ID:* #${order.id.slice(-8).toUpperCase()}
🏠 *Delivery Location:*
• *${order.hostelBlock}*
• *Room Number: ${order.hostelRoom}*

👤 *Customer:* ${order.customerName}
📞 *Call Customer:* ${order.customerPhone || 'Not provided'}
${order.instructions ? `📝 *Note:* _"${order.instructions}"_\n` : ''}
📦 *Items to Deliver:*
${itemsSummary}

💵 *Cash to Collect on Delivery:* *₹${order.total}*

_Please collect items from the shop counter, mark 'Preparing / Out for Delivery' in your app, and deliver promptly!_`;
}
