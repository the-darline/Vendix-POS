
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  Currency, 
  Product, 
  Sale, 
  BusinessSettings, 
  User 
} from './types';
import LoginView from './components/LoginView';
import POSView from './components/POSView';
import InventoryView from './components/InventoryView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import LicenseView from './components/LicenseView';

const VALID_KEYS = [
  "VENDIX-20261231-AB12",
  "VENDIX-20261231-CD34",
  "VENDIX-20261231-EF56",
  "VENDIX-20270101-GH78",
  "VENDIX-20270101-IJ90",
];

const STORAGE_KEYS = {
  USER: 'pos_user',
  SESSION: 'pos_session',
  PRODUCTS: 'pos_produits',
  SALES: 'pos_ventes',
  SETTINGS: 'pos_settings',
  LICENSE: 'vendix_license'
};

const DEFAULT_SETTINGS: BusinessSettings = {
  name: 'Vendix POS',
  address: 'Port-au-Prince, Haïti',
  phone: '+509 0000-0000',
  logo: '',
  defaultCurrency: Currency.HTG,
  conversionRate: 130,
  thankYouMessage: 'Merci de votre visite !',
  primaryColor: '#2563eb'
};

// Type pour le résultat de la vérification de licence (Union discriminée)
type LicenseResult = 
  | { valid: true; joursReste: number; expiry: string }
  | { valid: false; message: string };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLicenseValid, setIsLicenseValid] = useState<boolean>(false);
  const [licenseError, setLicenseError] = useState<string>('');
  
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<Currency>(Currency.HTG);

  // Vérification de la licence avec typage explicite
  const verifyLicense = (key: string): LicenseResult => {
    const keyUpper = key.toUpperCase().trim();
    if (!VALID_KEYS.includes(keyUpper)) {
      return { valid: false, message: "Clé de licence invalide !" };
    }
    const parts = keyUpper.split('-');
    if (parts.length !== 3) {
      return { valid: false, message: "Format de clé incorrect !" };
    }
    const expiry = parts[1];
    const year  = expiry.substring(0, 4);
    const month = expiry.substring(4, 6);
    const day   = expiry.substring(6, 8);
    const expiryDate = new Date(`${year}-${month}-${day}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (today > expiryDate) {
      return { valid: false, message: "Licence expirée ! Contactez le support Vendix." };
    }
    
    const diff = expiryDate.getTime() - today.getTime();
    const joursReste = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return { 
      valid: true, 
      joursReste: joursReste, 
      expiry: expiryDate.toLocaleDateString('fr-FR') 
    };
  };

  const checkLicense = () => {
    const savedKey = localStorage.getItem(STORAGE_KEYS.LICENSE);
    if (!savedKey) {
      setIsLicenseValid(false);
      return;
    }
    const result = verifyLicense(savedKey);
    // Use explicit equality check to help TypeScript narrow the discriminated union
    if (result.valid === false) {
      localStorage.removeItem(STORAGE_KEYS.LICENSE);
      setIsLicenseValid(false);
      setLicenseError(result.message);
      return;
    }
    // Ici result.valid est true, donc joursReste est garanti par le type LicenseResult
    if (result.joursReste <= 7) {
      alert(`⚠️ Votre licence expire dans ${result.joursReste} jour(s) ! Renouvelez vite.`);
    }
    setIsLicenseValid(true);
  };

  const handleActivateLicense = (key: string) => {
    const result = verifyLicense(key);
    // Use explicit equality check to help TypeScript narrow the discriminated union
    if (result.valid === true) {
      localStorage.setItem(STORAGE_KEYS.LICENSE, key.toUpperCase().trim());
      setIsLicenseValid(true);
      setLicenseError('');
      alert(`✅ Licence activée avec succès !\nExpire le : ${result.expiry}`);
    } else {
      // result is now correctly narrowed to { valid: false; message: string }
      setLicenseError(result.message);
    }
  };

  useEffect(() => {
    checkLicense();

    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);

    if (storedUser) setUser(JSON.parse(storedUser));
    if (session) setIsAuthenticated(true);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      setActiveCurrency(parsed.defaultCurrency);
    }
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedSales) setSales(JSON.parse(storedSales));
  }, []);

  useEffect(() => {
    const styleId = 'dynamic-vendix-theme';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    const color = settings.primaryColor;
    
    styleElement.innerHTML = `
      :root {
        --vendix-primary: ${color};
        --vendix-primary-soft: ${color}1a;
        --vendix-primary-glow: ${color}4d;
      }
      .bg-vendix { background-color: var(--vendix-primary) !important; }
      .bg-vendix-soft { background-color: var(--vendix-primary-soft) !important; }
      .text-vendix { color: var(--vendix-primary) !important; }
      .border-vendix { border-color: var(--vendix-primary) !important; }
      .shadow-vendix { box-shadow: 0 10px 15px -3px var(--vendix-primary-glow), 0 4px 6px -4px rgba(0,0,0,0.1) !important; }
      .focus-vendix:focus { border-color: var(--vendix-primary) !important; box-shadow: 0 0 0 4px var(--vendix-primary-glow) !important; }
      .hover-vendix:hover { filter: brightness(1.1); }
      .active-vendix:active { filter: brightness(0.9); transform: scale(0.95); }
    `;
  }, [settings.primaryColor]);

  const handleLogin = (u: User) => {
    setUser(u);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
    localStorage.setItem(STORAGE_KEYS.SESSION, 'active');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  };

  const updateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
  };

  const addSale = (sale: Sale) => {
    const updatedSales = [sale, ...sales];
    setSales(updatedSales);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

    const updatedProducts = products.map(p => {
      const cartItem = sale.items.find(item => item.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });
    updateProducts(updatedProducts);
  };

  const handleUpdateSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  };

  if (!isLicenseValid) {
    return <LicenseView onActivate={handleActivateLicense} error={licenseError} />;
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} existingUser={user} themeColor={settings.primaryColor} />;
  }

  return (
    <div id="mainApp">
      <HashRouter>
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-gray-50">
          <nav className="hidden lg:flex bg-slate-900 text-white w-64 flex-shrink-0 flex-col shadow-xl z-20 no-print">
            <div className="p-6">
              <h1 className="text-xl font-black text-vendix flex items-center gap-2">
                <i className="fas fa-cash-register"></i> {settings.name}
              </h1>
            </div>

            <div className="flex-grow flex flex-col">
              <NavLink to="/" icon="fa-shopping-cart" label="Point de Vente" />
              <NavLink to="/inventory" icon="fa-box" label="Stock" />
              <NavLink to="/history" icon="fa-history" label="Ventes" />
              <NavLink to="/settings" icon="fa-cog" label="Paramètres" />
            </div>

            <div className="p-4 mt-auto border-t border-slate-800">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="bg-vendix w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-vendix">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <span className="truncate text-sm opacity-80">{user?.username}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-all text-sm font-bold"
              >
                <i className="fas fa-sign-out-alt"></i> Déconnexion
              </button>
            </div>
          </nav>

          <div className="flex-grow flex flex-col h-full overflow-hidden">
            <header className="bg-white border-b border-gray-200 h-14 lg:h-16 flex-shrink-0 flex items-center justify-between px-4 lg:px-6 z-10 no-print">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-800 lg:hidden truncate max-w-[150px]">{settings.name}</h2>
                <div className="flex bg-gray-100 rounded-lg p-1 scale-90 lg:scale-100 origin-left">
                  <button 
                    onClick={() => setActiveCurrency(Currency.USD)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeCurrency === Currency.USD ? 'bg-white shadow-sm text-vendix' : 'text-gray-500'}`}
                  >
                    $ USD
                  </button>
                  <button 
                    onClick={() => setActiveCurrency(Currency.HTG)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeCurrency === Currency.HTG ? 'bg-white shadow-sm text-vendix' : 'text-gray-500'}`}
                  >
                    G HTG
                  </button>
                </div>
              </div>
              
              <div className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-widest">
                <span className="hidden sm:inline">1 USD = {settings.conversionRate} HTG</span>
              </div>
            </header>

            <main className="flex-grow overflow-auto relative">
              <Routes>
                <Route path="/" element={<POSView products={products} settings={settings} activeCurrency={activeCurrency} onCompleteSale={addSale} />} />
                <Route path="/inventory" element={<InventoryView products={products} updateProducts={updateProducts} settings={settings} activeCurrency={activeCurrency} />} />
                <Route path="/history" element={<HistoryView sales={sales} settings={settings} />} />
                <Route path="/settings" element={<SettingsView settings={settings} updateSettings={handleUpdateSettings} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <nav className="lg:hidden flex bg-white border-t border-gray-200 h-16 flex-shrink-0 items-center justify-around no-print pb-safe">
              <MobileNavLink to="/" icon="fa-shopping-cart" label="POS" />
              <MobileNavLink to="/inventory" icon="fa-box" label="Stock" />
              <MobileNavLink to="/history" icon="fa-history" label="Ventes" />
              <MobileNavLink to="/settings" icon="fa-cog" label="Paramètres" />
              <button onClick={handleLogout} className="flex flex-col items-center justify-center text-red-400 p-2">
                <i className="fas fa-sign-out-alt text-lg"></i>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Quitter</span>
              </button>
            </nav>
          </div>
        </div>
      </HashRouter>
    </div>
  );
};

const NavLink: React.FC<{ to: string, icon: string, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 py-4 px-6 transition-all border-l-4 ${isActive ? 'bg-slate-800 border-vendix text-vendix' : 'border-transparent text-gray-400 hover:text-gray-100'}`}
    >
      <i className={`fas ${icon} w-5`}></i>
      <span className="font-bold text-sm uppercase tracking-wider">{label}</span>
    </Link>
  );
};

const MobileNavLink: React.FC<{ to: string, icon: string, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center flex-1 p-2 transition-all ${isActive ? 'text-vendix' : 'text-gray-400'}`}
    >
      <i className={`fas ${icon} text-lg`}></i>
      <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{label}</span>
    </Link>
  );
};

export default App;
