
export enum Currency {
  USD = 'USD',
  HTG = 'HTG'
}

export enum PaymentMethod {
  CASH = 'Cash',
  MONCASH = 'MonCash',
  NATCASH = 'NatCash',
  BANK = 'Virement'
}

export interface Product {
  id: string;
  name: string;
  price: number; // Stored in base currency (defined in settings)
  barcode: string;
  stock: number;
  image: string; // base64
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: Currency;
  rate: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  change: number;
}

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  logo: string; // base64
  defaultCurrency: Currency;
  conversionRate: number; // 1 USD = X HTG
  thankYouMessage: string;
  primaryColor: string; // Hex color for theme customization
  moncashQr?: string; // base64 QR Code MonCash
  natcashQr?: string; // base64 QR Code NatCash
}

export interface User {
  username: string;
  passwordHash: string;
}

export type View = 'POS' | 'INVENTORY' | 'HISTORY' | 'SETTINGS';
