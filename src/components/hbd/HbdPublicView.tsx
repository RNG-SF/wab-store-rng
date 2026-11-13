import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Volume2,
  VolumeX,
  Send,
  Calendar,
  MessageSquare,
  MailOpen,
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

interface HbdPublicViewProps {
  slug?: string;
  onBackToHome?: () => void;
}

const THEME_PALETTES: Record<
  string,
  {
    accent: string;
    accentHover: string;
    accentText: string;
    accentSoft: string;
    accentBorder: string;
    glow: string;
  }
> = {
  'lavender-noir': {
    accent: 'bg-[#7C6AE6]',
    accentHover: 'hover:bg-[#9182F0]',
    accentText: 'text-[#B4A7FF]',
    accentSoft: 'bg-[#7C6AE6]/10',
    accentBorder: 'border-[#7C6AE6]/30',
    glow: 'bg-[#7C6AE6]/15',
  },
  'aurora-emerald': {
    accent: 'bg-[#2BA876]',
    accentHover: 'hover:bg-[#36BF88]',
    accentText: 'text-[#6FE3B2]',
    accentSoft: 'bg-[#2BA876]/10',
    accentBorder: 'border-[#2BA876]/30',
    glow: 'bg-[#2BA876]/15',
  },
  'crimson-gold': {
    accent: 'bg-[#C9516D]',
    accentHover: 'hover:bg-[#DD6380]',
    accentText: 'text-[#F3B89E]',
    accentSoft: 'bg-[#C9516D]/10',
    accentBorder: 'border-[#C9516D]/30',
    glow: 'bg-[#C9516D]/15',
  },
};

export const HbdPublicView: React.FC<HbdPublicViewProps> = ({ slug = 'happy-21-sarah', onBackToHome }) => {
  const [pageData, setPageData] = useState<any | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // Two-Stage Password Gate State (Tokens kept strictly in component memory)
  const [gateStep, setGateStep] = useState<1 | 2>(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stage1Birthday, setStage1Birthday] = useState('');
  const [stage1Token, setStage1Token] = useState<string | null>(null);
  const [stage2Method, setStage2Method] = useState<'RECIPIENT_BIRTHDAY' | 'CUSTOM_PASSWORD'>('RECIPIENT_BIRTHDAY');
  const [stage2Input, setStage2Input] = useState('');
  const [showCustomSecret, setShowCustomSecret] = useState(false);
  const [unlockToken, setUnlockToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  // Image load fallback tracking
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  // Guestbook state
  const [authorName, setAuthorName] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [submittingGuest, setSubmittingGuest] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setEnvelopeOpened(false);
    setGateStep(1);
    setStage1Birthday('');
    setStage1Token(null);
    setStage2Input('');
    setUnlockToken(null);
    setGateError(null);
    setBrokenImages({});
    loadGreetingData();
  }, [slug]);

  const loadGreetingData = async (tokenOverride?: string | null) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const activeUnlockToken = tokenOverride !== undefined ? tokenOverride : unlockToken;
      if (activeUnlockToken) {
        headers['x-hbd-unlock-token'] = activeUnlockToken;
      }

      const res = await fetch(`/api/hbd/${slug}`, {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPageData(data.page);
        setIsLocked(Boolean(data.locked || data.page?.isLocked));
        if (data.page?.stage2Method) {
          setStage2Method(data.page.stage2Method);
        }
      } else {
        setPageData(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStage1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stage1Birthday.trim()) {
      setGateError('Isi dulu tanggal ulang tahunnya ya.');
      return;
    }

    setVerifying(true);
    setGateError(null);
    try {
      const res = await fetch(`/api/hbd/${slug}/verify-stage1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ birthday: stage1Birthday }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setGateError(data.error || 'Sepertinya bukan tanggal itu deh. Coba ingat lagi pelan-pelan ya.');
        return;
      }

      if (data.passwordRequired === false && data.page) {
        setUnlockToken(data.unlockToken || null);
        setPageData(data.page);
        setIsLocked(false);
        return;
      }

      setStage1Token(data.stage1Token || null);
      if (data.stage2Method) {
        setStage2Method(data.stage2Method);
      }

      // Smooth fade/slide transition to Stage 2
      setIsTransitioning(true);
      setTimeout(() => {
        setGateStep(2);
        setStage2Input('');
        setGateError(null);
        setIsTransitioning(false);
      }, 200);
    } catch {
      setGateError('Koneksi lagi kurang stabil nih. Coba sebentar lagi ya.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyStage2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stage2Input.trim()) {
      setGateError('Jangan lupa isi dulu bagian ini sebelum membuka ucapannya ya.');
      return;
    }

    setVerifying(true);
    setGateError(null);
    try {
      const res = await fetch(`/api/hbd/${slug}/verify-stage2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          secret: stage2Input,
          stage1Token,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.stageResetRequired) {
          setIsTransitioning(true);
          setTimeout(() => {
            setGateStep(1);
            setStage1Token(null);
            setGateError(data.error);
            setIsTransitioning(false);
          }, 200);
        } else {
          setGateError(data.error || 'Masih belum pas nih. Coba dicek lagi ya.');
        }
        return;
      }

      setUnlockToken(data.unlockToken || null);
      setIsTransitioning(true);
      setTimeout(() => {
        setPageData(data.page);
        setIsLocked(false);
        setIsTransitioning(false);
      }, 220);
    } catch {
      setGateError('Koneksi sempat terputus. Coba kirim ulang sebentar ya.');
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenEnvelope = () => {
    setEnvelopeOpened(true);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#7C6AE6', '#B4A7FF', '#F3B89E', '#2BA876', '#FFFFFF'],
    });

    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestMessage.trim()) return;

    setSubmittingGuest(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (unlockToken) {
        headers['x-hbd-unlock-token'] = unlockToken;
      }

      const res = await fetch(`/api/hbd/${slug}/guestbook`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ authorName, message: guestMessage }),
      });
      if (res.ok) {
        setAuthorName('');
        setGuestMessage('');
        loadGreetingData(unlockToken);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingGuest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 text-xs text-[#8A8F98]">
        <div className="w-8 h-8 rounded-full border-2 border-[#23252A] border-t-[#828FFF] animate-spin" />
        <span>Menyiapkan ruang ucapan spesial...</span>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Heart className="w-10 h-10 text-[#62666D] mb-3" />
        <h3 className="text-base font-bold text-[#F7F8F8]">Halaman Ucapan Tidak Ditemukan</h3>
        <p className="text-xs text-[#8A8F98] mt-1 mb-5 max-w-xs">
          Tautan ucapan ini mungkin sudah tidak aktif atau alamatnya kurang tepat.
        </p>
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        )}
      </div>
    );
  }

  const theme = THEME_PALETTES[pageData.theme] || THEME_PALETTES['lavender-noir'];
  const photos = Array.isArray(pageData.photos) ? pageData.photos : [];

  // =========================================================================
  // LOCKED STATE: ELEGANT, ROMANTIC, MINIMALIST 2-STAGE PASSWORD GATE
  // Note: Zero greeting message, photos, music, video, or guestbook rendered.
  // =========================================================================
  if (isLocked) {
    return (
      <div className="min-h-[85vh] bg-[#050507] text-[#F7F8F8] relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6">
        {/* Soft Romantic Ambient Glow */}
        <div
          className={`pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[24rem] rounded-full blur-[130px] ${theme.glow}`}
        />

        <div className="max-w-md w-full mx-auto relative z-10">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-[#8A8F98] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          )}

          {/* Minimalist Romantic Card */}
          <div className="rounded-3xl bg-[#0D0E12]/95 border border-[#23252C] shadow-2xl p-6 sm:p-9">
            {/* Clean Unboxed Step Indicator */}
            <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-3">
              <span className={theme.accentText}>
                Untuk {pageData.recipientName}
              </span>
              <span className="font-mono tabular-nums">
                Tahap {gateStep} / 2
              </span>
            </div>

            {/* Subtle 2-step Progress Hairline */}
            <div className="grid grid-cols-2 gap-2 mb-7">
              <div className={`h-0.5 rounded-full transition-colors duration-300 ${theme.accent}`} />
              <div
                className={`h-0.5 rounded-full transition-colors duration-300 ${
                  gateStep === 2 ? theme.accent : 'bg-[#23252C]'
                }`}
              />
            </div>

            {/* Smooth Compositor-Only Step Container */}
            <div
              className={`transition-all duration-200 ease-out ${
                isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {gateStep === 1 ? (
                <form onSubmit={handleVerifyStage1} className="space-y-5">
                  <div className="space-y-2.5">
                    <div
                      className={`w-11 h-11 rounded-2xl ${theme.accentSoft} border ${theme.accentBorder} flex items-center justify-center ${theme.accentText} mb-4`}
                    >
                      <Heart className="w-5 h-5" />
                    </div>

                    <h1
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#F7F8F8] leading-snug text-balance"
                    >
                      Sebelum amplop ini terbuka...
                    </h1>

                    <p className="text-sm text-[#A1A6B3] leading-relaxed">
                      Ada kenangan kecil yang dijaga di sini. Masukkan tanggal ulang tahun pembuat ucapan ini untuk lanjut.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label
                      htmlFor="hbd-stage1-date"
                      className="block text-xs font-medium text-[#D0D6E0]"
                    >
                      Tanggal ulang tahun pembuat ucapan
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#8A8F98] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="hbd-stage1-date"
                        type="date"
                        required
                        value={stage1Birthday}
                        onChange={(e) => {
                          setStage1Birthday(e.target.value);
                          if (gateError) setGateError(null);
                        }}
                        className="w-full min-h-[44px] bg-[#14151B] border border-[#282B36] focus:border-[#7C6AE6] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {gateError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-[#1A1317] border border-[#C9516D]/30 text-xs text-[#F3B8C6] leading-relaxed"
                    >
                      {gateError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifying}
                    className={`w-full min-h-[44px] py-3 px-5 rounded-xl ${theme.accent} ${theme.accentHover} disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer`}
                  >
                    <span>{verifying ? 'Memeriksa tanggal...' : 'Lanjut ke Tahap Kedua'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyStage2} className="space-y-5">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-[#6FE3B2] mb-2">
                      <Check className="w-3.5 h-3.5" />
                      <span>Tahap pertama tepat, tinggal satu langkah lagi</span>
                    </div>

                    <h1
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#F7F8F8] leading-snug text-balance"
                    >
                      Satu kunci terakhir untukmu
                    </h1>

                    <p className="text-sm text-[#A1A6B3] leading-relaxed">
                      {stage2Method === 'RECIPIENT_BIRTHDAY'
                        ? `Sekarang masukkan tanggal lahir kamu ya, ${pageData.recipientName}.`
                        : 'Masukkan kata sandi khusus yang sudah disiapkan pembuat ucapan ini.'}
                    </p>
                  </div>

                  {stage2Method === 'RECIPIENT_BIRTHDAY' ? (
                    <div className="space-y-2 pt-1">
                      <label
                        htmlFor="hbd-stage2-date"
                        className="block text-xs font-medium text-[#D0D6E0]"
                      >
                        Tanggal ulang tahunmu
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-[#8A8F98] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="hbd-stage2-date"
                          type="date"
                          required
                          value={stage2Input}
                          onChange={(e) => {
                            setStage2Input(e.target.value);
                            if (gateError) setGateError(null);
                          }}
                          className="w-full min-h-[44px] bg-[#14151B] border border-[#282B36] focus:border-[#7C6AE6] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <label
                        htmlFor="hbd-stage2-custom"
                        className="block text-xs font-medium text-[#D0D6E0]"
                      >
                        Kata sandi khusus
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-[#8A8F98] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="hbd-stage2-custom"
                          type={showCustomSecret ? 'text' : 'password'}
                          required
                          autoComplete="off"
                          value={stage2Input}
                          onChange={(e) => {
                            setStage2Input(e.target.value);
                            if (gateError) setGateError(null);
                          }}
                          placeholder="Ketik kata sandi rahasianya..."
                          className="w-full min-h-[44px] bg-[#14151B] border border-[#282B36] focus:border-[#7C6AE6] rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-[#62666D] outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomSecret((v) => !v)}
                          aria-label={showCustomSecret ? 'Sembunyikan sandi' : 'Lihat sandi'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8A8F98] hover:text-white cursor-pointer"
                        >
                          {showCustomSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {gateError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-[#1A1317] border border-[#C9516D]/30 text-xs text-[#F3B8C6] leading-relaxed"
                    >
                      {gateError}
                    </div>
                  )}

                  <div className="space-y-2.5 pt-1">
                    <button
                      type="submit"
                      disabled={verifying}
                      className={`w-full min-h-[44px] py-3 px-5 rounded-xl ${theme.accent} ${theme.accentHover} disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>{verifying ? 'Membuka halaman...' : 'Buka Halaman Ucapan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTransitioning(true);
                        setTimeout(() => {
                          setGateStep(1);
                          setGateError(null);
                          setIsTransitioning(false);
                        }, 180);
                      }}
                      className="w-full py-2 text-xs text-[#8A8F98] hover:text-white transition-colors cursor-pointer"
                    >
                      ← Kembali ke tahap pertama
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // UNLOCKED STATE: ENVELOPE & CELEBRATION EXPERIENCE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#010102] text-[#F7F8F8] pb-20 relative overflow-hidden">
      {/* Background audio */}
      {pageData.musicUrl && <audio ref={audioRef} src={pageData.musicUrl} loop preload="auto" />}

      {/* Floating Music Controller */}
      {pageData.musicUrl && envelopeOpened && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={toggleMusic}
            className={`p-3 rounded-full shadow-2xl border flex items-center gap-2 transition-all cursor-pointer ${
              isPlayingMusic
                ? `${theme.accent} text-white ${theme.accentBorder}`
                : 'bg-[#141516] text-[#8A8F98] border-[#23252A]'
            }`}
            title={isPlayingMusic ? 'Jeda Musik' : 'Putar Musik'}
          >
            {isPlayingMusic ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-xs font-mono font-medium hidden sm:inline">
              {isPlayingMusic ? 'Musik Diputar' : 'Musik Dijeda'}
            </span>
          </button>
        </div>
      )}

      {/* Hero Atmosphere */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="mb-6 px-3 py-1.5 rounded-lg bg-[#0F1011] border border-[#23252A] text-xs text-[#8A8F98] hover:text-white transition-colors cursor-pointer"
          >
            ← Kembali ke Platform
          </button>
        )}

        {/* Envelope Closed State */}
        {!envelopeOpened ? (
          <div className="max-w-md mx-auto text-center py-14 px-6 sm:px-8 rounded-3xl bg-[#0F1011] border border-[#23252A] shadow-2xl transition-all duration-300">
            <div
              className={`w-20 h-20 rounded-2xl ${theme.accentSoft} border ${theme.accentBorder} flex items-center justify-center ${theme.accentText} mx-auto mb-6`}
            >
              <MailOpen className="w-10 h-10" />
            </div>

            <div className="text-xs text-[#8A8F98] mb-2">
              <span>Spesial untuk {pageData.recipientName}</span>
            </div>

            <h1
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-2xl sm:text-3xl font-semibold text-[#F7F8F8] tracking-tight text-balance"
            >
              Ada Pesan Ucapan Istimewa Untukmu
            </h1>

            <p className="mt-3 text-xs text-[#8A8F98] max-w-xs mx-auto leading-relaxed">
              Sentuh tombol di bawah ini untuk membuka amplop, musik latar, galeri kenangan, dan surat personal.
            </p>

            <button
              onClick={handleOpenEnvelope}
              className={`mt-8 min-h-[44px] px-8 py-3 rounded-xl ${theme.accent} ${theme.accentHover} text-white text-sm font-semibold shadow-xl transition-transform duration-200 hover:scale-[1.02] cursor-pointer`}
            >
              Buka Amplop Sekarang
            </button>
          </div>
        ) : (
          /* Envelope Opened Festive Experience */
          <div className="space-y-12 transition-all duration-500">
            {/* Clean Editorial Header */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs text-[#8A8F98]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{pageData.eventDate}</span>
                <span aria-hidden="true">·</span>
                <span className={theme.accentText}>Untuk {pageData.recipientName}</span>
              </div>

              <h1
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F7F8F8] text-balance"
              >
                {pageData.title}
              </h1>
            </div>

            {/* Optional Video Section */}
            {pageData.videoUrl && (
              <div className="rounded-2xl overflow-hidden bg-[#0F1011] border border-[#23252A] shadow-xl">
                <video
                  src={pageData.videoUrl}
                  controls
                  playsInline
                  className="w-full max-h-[460px] object-cover bg-black"
                />
              </div>
            )}

            {/* Photo Gallery Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {photos.map((url: string, idx: number) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-2xl overflow-hidden bg-[#141516] border border-[#23252A] shadow-lg group"
                  >
                    {brokenImages[idx] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-gradient-to-br from-[#14151B] to-[#0D0E12] text-[#8A8F98]">
                        <ImageIcon className="w-6 h-6 opacity-50" />
                        <span className="text-xs">Kenangan {idx + 1}</span>
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={`Kenangan ${idx + 1} untuk ${pageData.recipientName}`}
                        onError={() => setBrokenImages((prev) => ({ ...prev, [idx]: true }))}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Personalized Message Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#0F1011] border border-[#23252A] shadow-2xl relative">
              <div className={`text-xs font-medium mb-3 ${theme.accentText}`}>
                Surat & Doa Untukmu
              </div>
              <p className="text-sm sm:text-base text-[#D0D6E0] leading-relaxed whitespace-pre-line font-normal">
                {pageData.message}
              </p>
            </div>

            {/* Guestbook Wishes Section */}
            <div className="pt-8 border-t border-[#23252A]">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className={`w-5 h-5 ${theme.accentText}`} />
                <h3 className="text-lg font-bold text-[#F7F8F8]">
                  Ucapan & Doa dari Kerabat ({pageData.guestbook?.length || 0})
                </h3>
              </div>

              {/* Form to submit greeting */}
              <form onSubmit={handleGuestSubmit} className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A] mb-8 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8A8F98] mb-1">Nama Pengirim</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8A8F98]" />
                      <input
                        type="text"
                        required
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Nama Anda"
                        className="w-full bg-[#141516] border border-[#23252A] rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#8A8F98] mb-1">Pesan Ucapan Hangat</label>
                  <textarea
                    required
                    rows={2}
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    placeholder="Tuliskan ucapan selamat, doa terbaik, atau pesan hangat..."
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg p-3 text-xs text-white outline-none focus:border-[#5E6AD2]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingGuest}
                  className={`px-4 py-2 ${theme.accent} ${theme.accentHover} disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingGuest ? 'Mengirim...' : 'Kirim Ucapan'}</span>
                </button>
              </form>

              {/* Guestbook comments list */}
              <div className="space-y-3">
                {pageData.guestbook?.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-[#0F1011] border border-[#23252A] space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#F7F8F8]">{entry.authorName}</span>
                      <span className="text-[11px] text-[#8A8F98]">
                        {new Date(entry.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed">{entry.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
