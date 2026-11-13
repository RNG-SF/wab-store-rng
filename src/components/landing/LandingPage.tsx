import React, { useState, useEffect } from 'react';
import {
  Heart,
  Share2,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  Play,
  Send,
  MessageCircle,
  Video,
  Lock
} from 'lucide-react';

interface LandingPageProps {
  onGoToStore: (categorySlug?: string) => void;
  onOpenHbdSlug: (slug: string) => void;
  onOpenAuth: () => void;
  onGoToAdmin?: () => void;
  isAdmin?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToStore,
  onOpenHbdSlug,
  onOpenAuth: _onOpenAuth,
  onGoToAdmin,
  isAdmin,
}) => {
  const [hbdShowcase, setHbdShowcase] = useState<any[]>([
    {
      id: 1,
      slug: 'happy-21-sarah',
      recipientName: 'Sarah Amanda',
      title: 'Happy 21st Birthday, Sarah!',
      eventDate: '2026-11-20',
      passwordEnabled: false,
    },
  ]);

  useEffect(() => {
    fetch('/api/hbd/public-list')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.pages && d.pages.length > 0) {
          setHbdShowcase(d.pages);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      {/* 1. HERO SECTION (Simple, Clean, Premium) */}
      <section className="relative pt-16 sm:pt-20 pb-12 overflow-hidden">
        {/* Soft Indigo Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#5E6AD2]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#15171E] border border-[#232530] text-[#828FFF] text-xs font-mono mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#5E6AD2]" />
            <span>RNG-SF PERSONAL HUB</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F7F8F8] leading-tight text-balance">
            Ruang Digital & Kreasi Personal
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#8A8F98] max-w-xl mx-auto leading-relaxed">
            Platform personal multifungsi untuk berbagi halaman ucapan interaktif, terhubung di media sosial, dan layanan digital terpilih oleh Rangga.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#hbd-section"
              className="px-5 py-2.5 rounded-xl bg-[#15171E] hover:bg-[#1E2028] border border-[#232530] text-xs font-semibold text-[#F7F8F8] transition-colors"
            >
              Jelajahi Karya ↓
            </a>
            <button
              onClick={() => onGoToStore()}
              className="px-5 py-2.5 rounded-xl bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-[#5E6AD2]/20 transition-all hover:scale-105 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buka Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. HBD & WISHES SECTION (Interactive Celebrations) */}
      <section id="hbd-section" className="max-w-4xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#5E6AD2] mb-1">
            <Heart className="w-3.5 h-3.5" />
            <span>KARYA UCAPAN INTERAKTIF</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F7F8F8]">HBD & Wishes</h2>
          <p className="text-xs text-[#8A8F98] mt-1">
            Halaman ucapan personal dengan amplop animasi, musik latar, proteksi sandi dua tahap, dan buku tamu.
          </p>
        </div>

        {/* Active Celebration Cards */}
        <div className="space-y-3.5">
          {hbdShowcase.map((pg) => (
            <div
              key={pg.slug}
              className="p-6 sm:p-8 rounded-2xl bg-[#0F1014] border border-[#1E2028] hover:border-[#2C2E3B] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#8A8F98]">
                    <span>Untuk {pg.recipientName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{pg.eventDate}</span>
                    <span aria-hidden="true">·</span>
                    {pg.passwordEnabled ? (
                      <span className="text-[#B4A7FF] inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Dilindungi Sandi 2 Tahap</span>
                      </span>
                    ) : (
                      <span className="text-[#27A644]">Terbuka</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white">{pg.title}</h3>
                  <p className="text-xs text-[#8A8F98] max-w-md leading-relaxed">
                    {pg.passwordEnabled
                      ? 'Halaman ucapan pribadi dengan verifikasi dua tahap sebelum amplop dan kenangan terbuka.'
                      : 'Halaman ucapan interaktif dengan pembuka amplop animasi, musik latar, galeri foto, dan buku tamu.'}
                  </p>
                </div>

                <button
                  onClick={() => onOpenHbdSlug(pg.slug)}
                  className="px-5 py-2.5 rounded-xl bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  {pg.passwordEnabled ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Buka Ucapan Interaktif</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SOCIAL MEDIA SECTION (Official Channels) */}
      <section id="social-section" className="max-w-4xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#5E6AD2] mb-1">
            <Share2 className="w-3.5 h-3.5" />
            <span>TERHUBUNG DENGAN SAYA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F7F8F8]">Social Media</h2>
          <p className="text-xs text-[#8A8F98] mt-1">
            Kanal resmi media sosial dan komunitas untuk berkomunikasi atau melihat update proyek.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl bg-[#0F1014] border border-[#1E2028] hover:border-[#5E6AD2]/50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#15171E] flex items-center justify-center text-[#828FFF]">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#828FFF] transition-colors">
                  Instagram
                </h4>
                <p className="text-[11px] text-[#8A8F98]">@rng.sf · Update visual & kreasi</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8F98] group-hover:text-white" />
          </a>

          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl bg-[#0F1014] border border-[#1E2028] hover:border-[#5E6AD2]/50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#15171E] flex items-center justify-center text-[#828FFF]">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#828FFF] transition-colors">
                  TikTok
                </h4>
                <p className="text-[11px] text-[#8A8F98]">@rng_sf · Video showcase & kreasi</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8F98] group-hover:text-white" />
          </a>

          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl bg-[#0F1014] border border-[#1E2028] hover:border-[#5E6AD2]/50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#15171E] flex items-center justify-center text-[#828FFF]">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#828FFF] transition-colors">
                  Telegram
                </h4>
                <p className="text-[11px] text-[#8A8F98]">t.me/rng_sf_hub · Diskusi & kontak langsung</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8F98] group-hover:text-white" />
          </a>

          <a
            href="https://whatsapp.com"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl bg-[#0F1014] border border-[#1E2028] hover:border-[#5E6AD2]/50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#15171E] flex items-center justify-center text-[#828FFF]">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#828FFF] transition-colors">
                  WhatsApp
                </h4>
                <p className="text-[11px] text-[#8A8F98]">Official Channel · Pengumuman penting</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8F98] group-hover:text-white" />
          </a>
        </div>
      </section>

      {/* 4. INFO SECTION (About RNG-SF & Rangga) */}
      <section id="info-section" className="max-w-4xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0F1014] border border-[#1E2028]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#5E6AD2] mb-2">
            <Info className="w-3.5 h-3.5" />
            <span>TENTANG PLATFORM</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Mengenai RNG-SF</h2>
          <p className="mt-3 text-xs sm:text-sm text-[#D0D6E0] leading-relaxed">
            RNG-SF dikembangkan oleh <strong className="text-white">Rangga Sofyanto</strong> sebagai ruang digital personal multifungsi. Dirancang dengan fokus pada kesederhanaan, kecepatan, dan kenyamanan pengguna—menghubungkan karya personal, interaksi sosial media, serta akses produk digital terpilih.
          </p>

          <div className="mt-5 pt-4 border-t border-[#1E2028] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8A8F98]">
            <div className="flex items-center gap-2">
              <span>Dikelola oleh: <span className="text-white font-medium">Rangga Sofyanto</span></span>
              {isAdmin && onGoToAdmin && (
                <button
                  onClick={onGoToAdmin}
                  className="px-2 py-0.5 rounded bg-[#5E6AD2]/20 hover:bg-[#5E6AD2]/30 text-[#828FFF] border border-[#5E6AD2]/40 text-[10px] font-semibold cursor-pointer transition-colors"
                >
                  Buka Console Owner →
                </button>
              )}
            </div>
            <span>Versi: <span className="font-mono text-white">RNG-SF v2.0 Clean</span></span>
          </div>
        </div>
      </section>

      {/* 5. STORE TEASER CARD (Access to Separate Store) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#12141C] via-[#0F1014] to-[#12141C] border border-[#5E6AD2]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#828FFF] font-mono">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>DIGITAL STORE TERPISAH</span>
            </div>
            <h3 className="text-lg font-bold text-white">Mencari Layanan atau Produk Digital?</h3>
            <p className="text-xs text-[#8A8F98] max-w-md">
              Kunjungi halaman store terpisah kami untuk melihat produk dan layanan yang benar-benar tersedia.
            </p>
          </div>

          <button
            onClick={() => onGoToStore()}
            className="px-5 py-2.5 rounded-xl bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Kunjungi Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
