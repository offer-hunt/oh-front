import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TheoryPage } from '@/courses/types';
import { Icons } from '@/components/Icons';

interface TheoryPageViewProps {
  page: TheoryPage;
  onComplete: () => void;
  isCompleted: boolean;
  onRequestAI?: (selectedText: string) => void;
}

export function TheoryPageView({ page, onComplete, isCompleted }: TheoryPageViewProps) {
  return (
    <>
      {/* Video placeholder */}
      {page.theory.videoUrl && (
        <div
          style={{
            aspectRatio: '16/9',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 1.5rem',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}
            >
              ▶️
            </div>
            <p className="text-base" style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>
              Video Player
            </p>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)', wordBreak: 'break-all', maxWidth: '400px' }}>
              {page.theory.videoUrl}
            </p>
          </div>
        </div>
      )}

      {/* Markdown content */}
      {page.theory.mode === 'markdown' && page.theory.markdown ? (
        <div className="prose prose-lg prose-invert" style={{ maxWidth: 'none' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ ...props }) => (
                <h1
                  className="text-h2"
                  style={{
                    marginBottom: '1.5rem',
                    marginTop: '2.5rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  {...props}
                />
              ),
              h2: ({ ...props }) => (
                <h2 className="text-h3" style={{ marginBottom: '1rem', marginTop: '2rem' }} {...props} />
              ),
              h3: ({ ...props }) => (
                <h3 className="text-h4" style={{ marginBottom: '0.75rem', marginTop: '1.5rem' }} {...props} />
              ),
              p: ({ ...props }) => (
                <p className="text-base" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7' }} {...props} />
              ),
              ul: ({ ...props }) => (
                <ul
                  style={{
                    listStyle: 'disc',
                    marginLeft: '1.5rem',
                    marginBottom: '1rem',
                    color: 'var(--text-secondary)',
                  }}
                  {...props}
                />
              ),
              ol: ({ ...props }) => (
                <ol
                  style={{
                    listStyle: 'decimal',
                    marginLeft: '1.5rem',
                    marginBottom: '1rem',
                    color: 'var(--text-secondary)',
                  }}
                  {...props}
                />
              ),
              li: ({ ...props }) => (
                <li className="text-base" style={{ marginBottom: '0.5rem', lineHeight: '1.7' }} {...props} />
              ),
              code: ({ inline, ...props }: { inline?: boolean; children?: React.ReactNode }) =>
                inline ? (
                  <code
                    style={{
                      background: 'var(--bg-input)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--primary)',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }}
                    {...props}
                  />
                ) : (
                  <code
                    style={{
                      display: 'block',
                      background: '#1e1e1e',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflowX: 'auto',
                      color: '#e5e7eb',
                      margin: '1.5rem 0',
                    }}
                    {...props}
                  />
                ),
              blockquote: ({ ...props }) => (
                <blockquote
                  style={{
                    borderLeft: '4px solid var(--primary)',
                    paddingLeft: '1.5rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
                    margin: '1.5rem 0',
                    background: 'var(--primary-soft)',
                    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  }}
                  {...props}
                />
              ),
              strong: ({ ...props }) => <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }} {...props} />,
              a: ({ ...props }) => (
                <a
                  style={{
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--primary)',
                    transition: 'border-color 150ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  {...props}
                />
              ),
            }}
          >
            {page.theory.markdown}
          </ReactMarkdown>
        </div>
      ) : page.theory.text ? (
        /* Plain text content */
        <div className="text-base" style={{ color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
          {page.theory.text}
        </div>
      ) : (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface-soft)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
            }}
          >
            📝
          </div>
          <p className="text-base" style={{ color: 'var(--text-tertiary)' }}>
            Контент не добавлен
          </p>
        </div>
      )}

      {/* Attachments */}
      {page.theory.attachments && page.theory.attachments.length > 0 && (
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
          <h4
            className="text-h4"
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>📎</span>
            Прикреплённые материалы
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {page.theory.attachments.map((file) => (
              <div
                key={file.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-soft)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--primary-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}
                  >
                    📄
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="text-sm"
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete button */}
      {!isCompleted && (
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-primary" style={{ width: '100%', height: '48px', fontSize: '1rem' }} onClick={onComplete}>
            <span>Завершить и продолжить</span>
            <Icons.ChevronRight width={18} />
          </button>
        </div>
      )}

      {/* Completed indicator */}
      {isCompleted && (
        <div
          style={{
            marginTop: '3rem',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--success-soft)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icons.CheckCircle width={28} height={28} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <div className="text-base" style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '0.25rem' }}>
              Страница завершена
            </div>
            <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Вы можете перейти к следующей странице
            </div>
          </div>
        </div>
      )}
    </>
  );
}
