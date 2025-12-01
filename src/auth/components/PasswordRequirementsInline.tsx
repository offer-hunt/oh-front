import type { PasswordRequirementsState } from '@/auth/validation';

interface PasswordRequirementsInlineProps {
  requirements: PasswordRequirementsState;
}

export function PasswordRequirementsInline({ requirements }: PasswordRequirementsInlineProps) {
  const getItemStyle = (isOk: boolean) => ({
    color: isOk ? 'var(--success)' : 'var(--text-tertiary)',
    transition: 'color 0.2s ease',
    fontWeight: isOk ? 600 : 400,
  });

  return (
    <div className="password-requirements-inline" style={{ marginTop: '0.5rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      <span style={getItemStyle(requirements.upper)}>[A-Z]</span>
      <span className="password-requirements-inline__sep" style={{ color: 'var(--border)' }}>|</span>
      
      <span style={getItemStyle(requirements.lower)}>[a-z]</span>
      <span className="password-requirements-inline__sep" style={{ color: 'var(--border)' }}>|</span>
      
      <span style={getItemStyle(requirements.digit)}>[0-9]</span>
      <span className="password-requirements-inline__sep" style={{ color: 'var(--border)' }}>|</span>
      
      <span style={getItemStyle(requirements.special)}>[*-!]</span>
      <span className="password-requirements-inline__sep" style={{ color: 'var(--border)' }}>|</span>
      
      <span style={getItemStyle(requirements.length)}>8+ символов</span>
    </div>
  );
}