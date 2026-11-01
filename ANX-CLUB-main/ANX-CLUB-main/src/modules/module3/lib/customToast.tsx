import toast from "react-hot-toast";

export const showPremiumToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
  toast.custom((t) => (
    <div
      className={`${t.visible ? 'animate-fade-in' : ''} glass-panel`}
      style={{
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minWidth: '300px',
        pointerEvents: 'auto',
        borderLeft: `4px solid ${type === 'success' ? 'var(--primary-color)' : type === 'error' ? 'var(--accent-color)' : 'var(--secondary-color)'}`
      }}
    >
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{message}</p>
      </div>
      <button 
        onClick={() => toast.dismiss(t.id)} 
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
      >
        ×
      </button>
    </div>
  ), { duration: 4000 });
};
