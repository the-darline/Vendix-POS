
import React, { useState, useMemo } from 'react';
import { Product, BusinessSettings, Currency, CartItem, Sale, PaymentMethod } from '../types';
import ReceiptModal from './ReceiptModal';

interface POSViewProps {
  products: Product[];
  settings: BusinessSettings;
  activeCurrency: Currency;
  onCompleteSale: (sale: Sale) => void;
}

const POSView: React.FC<POSViewProps> = ({ products, settings, activeCurrency, onCompleteSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.barcode.includes(search)
    );
  }, [products, search]);

  const convertPrice = (price: number, toCurrency: Currency) => {
    if (settings.defaultCurrency === toCurrency) return price;
    if (settings.defaultCurrency === Currency.USD && toCurrency === Currency.HTG) return price * settings.conversionRate;
    return price / settings.conversionRate;
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        const product = products.find(p => p.id === id);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = useMemo(() => {
    const totalInBase = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return convertPrice(totalInBase, activeCurrency);
  }, [cart, activeCurrency, settings]);

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);
  const change = useMemo(() => (paymentMethod === PaymentMethod.CASH ? Math.max(0, amountReceived - total) : 0), [amountReceived, total, paymentMethod]);

  const handleComplete = () => {
    if (cart.length === 0) return;
    if (paymentMethod === PaymentMethod.CASH && amountReceived < total) {
      alert("Montant reçu insuffisant");
      return;
    }

    const sale: Sale = {
      id: `REC-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discount,
      total,
      currency: activeCurrency,
      rate: settings.conversionRate,
      paymentMethod,
      amountReceived: paymentMethod === PaymentMethod.CASH ? amountReceived : total,
      change
    };

    onCompleteSale(sale);
    setLastSale(sale);
    setCart([]);
    setDiscount(0);
    setAmountReceived(0);
    setSearch('');
    setIsCartOpen(false);
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-gray-50">
      {/* Product Selection Area */}
      <div className="flex-grow flex flex-col p-4 lg:p-6 h-full overflow-hidden no-print">
        <div className="flex gap-2 lg:gap-4 mb-4 lg:mb-6 flex-shrink-0">
          <div className="relative flex-grow">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Rechercher produit..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-sm lg:text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsScanning(!isScanning)}
            className={`w-12 lg:w-auto lg:px-6 rounded-2xl flex items-center justify-center gap-2 transition-all ${isScanning ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}
          >
            <i className={`fas ${isScanning ? 'fa-times' : 'fa-barcode'}`}></i>
            <span className="hidden lg:inline font-bold">{isScanning ? 'Arrêter' : 'Scanner'}</span>
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 lg:gap-4 overflow-y-auto pr-1 pb-24 lg:pb-2">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`group bg-white p-2 lg:p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex flex-col relative ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-2 border border-gray-50">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <i className="fas fa-image text-2xl lg:text-3xl"></i>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-800 truncate text-[11px] lg:text-sm mb-1">{product.name}</h3>
              <p className="text-blue-600 font-black text-sm lg:text-base mt-auto">
                {convertPrice(product.price, activeCurrency).toLocaleString()} {activeCurrency === Currency.HTG ? 'G' : '$'}
              </p>
              <div className={`text-[8px] lg:text-[10px] uppercase font-black mt-1 px-2 py-0.5 rounded self-start ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {product.stock} Dispo
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400">
              <i className="fas fa-box-open text-5xl mb-4 opacity-20"></i>
              <p className="font-bold">Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button - Visible on lg and below */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="lg:hidden fixed bottom-20 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-90 no-print"
      >
        <div className="relative">
          <i className="fas fa-shopping-basket text-xl"></i>
          {cart.length > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
        </div>
      </button>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 z-[45] transition-opacity duration-300 lg:hidden no-print ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsCartOpen(false)}
      ></div>
      
      {/* Cart Panel - Desktop Sidebar / Mobile & Tablet Drawer */}
      <aside className={`
        fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto no-print
        w-full sm:w-80 md:w-[350px] lg:w-[400px] bg-white flex flex-col h-full shadow-2xl transition-transform duration-300 transform
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
            <i className="fas fa-shopping-basket text-blue-500"></i> Panier
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 lg:p-6 space-y-3 bg-white">
          {cart.map(item => (
            <div key={item.id} className="flex gap-3 bg-gray-50 p-2 lg:p-3 rounded-2xl border border-gray-100 group transition-all">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><i className="fas fa-box text-sm"></i></div>}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-gray-800 truncate text-[11px] leading-tight mb-1">{item.name}</h4>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">
                  {(convertPrice(item.price, activeCurrency) * item.quantity).toLocaleString()} {activeCurrency === Currency.HTG ? 'G' : '$'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 transition-all flex items-center justify-center active:scale-90">
                  <i className="fas fa-minus text-[8px]"></i>
                </button>
                <span className="font-black text-xs w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-green-500 transition-all flex items-center justify-center active:scale-90">
                  <i className="fas fa-plus text-[8px]"></i>
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center justify-center h-full opacity-30">
              <i className="fas fa-shopping-cart text-5xl mb-4"></i>
              <p className="font-bold text-xs uppercase tracking-widest">Votre panier est vide</p>
            </div>
          )}
        </div>

        <div className="p-4 lg:p-6 bg-gray-50 border-t border-gray-100 space-y-4 pb-24 lg:pb-6 flex-shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString()} {activeCurrency === Currency.HTG ? 'G' : '$'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Remise</span>
              <input 
                type="number" 
                value={discount || ''} 
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 px-3 py-1 text-right border border-gray-200 rounded-lg outline-none font-black text-blue-600 bg-white shadow-sm"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-gray-200">
              <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter mb-1">TOTAL À PAYER</span>
              <div className="text-right">
                <p className="text-3xl lg:text-4xl font-black text-blue-600 leading-none">{total.toLocaleString()}</p>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                  {activeCurrency === Currency.HTG ? 'Gourdes' : 'Dollars'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            {Object.values(PaymentMethod).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-1 rounded-xl text-[9px] font-black transition-all border uppercase tracking-tighter leading-none h-8 flex items-center justify-center ${paymentMethod === method ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-400 hover:border-slate-300'}`}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === PaymentMethod.CASH && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Montant Reçu Cash</label>
              <input
                type="number"
                value={amountReceived || ''}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="0.00"
              />
              {amountReceived > 0 && (
                <div className="mt-2 flex justify-between items-center bg-green-50 text-green-700 p-2.5 rounded-xl border border-green-100">
                  <span className="text-[9px] font-black uppercase">Monnaie</span>
                  <span className="text-base font-black">{change.toLocaleString()} {activeCurrency === Currency.HTG ? 'G' : '$'}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleComplete}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs lg:text-sm uppercase tracking-widest"
          >
            <i className="fas fa-check-circle text-lg"></i> Valider la vente
          </button>
        </div>
      </aside>

      {lastSale && (
        <ReceiptModal 
          sale={lastSale} 
          settings={settings} 
          onClose={() => setLastSale(null)} 
        />
      )}
    </div>
  );
};

export default POSView;
