/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nukki AI — Redesigned
 * Style: Light Modern + Before/After Slider
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Scissors,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import type { Config } from '@imgly/background-removal';

// ─── Utility ─────────────────────────────────────────────────────────────────
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImageState {
  original: string | null;
  processed: string | null;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
}

// ─── Before/After Slider ─────────────────────────────────────────────────────
function BeforeAfterSlider({ original, processed }: { original: string; processed: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updatePosition(e.clientX);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    updatePosition(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-col-resize select-none shadow-xl"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Processed (right side — checkerboard bg) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(45deg,#e9ecef 25%,transparent 25%), linear-gradient(-45deg,#e9ecef 25%,transparent 25%), linear-gradient(45deg,transparent 75%,#e9ecef 75%), linear-gradient(-45deg,transparent 75%,#e9ecef 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
        }}
      >
        <img src={processed} alt="Processed" className="w-full h-full object-contain" />
      </div>

      {/* Original (clipped left side) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div className="absolute inset-0 bg-slate-100">
          <img src={original} alt="Original" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.3)] pointer-events-none"
        style={{ left: `${position}%` }}
      />

      {/* Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center gap-0.5 pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <ChevronLeft className="w-3 h-3 text-slate-500" />
        <ChevronRight className="w-3 h-3 text-slate-500" />
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">원본</div>
      <div className="absolute top-3 right-3 bg-blue-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">배경제거</div>
    </div>
  );
}

// ─── Features data ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: '완전한 개인정보 보호',
    desc: 'WASM 기술로 모든 처리가 브라우저 내에서만 이루어집니다. 이미지가 서버로 전송되지 않습니다.',
    color: 'from-emerald-50 to-teal-50',
    accent: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: '초정밀 AI 분석',
    desc: '고성능 신경망 모델로 미세한 머리카락 한 올까지 정교하게 배경을 분리합니다.',
    color: 'from-blue-50 to-indigo-50',
    accent: 'text-blue-600',
    border: 'border-blue-100',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: '빠른 처리 속도',
    desc: '최적화된 AI 엔진으로 대용량 이미지도 수 초 내에 처리하며 고해상도 PNG를 출력합니다.',
    color: 'from-amber-50 to-orange-50',
    accent: 'text-amber-600',
    border: 'border-amber-100',
  },
];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    processed: null,
    status: 'idle',
    progress: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'slider'>('slider');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('이미지 파일만 업로드 가능합니다.');
      return;
    }
    const originalUrl = URL.createObjectURL(file);
    setImageState({ original: originalUrl, processed: null, status: 'processing', progress: 0 });
    setErrorMessage(null);
    try {
      const config: Config = {
        progress: (_key: string, current: number, total: number) => {
          setImageState(prev => ({ ...prev, progress: Math.round((current / total) * 100) }));
        },
      };
      const blob = await removeBackground(file, config);
      setImageState(prev => ({
        ...prev,
        processed: URL.createObjectURL(blob),
        status: 'done',
        progress: 100,
      }));
    } catch {
      setImageState(prev => ({ ...prev, status: 'error' }));
      setErrorMessage('배경 제거에 실패했습니다. 다른 이미지로 다시 시도해 주세요.');
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  };

  const reset = () => {
    setImageState({ original: null, processed: null, status: 'idle', progress: 0 });
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const download = () => {
    if (!imageState.processed) return;
    const a = document.createElement('a');
    a.href = imageState.processed;
    a.download = 'nukki-bg-removed.png';
    a.click();
  };

  const isActive = imageState.status !== 'idle' && imageState.status !== 'error';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 font-sans text-slate-900 selection:bg-blue-100">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-black tracking-tight uppercase text-slate-900">Nukki AI</span>
          <span className="hidden sm:block text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Beta</span>
        </div>

        <div className="flex items-center gap-2">
          {imageState.status === 'processing' && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 animate-pulse">
              처리 중 {imageState.progress}%
            </span>
          )}
          {imageState.status === 'done' && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              ✓ 완료
            </span>
          )}
          {imageState.original && (
            <button
              onClick={reset}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              초기화
            </button>
          )}
          <button
            onClick={download}
            disabled={imageState.status !== 'done'}
            className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
          >
            PNG 저장
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">

        {/* ── Hero ── */}
        <AnimatePresence mode="wait">
          {!isActive && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                AI 배경 제거 — 로컬 처리
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-slate-900 mb-5">
                배경을<br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  단 한 번에
                </span>
              </h1>
              <p className="max-w-md mx-auto text-slate-500 text-base md:text-lg font-medium leading-relaxed">
                이미지를 업로드하면 AI가 즉시 배경을 제거합니다.<br className="hidden sm:block" />
                서버 전송 없이 브라우저에서 직접 처리됩니다.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Drop Zone ── */}
        <AnimatePresence mode="wait">
          {!isActive ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4 }}
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                className={cn(
                  'group relative w-full rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden',
                  isDragOver
                    ? 'border-blue-400 bg-blue-50/60 scale-[1.01]'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                )}
              >
                {/* Background decorative circles */}
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />

                <div className="relative py-20 flex flex-col items-center gap-5 px-6">
                  <motion.div
                    animate={isDragOver ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200/60"
                  >
                    <ImagePlus className="w-9 h-9 text-white" />
                  </motion.div>
                  <div className="text-center space-y-1.5">
                    <p className="text-xl font-bold text-slate-800">
                      {isDragOver ? '여기에 놓으세요!' : '이미지를 드래그하거나 클릭하세요'}
                    </p>
                    <p className="text-sm text-slate-400 font-medium">PNG, JPG, WEBP 지원 · 최대 20MB</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500">
                      <Upload className="w-3 h-3" /> 파일 선택
                    </div>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>

              {/* Error */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-semibold">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* ── Result Panel ── */
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    imageState.status === 'processing' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'
                  )} />
                  <span className="text-sm font-bold text-slate-700">
                    {imageState.status === 'processing'
                      ? `AI 처리 중... ${imageState.progress}%`
                      : '배경 제거 완료'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {imageState.status === 'done' && (
                    <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                      {(['slider', 'split'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={cn(
                            'px-3 py-1 text-xs font-bold rounded-md transition-all',
                            viewMode === mode
                              ? 'bg-white text-slate-800 shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          )}
                        >
                          {mode === 'slider' ? '슬라이더' : '나란히'}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={reset}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="초기화"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {imageState.status === 'processing' && (
                <div className="h-1 bg-slate-100">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${imageState.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              <div className="p-6 md:p-8">
                {/* Processing placeholder */}
                {imageState.status === 'processing' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Original */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">원본</p>
                      <div className="aspect-[4/3] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                        {imageState.original && (
                          <img src={imageState.original} alt="Original" className="w-full h-full object-contain" />
                        )}
                      </div>
                    </div>
                    {/* Processing */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">결과 (처리 중)</p>
                      <div className="aspect-[4/3] bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="text-sm font-bold text-slate-500">{imageState.progress}% 완료</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Done */}
                {imageState.status === 'done' && imageState.original && imageState.processed && (
                  <>
                    {viewMode === 'slider' ? (
                      <BeforeAfterSlider original={imageState.original} processed={imageState.processed} />
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">원본</p>
                          <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                            <img src={imageState.original} alt="Original" className="w-full h-full object-contain" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">결과 (PNG)</p>
                          <div
                            className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100"
                            style={{
                              backgroundImage:
                                'linear-gradient(45deg,#e9ecef 25%,transparent 25%), linear-gradient(-45deg,#e9ecef 25%,transparent 25%), linear-gradient(45deg,transparent 75%,#e9ecef 75%), linear-gradient(-45deg,transparent 75%,#e9ecef 75%)',
                              backgroundSize: '20px 20px',
                              backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
                            }}
                          >
                            <motion.img
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              src={imageState.processed}
                              alt="Processed"
                              className="w-full h-full object-contain drop-shadow-2xl"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action footer */}
              {imageState.status === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 md:px-8 py-6 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">작업 완료!</p>
                      <p className="text-xs text-slate-400 font-medium">고해상도 PNG로 저장 가능합니다</p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={reset}
                      className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      새 이미지
                    </button>
                    <button
                      onClick={download}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      PNG 다운로드
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Feature Cards ── */}
        <AnimatePresence>
          {!isActive && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-16 grid sm:grid-cols-3 gap-5"
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={cn(
                    'p-6 rounded-2xl bg-gradient-to-br border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                    f.color, f.border
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl bg-white/70 border flex items-center justify-center mb-4 shadow-sm', f.border, f.accent)}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
              <Scissors className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-black tracking-tight uppercase text-slate-900">Nukki AI</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">© 2026 Nukki AI — All images processed locally in your browser.</p>
          <div className="flex gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <a href="#" className="hover:text-blue-600 transition-colors">이용약관</a>
            <a href="#" className="hover:text-blue-600 transition-colors">개인정보</a>
            <a href="#" className="hover:text-blue-600 transition-colors">고객지원</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
