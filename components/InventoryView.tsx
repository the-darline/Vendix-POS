
import React, { useState, useMemo } from 'react';
import { Product, BusinessSettings, Currency } from '../types';

interface InventoryViewProps {
  products: Product[];
  updateProducts: (products: Product[]) => void;
  settings: BusinessSettings;
  activeCurrency: Currency;
}

const InventoryView: React.FC<InventoryViewProps> = ({ products, updateProducts, settings, activeCurrency }) => {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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

  const openAddModal = () => {
    setEditingProduct({ id: `P-${Date.now()}`, name: '', price: 0, barcode: '', stock: 0, image: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct({ ...p });
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      updateProducts(products.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const newProduct = editingProduct as Product;
    const exists = products.find(p => p.id === newProduct.id);

    if (exists) {
      updateProducts(products.map(p => p.id === newProduct.id ? newProduct : p));
    } else {
      updateProducts([...products, newProduct]);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct(prev => prev ? { ...prev, image: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'stock_pos_export.json');
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            updateProducts(imported);
            alert("Stock importé avec succès !");
          }
        } catch (err) {
          alert("Erreur lors de l'importation");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-8 pb-32 lg:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Gestion de Stock</h1>
          <p className="text-gray-500">{products.length} produits enregistrés</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all font-bold text-sm shadow-sm">
            <i className="fas fa-file-export"></i> Exporter
          </button>
          <label className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all font-bold text-sm cursor-pointer shadow-sm">
            <i className="fas fa-file-import"></i> Importer
            <input type="file" onChange={handleImport} className="hidden" accept=".json" />
          </label>
          <button onClick={openAddModal} className="bg-vendix text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:brightness-110 transition-all font-bold text-sm shadow-lg shadow-vendix">
            <i className="fas fa-plus"></i> Nouveau Produit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-grow max-w-md">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Rechercher par nom ou code-barre..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus-vendix outline-none text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4">Code-barre</th>
                <th className="px-6 py-4 text-right">Prix ({activeCurrency})</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                        {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fas fa-box"></i></div>}
                      </div>
                      <span className="font-bold text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-500">{p.barcode || '---'}</td>
                  <td className="px-6 py-4 text-right font-bold text-vendix">
                    {convertPrice(p.price, activeCurrency).toLocaleString()} {activeCurrency === Currency.HTG ? 'G' : '$'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {p.stock} en stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEditModal(p)} className="p-2 text-gray-400 hover:text-vendix transition-colors">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleDeleteRequest(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 font-bold">Aucun produit ne correspond à votre recherche</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Delete Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-500 text-sm mb-6">
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-grow py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-grow py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{editingProduct.id?.startsWith('P-') ? 'Nouveau Produit' : 'Modifier Produit'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nom du produit</label>
                    <input
                      required
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix"
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Code-barre</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix font-mono"
                        value={editingProduct.barcode}
                        onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-vendix"><i className="fas fa-barcode"></i></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Prix ({settings.defaultCurrency})</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix font-bold"
                        value={editingProduct.price}
                        onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Stock initial</label>
                      <input
                        required
                        type="number"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix font-bold"
                        value={editingProduct.stock}
                        onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-6 relative group overflow-hidden h-64 md:h-auto">
                  {editingProduct.image ? (
                    <>
                      <img src={editingProduct.image} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg font-bold shadow-lg">Changer</label>
                      </div>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt text-4xl text-gray-300 mb-2"></i>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">Glissez ou cliquez pour ajouter une image</p>
                    </>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-grow py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button type="submit" className="flex-grow py-3 bg-vendix text-white rounded-xl font-bold shadow-xl shadow-vendix hover:brightness-110 transition-all uppercase tracking-widest text-xs">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
