import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Star,
  ExternalLink,
} from 'lucide-react';
import { ThemeConfig } from './AmbientBackground';

// Web3Forms Access Key: Paste your key here or set VITE_WEB3FORMS_ACCESS_KEY in your environment/.env
export const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || 'f62c05c1-df04-4898-9ef9-54f43147a629';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  defaultRecipientName?: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  theme,
  defaultRecipientName = '',
}: FeedbackModalProps) {
  const [notes, setNotes] = useState('');
  const [name, setName] = useState(defaultRecipientName);
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General Feedback');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const targetEmail = 'gabbar.singh9291@gmail.com';

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setResponseMsg('');
      setPreviewUrl(null);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setStatus('error');
      setResponseMsg('कृपया अपने नोट्स या फीडबैक दर्ज करें (Please write your notes).');
      return;
    }

    const hasWeb3FormsKey = Boolean(
      WEB3FORMS_ACCESS_KEY &&
      WEB3FORMS_ACCESS_KEY !== 'YOUR_ACCESS_KEY_HERE' &&
      WEB3FORMS_ACCESS_KEY.trim() !== ''
    );

    const isStaticHosting = typeof window !== 'undefined' && (
      window.location.hostname.includes('github.io') ||
      window.location.protocol === 'file:'
    );

    // If on static GitHub Pages and the key is still the placeholder, guide the user
    if (isStaticHosting && !hasWeb3FormsKey) {
      setStatus('error');
      setResponseMsg('कृपया अपनी Web3Forms access_key दर्ज करें। web3forms.com से 1 सेकंड में मुफ्त key मिल जाती है, फिर उसे access_key फील्ड में पेस्ट कर दें।');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setResponseMsg('');

    try {
      if (hasWeb3FormsKey) {
        // Submit directly to Web3Forms API (Works 100% on static GitHub Pages without backend!)
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            name: name.trim() || 'Anonymous Visitor',
            email: email.trim() || 'noreply@welcome-app.local',
            category,
            rating: `${rating} / 5 Stars`,
            message: notes.trim(),
            subject: `[Feedback: Yaaro Ka Yaar] ${category} from ${name.trim() || 'Visitor'}`,
            from_name: 'Yaaro Ka Yaar Welcome App',
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus('success');
          setResponseMsg('फीडबैक Web3Forms द्वारा सफलतापूर्वक भेज दिया गया!');
          setNotes('');
        } else {
          setStatus('error');
          setResponseMsg(data?.message || 'Web3Forms पर सबमिट करने में विफल। कृपया अपनी access_key जांचें।');
        }
      } else {
        // Fallback: Use local Express /api/feedback backend if available
        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
        const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/feedback` : '/api/feedback';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: notes.trim(),
            name: name.trim() || undefined,
            email: email.trim() || undefined,
            category,
            rating,
          }),
        });

        const responseText = await res.text();
        let data: any = null;
        if (responseText && responseText.trim()) {
          try {
            data = JSON.parse(responseText);
          } catch {
            // Handled below
          }
        }

        if (res.ok && data?.success) {
          setStatus('success');
          setResponseMsg('फीडबैक सफलतापूर्वक Yaaro Ka Yaar को भेज दिया गया!');
          if (data.previewUrl) {
            setPreviewUrl(data.previewUrl);
          }
          setNotes('');
        } else {
          setStatus('error');
          if (res.status === 404) {
            setResponseMsg('GitHub Pages पर बैकएंड नहीं है। कृपया Web3Forms access_key का उपयोग करें।');
          } else {
            setResponseMsg(data?.error || data?.message || `फीडबैक भेजने में त्रुटि हुई (Status: ${res.status})।`);
          }
        }
      }
    } catch (err: any) {
      console.error('Feedback submit error:', err);
      setStatus('error');
      setResponseMsg('सबमिट करने में विफल। कृपया इंटरनेट कनेक्शन या access_key जांचें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['General Feedback', 'Feature Request', 'Greeting Idea', 'Bug Report'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden no-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-4 sm:p-5 my-auto max-h-[96vh] overflow-hidden no-scrollbar transition-all duration-300 ${
          theme.isDark
            ? 'bg-slate-900/95 border-white/15 text-white shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Send Feedback / सुझाव भेजें</h2>
              <div className="flex items-center gap-1.5 text-[11px] opacity-75 mt-0.5">
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>To:</span>
                <span className="font-semibold text-emerald-400">Yaaro Ka Yaar</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              theme.isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-1.5">धन्यवाद! (Thank You)</h3>
            <p className="text-xs opacity-80 max-w-sm mb-2">{responseMsg}</p>
            <p className="text-[11px] opacity-70 mb-3">
              Destination: <span className="font-bold text-emerald-400">Yaaro Ka Yaar</span>
            </p>

            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:underline mb-3 font-mono"
              >
                <span>View SMTP Email Delivery Preview</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setStatus('idle')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-current opacity-70 hover:opacity-100 transition-opacity"
              >
                Write Another Note
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form with Web3Forms Action & Hidden Access Key Input */
          <form
            action="https://api.web3forms.com/submit"
            method="POST"
            onSubmit={handleSubmit}
            className="mt-3 space-y-2.5"
          >
            {/* Hidden Input Field for Web3Forms Access Key */}
            <input
              type="hidden"
              name="access_key"
              value={WEB3FORMS_ACCESS_KEY}
            />
            {/* Optional Web3Forms Customizations */}
            <input
              type="hidden"
              name="subject"
              value={`[Feedback: Yaaro Ka Yaar] ${category} from ${name || 'Visitor'}`}
            />
            <input
              type="hidden"
              name="from_name"
              value="Yaaro Ka Yaar Welcome App"
            />
            <input
              type="hidden"
              name="category"
              value={category}
            />
            <input
              type="hidden"
              name="rating"
              value={`${rating} / 5 Stars`}
            />

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider opacity-70 mb-1">
                Category
              </label>
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      category === cat
                        ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                        : theme.isDark
                        ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes / Message Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                  Notes / Message <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] font-mono opacity-50">{notes.length} chars</span>
              </div>
              <textarea
                required
                name="message"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="यहाँ अपने नोट्स या सुझाव लिखें (Write your notes/feedback here)..."
                className={`w-full p-2.5 text-xs rounded-xl border outline-none transition-all resize-none no-scrollbar ${
                  theme.isDark
                    ? 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-400 focus:bg-white/10'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Name & Email (2-column layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider opacity-70 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yaaro Ka Yaar"
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none transition-all ${
                    theme.isDark
                      ? 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider opacity-70 mb-1">
                  Your Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none transition-all ${
                    theme.isDark
                      ? 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Experience Rating */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                Experience Rating:
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-transform hover:scale-120"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-400/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{responseMsg}</span>
              </div>
            )}

            {/* Footer with Submit Button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200/10 dark:border-white/10">
              <span className="text-[10px] opacity-70">
                Direct to <strong className="font-semibold text-emerald-400">Yaaro Ka Yaar</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    theme.isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition-all shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
