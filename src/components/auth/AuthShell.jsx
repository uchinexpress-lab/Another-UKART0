import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';

const UKART_LOGO_URL =
  'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/01b5442de_ukart.jpg';

export default function AuthShell({
  showBack = false,
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
}) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Brand band */}
      <div className="bg-retail rounded-b-[28px] pb-10">
        <div
          className="flex items-center gap-3 px-5"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 18px)' }}
        >
          {showBack && (
            <button
              onClick={goBack}
              aria-label="Back"
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-retail-foreground active:scale-90 transition-transform shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-white shrink-0">
            <Image src={UKART_LOGO_URL} alt="Ukart" fittingType="fill" className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold text-retail-foreground leading-tight tracking-tight">
              Ukart
            </p>
            <p className="text-[11px] font-medium text-retail-foreground/75 leading-tight">
              No Market Wahala
            </p>
          </div>
        </div>
      </div>

      {/* Sheet */}
      <div className="relative flex-1 bg-card rounded-t-3xl -mt-6 px-5 pt-6 pb-10 border-t border-border">
        {Icon && (
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Icon className="w-7 h-7 text-retail" strokeWidth={2} />
          </div>
        )}

        {title && (
          <div className="mb-5">
            <h1 className="text-[22px] font-extrabold text-foreground tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
        )}

        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}