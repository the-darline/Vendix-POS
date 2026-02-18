
import React, { useState } from 'react';
import { BusinessSettings, Currency } from '../types';

interface SettingsViewProps {
  settings: BusinessSettings;
  updateSettings: (settings: BusinessSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, updateSettings }) => {
  const [form, setForm] = useState<BusinessSettings>(settings);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-4xl pb-32 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Paramètres Entreprise</h1>
        <p className="text-gray-500">Configurez l'identité de votre business et personnalisez votre POS</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <i className="fas fa-info-circle text-vendix"></i> Informations Générales
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nom de l'entreprise</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix font-bold"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Adresse</label>
                <textarea
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix text-sm"
                  rows={2}
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Téléphone</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix font-bold"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <i className="fas fa-palette text-vendix"></i> Personnalisation
            </h3>
            
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative group">
                {form.logo ? (
                  <img src={form.logo} className="w-full h-full object-contain" />
                ) : (
                  <i className="fas fa-image text-gray-300 text-3xl"></i>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoUpload} />
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Cliquez pour changer le logo</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Couleur principale du thème</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    className="w-16 h-12 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden"
                    value={form.primaryColor}
                    onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                  />
                  <div className="flex-grow">
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix font-mono text-sm"
                      value={form.primaryColor}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message de remerciement</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix text-sm"
                  value={form.thankYouMessage}
                  onChange={e => setForm({ ...form, thankYouMessage: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm md:col-span-2">
            <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <i className="fas fa-coins text-vendix"></i> Finance et Devises
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Devise de stockage par défaut</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix font-bold"
                  value={form.defaultCurrency}
                  onChange={e => setForm({ ...form, defaultCurrency: e.target.value as Currency })}
                >
                  <option value={Currency.USD}>USD ($)</option>
                  <option value={Currency.HTG}>HTG (G)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Taux de conversion (1 USD = X HTG)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">G</span>
                  <input
                    type="number"
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus-vendix font-bold"
                    value={form.conversionRate}
                    onChange={e => setForm({ ...form, conversionRate: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-vendix text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-vendix transition-all transform active:scale-95 w-full md:w-auto"
        >
          ENREGISTRER LES MODIFICATIONS
        </button>
      </form>

      {showToast && (
        <div className="fixed bottom-20 lg:bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 z-[100]">
          <i className="fas fa-check-circle text-xl"></i>
          <span className="font-bold">Paramètres mis à jour !</span>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
