import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Sparkles,
  Share2,
} from 'lucide-react';

interface StudioPreviewModalProps {
  slug: string;
  photographerName?: string;
  isOpen: boolean;
  onClose: () => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const StudioPreviewModal: React.FC<StudioPreviewModalProps> = ({
  slug,
  photographerName = 'Studio',
  isOpen,
  onClose,
}) => {
  const { addToast } = useToast();
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  if (!isOpen) return null;

  const publicUrl = `/p/${slug}`;
  const fullUrl = `${window.location.origin}${publicUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    addToast('Studio bio link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    addToast('Preview refreshed', 'info');
  };

  const getContainerWidth = () => {
    switch (device) {
      case 'mobile':
        return 'w-[375px] max-w-full';
      case 'tablet':
        return 'w-[768px] max-w-full';
      case 'desktop':
      default:
        return 'w-full max-w-6xl';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Top Controls Bar */}
      <div className="bg-[#121212] border border-[#222222] rounded-t-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Studio Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center text-[#C9A86A]">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 id="preview-modal-title" className="font-serif text-sm font-medium text-[#F7F5F0]">
              {photographerName} <span className="text-xs font-mono text-[#888888]">(@{slug})</span>
            </h3>
            <p className="text-[11px] font-mono text-[#666666] hidden sm:block">
              Real-time Public Studio Preview
            </p>
          </div>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center bg-[#181818] border border-[#2A2A2A] rounded-sm p-1 gap-1">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-mono transition-colors ${
              device === 'desktop'
                ? 'bg-[#C9A86A] text-[#0B0B0B] font-semibold'
                : 'text-[#888888] hover:text-[#F7F5F0]'
            }`}
            aria-label="Desktop preview"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-mono transition-colors ${
              device === 'tablet'
                ? 'bg-[#C9A86A] text-[#0B0B0B] font-semibold'
                : 'text-[#888888] hover:text-[#F7F5F0]'
            }`}
            aria-label="Tablet preview"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-mono transition-colors ${
              device === 'mobile'
                ? 'bg-[#C9A86A] text-[#0B0B0B] font-semibold'
                : 'text-[#888888] hover:text-[#F7F5F0]'
            }`}
            aria-label="Mobile preview"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mobile (375px)</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 text-[#888888] hover:text-[#F7F5F0] hover:bg-[#1C1C1C] rounded-sm transition-colors"
            title="Reload Preview Frame"
            aria-label="Reload Preview Frame"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] hover:bg-[#222222] text-[#D0D0D0] text-xs font-mono uppercase tracking-wider border border-[#2E2E2E] rounded-sm transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C9A86A]" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-wider font-semibold rounded-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Live Tab</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#888888] hover:text-[#F7F5F0] hover:bg-[#1C1C1C] rounded-sm ml-1"
            aria-label="Close preview modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Frame Viewport Canvas */}
      <div className="flex-1 bg-[#090909] border-x border-b border-[#222222] rounded-b-sm overflow-hidden flex items-center justify-center p-2 sm:p-6 relative">
        <div
          className={`${getContainerWidth()} h-full transition-all duration-300 rounded-sm overflow-hidden shadow-2xl border border-[#252525] bg-[#080808] flex flex-col relative`}
        >
          {/* Simulated Browser URL bar for preview frame */}
          <div className="bg-[#121212] border-b border-[#202020] px-3 py-1.5 flex items-center gap-2 text-[11px] font-mono text-[#777777] shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
            </div>
            <div className="flex-1 bg-[#0B0B0B] px-3 py-0.5 rounded text-center text-[#999999] truncate">
              {fullUrl}
            </div>
          </div>

          <iframe
            key={iframeKey}
            src={publicUrl}
            title={`${photographerName} Public Studio Preview`}
            className="w-full flex-1 border-none bg-[#080808]"
          />
        </div>
      </div>
    </div>
  );
};
