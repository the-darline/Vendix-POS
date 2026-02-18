
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
  const [showQrModal, setShowQrModal] = useState(false);

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

  const finalizeSale = () => {
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
    setShowQrModal(false);
  };

  const handleCompleteRequest = () => {
    if (cart.length === 0) return;
    if (paymentMethod === PaymentMethod.CASH && amountReceived < total) {
      alert("Montant reçu insuffisant pour une vente au comptant (Cash)");
      return;
    }

    // Si MonCash ou NatCash est choisi et qu'un QR est configuré, on affiche le QR d'abord
    if ((paymentMethod === PaymentMethod.MONCASH && settings.moncashQr) || 
        (paymentMethod === PaymentMethod.NATCASH && settings.natcashQr)) {
      setShowQrModal(true);
    } else {
      finalizeSale();
    }
  };

  const currentQr = paymentMethod === PaymentMethod.MONCASH ? settings.moncashQr : settings.natcashQr;

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
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus-vendix outline-none shadow-sm transition-all text-sm lg:text-base"
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
              <p className="text-vendix font-black text-sm lg:text-base mt-auto">
                {convertPrice(product.price, activeCurrency).toLocaleString()} {activeCurrency === Currency.HTG ? 'G' : '$'}
              </p>
              <div className={`text-[8px] lg:text-[10px] uppercase font-black mt-1 px-2 py-0.5 rounded self-start ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {product.stock} Dispo
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="lg:hidden fixed bottom-20 right-6 w-16 h-16 bg-vendix text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-90 no-print shadow-vendix"
      >
        <div className="relative">
          <i className="fas fa-shopping-basket text-xl"></i>
          {cart.length > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
        </div>
      </button>

      {/* Cart Panel */}
      <aside className={`
        fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto no-print
        w-full sm:w-80 md:w-[350px] lg:w-[400px] bg-white flex flex-col h-full shadow-2xl transition-transform duration-300 transform
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
            <i className="fas fa-shopping-basket text-vendix"></i> Panier
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 text-gray-400"><i className="fas fa-times text-xl"></i></button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 lg:p-6 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex gap-3 bg-gray-50 p-2 lg:p-3 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <i className="fas fa-box text-sm text-gray-200 m-auto"></i>}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-gray-800 truncate text-[11px] leading-tight">{item.name}</h4>
                <p className="text-[10px] text-vendix font-black uppercase">
                  {(convertPrice(item.price, activeCurrency) * item.quantity).toLocaleString()} {activeCurrency}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center"><i className="fas fa-minus text-[8px]"></i></button>
                <span className="font-black text-xs w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center"><i className="fas fa-plus text-[8px]"></i></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 lg:p-6 bg-gray-50 border-t border-gray-100 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString()} {activeCurrency}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-400 uppercase">Remise</span>
              <input 
                type="number" 
                value={discount || ''} 
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 px-3 py-1 text-right border border-gray-200 rounded-lg outline-none font-black text-vendix"
              />
            </div>
            
            {/* Nouveau: Champ Montant Reçu et Rendu (uniquement pour Cash) */}
            {paymentMethod === PaymentMethod.CASH && (
              <div className="pt-2 mt-2 border-t border-gray-200 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-400 uppercase">Montant reçu</span>
                  <input 
                    type="number" 
                    value={amountReceived || ''} 
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="w-24 px-3 py-1 text-right border border-gray-200 rounded-lg outline-none font-black text-emerald-600 focus:ring-1 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-black">
                  <span className="text-gray-400 uppercase">Monnaie à rendre</span>
                  <span className={change > 0 ? 'text-emerald-600' : 'text-gray-400'}>
                    {change.toLocaleString()} {activeCurrency}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-end pt-3 border-t border-gray-200">
              <span className="text-[11px] font-black text-gray-800 uppercase mb-1">TOTAL À PAYER</span>
              <div className="text-right">
                <p className="text-3xl lg:text-4xl font-black text-vendix">{total.toLocaleString()}</p>
                <p className="text-[10px] font-black text-vendix uppercase tracking-widest">{activeCurrency}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(PaymentMethod).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 rounded-xl text-[9px] font-black transition-all border uppercase tracking-tighter h-8 ${paymentMethod === method ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-400'}`}
              >
                {method}
              </button>
            ))}
          </div>

          <button
            onClick={handleCompleteRequest}
            disabled={cart.length === 0}
            className="w-full bg-vendix text-white font-black py-4 rounded-2xl shadow-xl shadow-vendix transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            <i className="fas fa-check-circle mr-2"></i> Valider la vente
          </button>
        </div>
      </aside>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in duration-300">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 ${paymentMethod === PaymentMethod.MONCASH ? 'bg-red-600 shadow-lg shadow-red-500/30' : 'bg-blue-600 shadow-lg shadow-blue-500/30'}`}>
              <i className="fas fa-mobile-alt"></i>
            </div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tighter mb-2">Paiement {paymentMethod}</h3>
            <p className="text-gray-500 text-sm mb-6 font-bold uppercase tracking-widest">Scannez pour payer {total.toLocaleString()} {activeCurrency}</p>
            
            <div className="w-full aspect-square bg-gray-50 rounded-3xl border-4 border-gray-100 flex items-center justify-center mb-8 overflow-hidden shadow-inner p-4">
              <img src={currentQr} alt="QR Code Paiement" className="w-full h-full object-contain rounded-xl" />
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowQrModal(false)}
                className="flex-grow py-4 border border-gray-200 rounded-2xl font-black text-gray-400 uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={finalizeSale}
                className="flex-grow py-4 bg-vendix text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-vendix hover:brightness-110 transition-all"
              >
                Confirmer Paiement
              </button>
            </div>
          </div>
        </div>
      )}

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
