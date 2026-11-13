import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Login gagal.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register({
      username,
      email,
      password,
      phone,
      referralCode,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Registrasi berhasil! Silakan login dengan akun baru Anda.');
      setMode('login');
      setIdentifier(username);
      setPassword('');
    } else {
      setError(res.error || 'Registrasi gagal.');
    }
  };

  const fillSuperAdminCredentials = () => {
    setIdentifier('sofyantorangga028@gmail.com');
    setPassword('Rangga#2026@Secure');
    setMode('login');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F1011] border border-[#23252A] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#18191A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 text-[#828FFF] text-xs font-mono mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>RNG-SF Secure Auth</span>
          </div>
          <h2 className="text-xl font-bold text-[#F7F8F8]">
            {mode === 'login' ? 'Masuk ke Platform' : 'Daftar Akun Baru'}
          </h2>
          <p className="text-xs text-[#8A8F98] mt-1">
            {mode === 'login'
              ? 'Akses dashboard, riwayat pesanan, lisensi digital, dan panel pengelolaan.'
              : 'Bergabung dengan ekosistem RNG-SF untuk memesan layanan dan produk digital.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-[#141516] p-1 mb-6 border border-[#23252A]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'login' ? 'bg-[#18191A] text-white shadow-sm' : 'text-[#8A8F98] hover:text-[#F7F8F8]'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'register' ? 'bg-[#18191A] text-white shadow-sm' : 'text-[#8A8F98] hover:text-[#F7F8F8]'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Alert Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#EE0000]/10 border border-[#EE0000]/30 flex items-start gap-2.5 text-xs text-[#EE0000]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#27A644]/10 border border-[#27A644]/30 text-xs text-[#27A644]">
            {successMessage}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#D0D6E0] mb-1.5">
                Username atau Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-[#8A8F98]" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Rangga atau user@example.com"
                  className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D0D6E0] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[#8A8F98]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg pl-9 pr-10 py-2.5 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8A8F98] hover:text-[#F7F8F8]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#5E6AD2] hover:bg-[#828FFF] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Super Admin Credential Assistant */}
            <div className="mt-4 pt-4 border-t border-[#23252A] text-center">
              <button
                type="button"
                onClick={fillSuperAdminCredentials}
                className="text-[11px] text-[#828FFF] hover:underline inline-flex items-center gap-1"
              >
                <span>🔑 Isi Kredensial Super Admin (Rangga)</span>
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[#8A8F98]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username_anda"
                  className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#8A8F98]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Password (Min. 8 Karakter)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#8A8F98]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg pl-9 pr-10 py-2 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8A8F98] hover:text-[#F7F8F8]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Nomor WhatsApp (Opsional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 8..."
                className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg px-3 py-2 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Kode Referral (Opsional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="CONTOH: OWNER-RNG"
                className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg px-3 py-2 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none uppercase font-mono transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 bg-[#5E6AD2] hover:bg-[#828FFF] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
