
import React, { useState } from 'react';

interface LicenseViewProps {
  onActivate: (key: string) => void;
  error: string;
}

const LicenseView: React.FC<LicenseViewProps> = ({ onActivate, error }) => {
  const [input, setInput] = useState('');

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onActivate(input);
    }
  };

  return (
    <div id="licenseScreen" style={{
      display: 'flex',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#0f0f1a',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '45px 40px',
        borderRadius: '20px',
        textAlign: 'center',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)'
      }}>
        {/* Logo / Titre */}
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔑</div>
        <h1 style={{ color: '#1a1a2e', fontSize: '28px', marginBottom: '5px', fontWeight: 'bold' }}>Vendix</h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '30px' }}>
          Entrez votre clé de licence pour accéder à l'application
        </p>

        {/* Input clé */}
        <input
          id="licenseInput"
          type="text"
          placeholder="VENDIX-XXXXXXXX-XXXX"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '15px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            textAlign: 'center',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '8px',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'monospace'
          }}
        />

        {/* Message erreur */}
        <p id="licenseError" style={{
          color: '#e53935',
          fontSize: '13px',
          marginBottom: '15px',
          minHeight: '20px',
          fontWeight: 500
        }}>
          {error}
        </p>

        {/* Bouton activer */}
        <button
          onClick={() => onActivate(input)}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg,#1565C0,#2196F3)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            letterSpacing: '1px',
            transition: 'opacity 0.2s'
          }}
        >
          Activer ma licence
        </button>

        {/* Contact support */}
        <div style={{
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <p style={{ color: '#aaa', fontSize: '12px' }}>
            Vous n'avez pas de clé ? Contactez le support
          </p>
          <p style={{
            color: '#2196F3',
            fontSize: '13px',
            fontWeight: 'bold',
            marginTop: '5px'
          }}>
            support@vendix.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default LicenseView;
