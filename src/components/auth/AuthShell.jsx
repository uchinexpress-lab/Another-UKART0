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
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* bottom pale-green leaf decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
        <div className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-primary/10 opacity-70 blur-2xl" />
        <div className="absolute -bottom-12 right-0 w-44 h-44 rounded-full bg-primary/5 opacity-50 blur-xl" />
      </div>

      {/* top bar: optional back + logo */}
      <div
        className="relative flex items-center gap-3 px-6"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
          paddingBottom: '8px',
        }}
      >
        {showBack && (
          <button
            onClick={goBack}
            aria-label="Back"
            className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
        )}
        <div className="w-16 h-16 rounded-full overflow-hidden ring-1 ring-border shrink-0">
          <Image
            src={UKART_LOGO_URL}
            alt="Ukart"
            fittingType="fill"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* optional hero icon */}
      {Icon && (
        <div className="relative px-6 pt-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" strokeWidth={2} />
          </div>
        </div>
      )}

      {/* title + subtitle */}
      {title && (
        <div className={`relative px-6 ${Icon ? 'pt-4' : 'pt-6'}`}>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed pr-2">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* content */}
      <div className="relative flex-1 px-6 pt-6 pb-10">
        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}