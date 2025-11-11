import type { PropsWithChildren, ReactNode } from 'react';

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  alert?: ReactNode;
  centered?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  alert,
  footer,
  centered,
  children,
}: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className={`auth-card${centered ? ' auth-card--centered' : ''}`}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
            AI-Hunt
          </div>
        </div>
        <h1 className="auth-card__title">{title}</h1>
        {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
        {alert}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}
