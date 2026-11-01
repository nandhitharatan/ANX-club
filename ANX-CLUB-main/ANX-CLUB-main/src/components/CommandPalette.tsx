"use client";

import { useEffect, useState, useRef, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    const customOpen = () => setOpen(true);
    
    document.addEventListener("keydown", down);
    document.addEventListener("open-command-palette", customOpen);
    
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("open-command-palette", customOpen);
    };
  }, []);

  useEffect(() => {
    if (deferredSearch.length < 3) {
      setAiResults([]);
      setIsSearchingAI(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      setIsSearchingAI(true);
      try {
        const res = await fetch('/api/v1/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: deferredSearch })
        });
        if (res.ok) {
          const data = await res.json();
          setAiResults(data.actions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingAI(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [deferredSearch]);

  if (!open) return null;

  const handleSelect = (action: () => void) => {
    action();
    setOpen(false);
    setSearch("");
  };

  const actions = [
    { name: "Browse Events", onSelect: () => router.push('/events') },
    { name: "Create an Event", onSelect: () => router.push('/admin/events/create') },
    { name: "Toggle Dark Mode", onSelect: () => setTheme(theme === "dark" ? "light" : "dark") },
    { name: "Messages", onSelect: () => toast.success('Messages feature coming soon!') },
  ];

  const filteredActions = actions.filter((action) =>
    action.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        paddingTop: '10vh', backdropFilter: 'blur(4px)'
      }}
      onClick={() => setOpen(false)}
    >
      <div 
        className="glass-panel"
        style={{ width: '100%', maxWidth: '600px', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '1rem', background: 'var(--surface-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <Search size={20} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
          <input 
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '1.25rem' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredActions.map((action) => (
            <button
              key={action.name}
              onClick={() => handleSelect(action.onSelect)}
              style={{
                textAlign: 'left',
                padding: '1rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {action.name}
            </button>
          ))}

          {search.length >= 3 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                <Sparkles size={14} /> AI Suggestions
              </div>
              
              {isSearchingAI ? (
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : aiResults.length > 0 ? (
                aiResults.map((action: any, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(() => router.push(action.url))}
                    style={{
                      textAlign: 'left',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      width: '100%',
                      marginBottom: '0.5rem'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary-color)')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{action.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{action.description}</div>
                  </button>
                ))
              ) : (
                <p style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.875rem' }}>
                  No AI suggestions found.
                </p>
              )}
            </div>
          )}

          {filteredActions.length === 0 && search.length < 3 && (
            <p style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Keep typing to ask AI...</p>
          )}
        </div>
      </div>
    </div>
  );
}
