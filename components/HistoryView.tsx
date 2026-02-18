
import React, { useState, useMemo } from 'react';
import { Sale, BusinessSettings, Currency } from '../types';
import ReceiptModal from './ReceiptModal';

interface HistoryViewProps {
  sales: Sale[];
  settings: BusinessSettings;
}

const HistoryView: React.FC<HistoryViewProps> = ({ sales, settings }) => {
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase());
      const matchesDate = dateFilter ? s.date.startsWith(dateFilter) : true;
      return matchesSearch && matchesDate;
    });
  }, [sales, search, dateFilter]);

  const stats = useMemo(() => {
    const totalUSD = filteredSales
      .filter(s => s.currency === Currency.USD)
      .reduce((sum, s) => sum + s.total, 0);
    
    const totalHTG = filteredSales
      .filter(s => s.currency === Currency.HTG)
      .reduce((sum, s) => sum + s.total, 0);

    return { totalUSD, totalHTG, count: filteredSales.length };
  }, [filteredSales]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Historique des Ventes</h1>
        <p className="text-gray-500">Toutes vos transactions passées</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Nombre de ventes</p>
          <p className="text-3xl font-black text-gray-800">{stats.count}</p>
        </div>
        <div className="bg-blue-600 p-6 rounded-2xl border border-blue-500 shadow-xl shadow-blue-500/20 text-white">
          <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Total HTG (G)</p>
          <p className="text-3xl font-black">{stats.totalHTG.toLocaleString()} G</p>
        </div>
        <div className="bg-emerald-600 p-6 rounded-2xl border border-emerald-500 shadow-xl shadow-emerald-500/20 text-white">
          <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Total USD ($)</p>
          <p className="text-3xl font-black">$ {stats.totalUSD.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="relative flex-grow max-w-xs">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="N° Reçu..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input 
            type="date" 
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">ID / Date</th>
                <th className="px-6 py-4">Paiement</th>
                <th className="px-6 py-4">Articles</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredSales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{s.id}</div>
                    <div className="text-xs text-gray-400">{new Date(s.date).toLocaleString('fr-FR')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold">{s.paymentMethod}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {s.items.length} article(s)
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-800">
                    {s.currency === Currency.USD ? '$ ' : ''}
                    {s.total.toLocaleString()}
                    {s.currency === Currency.HTG ? ' G' : ''}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => setSelectedSale(s)} className="text-blue-500 hover:underline font-bold text-xs">
                      <i className="fas fa-receipt mr-1"></i> Reçu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <ReceiptModal 
          sale={selectedSale} 
          settings={settings} 
          onClose={() => setSelectedSale(null)} 
        />
      )}
    </div>
  );
};

export default HistoryView;
