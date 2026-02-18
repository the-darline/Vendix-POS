
import React from 'react';
import { Sale, BusinessSettings, Currency } from '../types';

interface ReceiptModalProps {
  sale: Sale;
  settings: BusinessSettings;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert("Veuillez autoriser les popups pour l'impression");
      return;
    }

    const itemsHtml = sale.items.map(item => {
      const salePrice = sale.currency === settings.defaultCurrency ? item.price : (sale.currency === Currency.USD ? item.price / sale.rate : item.price * sale.rate);
      return `
        <tr>
          <td style="padding: 4px 0;">${item.name}</td>
          <td style="text-align: center;">x${item.quantity}</td>
          <td style="text-align: right;">${(salePrice * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Imprimer Reçu - ${sale.id}</title>
        <style>
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            width: 72mm; 
            margin: 0 auto; 
            padding: 5mm;
            color: black;
          }
          .header { text-align: center; margin-bottom: 10px; }
          .logo { max-height: 40px; margin-bottom: 5px; }
          .title { font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; }
          .divider { border-top: 1px dashed black; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          .totals { margin-top: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-style: italic; font-size: 10px; }
          @media print {
            body { margin: 0; padding: 5mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.logo ? `<img src="${settings.logo}" class="logo">` : ''}
          <div class="title">${settings.name}</div>
          <div style="font-size: 10px; margin-top: 2px;">${settings.address}</div>
          <div style="font-weight: bold;">Tél: ${settings.phone}</div>
        </div>
        
        <div class="divider"></div>
        
        <div>REÇU: ${sale.id}</div>
        <div>DATE: ${new Date(sale.date).toLocaleString('fr-FR')}</div>
        
        <div class="divider"></div>
        
        <table>
          <thead>
            <tr style="border-bottom: 1px solid black; text-align: left;">
              <th>Article</th>
              <th style="text-align: center;">Qté</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div class="totals">
          <div style="display: flex; justify-content: space-between;">
            <span>Sous-total:</span>
            <span>${sale.subtotal.toFixed(2)} ${sale.currency}</span>
          </div>
          ${sale.discount > 0 ? `
          <div style="display: flex; justify-content: space-between;">
            <span>Remise:</span>
            <span>-${sale.discount.toFixed(2)} ${sale.currency}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 5px; border-top: 1px solid black; padding-top: 5px;">
            <span>TOTAL:</span>
            <span>${sale.total.toLocaleString()} ${sale.currency === Currency.HTG ? 'G' : '$'}</span>
          </div>
        </div>
        
        <div style="margin-top: 10px; font-size: 10px;">
          <div>Paiement: ${sale.paymentMethod}</div>
          ${sale.paymentMethod === 'Cash' ? `
          <div>Reçu: ${sale.amountReceived.toLocaleString()}</div>
          <div>Rendu: ${sale.change.toLocaleString()}</div>
          ` : ''}
        </div>
        
        <div class="footer">
          *** ${settings.thankYouMessage} ***
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePDF = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200]
    });

    const margin = 5;
    let y = 10;

    doc.setFontSize(14);
    doc.text(settings.name, 40, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.text(settings.address, 40, y, { align: 'center' });
    y += 4;
    doc.text(`Tél: ${settings.phone}`, 40, y, { align: 'center' });
    y += 8;

    doc.text(`Reçu: ${sale.id}`, margin, y);
    y += 4;
    doc.text(`Date: ${new Date(sale.date).toLocaleString('fr-FR')}`, margin, y);
    y += 6;

    doc.setFont(undefined, 'bold');
    doc.text("Article", margin, y);
    doc.text("Qté", 40, y);
    doc.text("Total", 75, y, { align: 'right' });
    y += 2;
    doc.line(margin, y, 75, y);
    y += 4;

    doc.setFont(undefined, 'normal');
    sale.items.forEach(item => {
      const salePrice = sale.currency === settings.defaultCurrency ? item.price : (sale.currency === Currency.USD ? item.price / sale.rate : item.price * sale.rate);
      doc.text(item.name.substring(0, 20), margin, y);
      doc.text(item.quantity.toString(), 40, y);
      doc.text((salePrice * item.quantity).toFixed(2), 75, y, { align: 'right' });
      y += 4;
    });

    y += 2;
    doc.line(margin, y, 75, y);
    y += 6;

    doc.text("Sous-total:", 40, y, { align: 'right' });
    doc.text(sale.subtotal.toFixed(2), 75, y, { align: 'right' });
    y += 4;
    if (sale.discount > 0) {
      doc.text("Remise:", 40, y, { align: 'right' });
      doc.text(`-${sale.discount.toFixed(2)}`, 75, y, { align: 'right' });
      y += 4;
    }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("TOTAL:", 40, y, { align: 'right' });
    doc.text(`${sale.total.toFixed(2)} ${sale.currency === Currency.HTG ? 'G' : '$'}`, 75, y, { align: 'right' });
    y += 8;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(settings.thankYouMessage, 40, y, { align: 'center' });

    doc.save(`recu_${sale.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 no-print overflow-y-auto">
      <div className="bg-white md:rounded-3xl shadow-2xl w-full max-w-lg min-h-screen md:min-h-0 overflow-hidden animate-in zoom-in duration-300 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <span className="text-[10px] font-black text-vendix bg-vendix-soft px-3 py-1 rounded-full uppercase tracking-widest">Vente Terminée</span>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors active:scale-90">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="flex-grow p-4 md:p-8 overflow-y-auto bg-white">
          <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm text-gray-800 font-mono text-xs leading-relaxed max-w-sm mx-auto">
            <div className="text-center mb-6">
              {settings.logo && <img src={settings.logo} className="h-14 mx-auto mb-4 object-contain" />}
              <h2 className="text-lg font-black uppercase tracking-tighter">{settings.name}</h2>
              <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{settings.address}</p>
              <p className="text-[9px] text-gray-500 font-black">{settings.phone}</p>
            </div>

            <div className="flex justify-between border-y border-dashed border-gray-200 py-3 mb-4 text-[10px]">
              <div>
                <p className="text-gray-400 uppercase font-black">N° Reçu</p>
                <p className="font-black text-gray-800">{sale.id}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 uppercase font-black">Date</p>
                <p className="font-black text-gray-800">{new Date(sale.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
            </div>

            <table className="w-full mb-6">
              <thead>
                <tr className="text-[9px] text-gray-400 uppercase font-black border-b border-gray-100">
                  <th className="text-left pb-2">Produit</th>
                  <th className="text-center pb-2">Qté</th>
                  <th className="text-right pb-2">P.U</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sale.items.map((item, i) => {
                  const salePrice = sale.currency === settings.defaultCurrency ? item.price : (sale.currency === Currency.USD ? item.price / sale.rate : item.price * sale.rate);
                  return (
                    <tr key={i} className="text-[10px]">
                      <td className="py-2 pr-2 font-bold text-gray-700">{item.name}</td>
                      <td className="py-2 text-center font-black">x{item.quantity}</td>
                      <td className="py-2 text-right font-black">{(salePrice * item.quantity).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="space-y-1 pt-3 mb-6 border-t border-gray-100">
              <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                <span>SOUS-TOTAL</span>
                <span>{sale.subtotal.toLocaleString()} {sale.currency === Currency.HTG ? 'G' : '$'}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-[10px] text-red-500 font-bold">
                  <span>REMISE</span>
                  <span>-{sale.discount.toLocaleString()} {sale.currency === Currency.HTG ? 'G' : '$'}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-slate-900">
                <span className="text-sm font-black uppercase tracking-tighter">TOTAL PAYÉ</span>
                <span className="text-xl font-black">{sale.total.toLocaleString()} {sale.currency === Currency.HTG ? 'G' : '$'}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-[10px] font-bold text-gray-500 space-y-1">
              <div className="flex justify-between uppercase">
                <span>Méthode</span>
                <span className="text-gray-800">{sale.paymentMethod}</span>
              </div>
              {sale.paymentMethod === 'Cash' && (
                <>
                  <div className="flex justify-between uppercase">
                    <span>Reçu</span>
                    <span className="text-gray-800">{sale.amountReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between uppercase text-green-600 font-black">
                    <span>Monnaie</span>
                    <span>{sale.change.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-center text-[9px] font-black text-gray-400 mt-6 italic">
              *** {settings.thankYouMessage} ***
            </p>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 flex-shrink-0">
          <button onClick={handlePrint} className="bg-white border border-gray-200 py-3 rounded-2xl font-black text-xs text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-2 active:scale-95 shadow-sm">
            <i className="fas fa-print"></i> IMPRIMER
          </button>
          <button onClick={handlePDF} className="bg-slate-900 text-white py-3 rounded-2xl font-black text-xs hover:bg-black flex items-center justify-center gap-2 active:scale-95">
            <i className="fas fa-file-pdf"></i> PDF
          </button>
          <button onClick={onClose} className="col-span-2 md:col-span-1 py-3 bg-vendix text-white rounded-2xl font-black text-xs shadow-vendix transition-all active-vendix">
            NOUVELLE VENTE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
