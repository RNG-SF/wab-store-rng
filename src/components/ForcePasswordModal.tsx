import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const ForcePasswordModal: React.FC = () => {
  const { user, rotatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !user.mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    const res = await rotatePassword(newPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Gagal mengubah password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0F1011] border border-[#F5A623]/40 rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center text-[#F5A623]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F7F8F8]">Wajib Ganti Password Awal</h3>
            <p className="text-xs text-[#8A8F98]">Protokol Keamanan Akun Super Admin / Owner</p>
          </div>
        </div>

        <p className="text-xs text-[#D0D6E0] leading-relaxed mb-5">
          Demi keamanan platform, akun Anda terdeteksi menggunakan password inisialisasi sementara. Anda wajib memperbarui password Anda dengan kombinasi kuat sebelum melanjutkan.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#EE0000]/10 border border-[#EE0000]/30 text-xs text-[#EE0000]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#D0D6E0] mb-1.5">
              Password Baru (Min. 8 Karakter)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-[#8A8F98]" />
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#D0D6E0] mb-1.5">
              Ulangi Password Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-[#8A8F98]" />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#5E6AD2] hover:bg-[#828FFF] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
