import React from 'react';
import { Search, Sparkles, Server, Bot, Share2, CreditCard, Package } from 'lucide-react';

interface StoreHeroProps {
  categories: any[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const StoreHero: React.FC<StoreHeroProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'ai-services':
        return <Bot className="w-3.5 h-3.5" />;
      case 'social-media':
        return <Share2 className="w-3.5 h-3.5" />;
      case 'digital-subscription':
        return <CreditCard className="w-3.5 h-3.5" />;
      case 'hosting-server':
        return <Server className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="relative py-12 sm:py-16 border-b border-[#23252A] bg-gradient-to-b from-[#0F1011]/60 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Editorial Subtitle Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 text-[#828FFF] text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>RNG-SF DIGITAL BUSINESS ECOSYSTEM</span>
        </div>

        {/* Main Display Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F7F8F8] max-w-3xl mx-auto text-balance">
          Layanan Digital, Hosting & Platform Ekosistem Terpadu
        </h1>

        <p className="mt-3 text-sm sm:text-base text-[#8A8F98] max-w-2xl mx-auto leading-relaxed">
          Katalog resmi produk digital RNG-SF: API AI, tool sosial media terverifikasi, hosting bot WhatsApp, server VPS, lisensi digital, dan dynamic celebration generator.
        </p>

        {/* Search Input Bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8F98]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari layanan, paket AI, hosting bot, atau lisensi..."
            className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#F7F8F8] placeholder-[#62666D] shadow-inner outline-none transition-colors"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#5E6AD2] text-white font-semibold'
                : 'bg-[#141516] border border-[#23252A] text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#18191A]'
            }`}
          >
            Semua Kategori
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[#5E6AD2] text-white font-semibold'
                  : 'bg-[#141516] border border-[#23252A] text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#18191A]'
              }`}
            >
              {getCategoryIcon(cat.slug)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
