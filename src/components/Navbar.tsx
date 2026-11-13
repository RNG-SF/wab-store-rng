import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, Shield, Menu, X, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, targetSection?: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const { openCart, totalCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { id: 'home', label: 'Beranda' },
    { id: 'hbd', label: 'HBD & Wishes', section: '#hbd-section' },
    { id: 'social', label: 'Social Media', section: '#social-section' },
    { id: 'info', label: 'Info', section: '#info-section' },
  ];

  const handleLinkClick = (id: string, section?: string) => {
    onNavigate('home', section);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0B0E]/90 backdrop-blur-md border-b border-[#1E2028]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/15 border border-[#5E6AD2]/30 flex items-center justify-center text-[#828FFF] group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#F7F8F8] group-hover:text-white transition-colors">
              RNG-SF
            </span>
          </button>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#8A8F98]">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.section)}
                className="hover:text-white transition-colors py-1 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Store Button */}
            <button
              onClick={() => onNavigate('store')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'store'
                  ? 'bg-[#5E6AD2] text-white'
                  : 'bg-[#15171E] hover:bg-[#1E2028] border border-[#232530] text-[#D0D6E0] hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#828FFF]" />
              <span>Store</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg bg-[#15171E] hover:bg-[#1E2028] border border-[#232530] text-[#8A8F98] hover:text-white transition-colors cursor-pointer"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#5E6AD2] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Admin Console (For Admin / Manager Roles) */}
            {user && ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER'].includes(user.role) && (
              <button
                onClick={() => onNavigate('admin')}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#343445] text-[#828FFF] hover:bg-[#15171E] transition-colors cursor-pointer ${
                  currentView === 'admin' ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]' : ''
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}

            {/* User Account / Login */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onNavigate('portal')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#15171E] hover:bg-[#1E2028] border border-[#232530] text-[#D0D6E0] flex items-center gap-1.5 cursor-pointer max-w-[120px] truncate"
                >
                  <UserIcon className="w-3 h-3 text-[#5E6AD2]" />
                  <span className="truncate">{user.username}</span>
                </button>
                <button
                  onClick={() => logout()}
                  className="p-1.5 rounded-lg bg-[#15171E] hover:bg-[#1E2028] border border-[#232530] text-[#8A8F98] hover:text-[#EE0000] transition-colors cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#5E6AD2] hover:bg-[#828FFF] rounded-lg transition-colors cursor-pointer"
              >
                Masuk
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[#15171E] border border-[#232530] text-[#8A8F98]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0B0E] border-b border-[#1E2028] px-4 py-3 space-y-1">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id, link.section)}
              className="block w-full text-left px-3 py-2 text-xs font-medium text-[#D0D6E0] hover:bg-[#15171E] rounded-lg"
            >
              {link.label}
            </button>
          ))}
          {user && ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER'].includes(user.role) && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-xs font-medium text-[#828FFF] hover:bg-[#15171E] rounded-lg"
            >
              Admin Console
            </button>
          )}
        </div>
      )}
    </header>
  );
};
