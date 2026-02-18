
import React, { useState } from 'react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  existingUser: User | null;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, existingUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isSignup = !existingUser;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const passwordHash = btoa(password); // Basic hash for local storage

    if (isSignup) {
      onLogin({ username, passwordHash });
    } else {
      if (username === existingUser.username && passwordHash === existingUser.passwordHash) {
        onLogin(existingUser);
      } else {
        setError('Identifiants incorrects');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <i className="fas fa-cash-register"></i>
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Vendix POS</h1>
          <p className="text-blue-600 font-bold mt-1 text-sm italic">
            Vendez plus vite, vendez plus fort
          </p>
          <p className="text-gray-400 mt-4 text-xs uppercase tracking-widest font-bold">
            {isSignup ? "Initialisation du système" : "Connexion à votre espace"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nom d'utilisateur</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-bold"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Mot de passe</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-500/30 transition-all transform active:scale-95 uppercase tracking-widest text-xs"
          >
            {isSignup ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 mt-10 uppercase tracking-widest font-black opacity-50">
          Système local sécurisé • Hors ligne
        </p>
      </div>
    </div>
  );
};

export default LoginView;
