'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ProjectCard, Project } from './components/ProjectCard';
import { KeyboardHelp } from './components/KeyboardHelp';

const SEEN_KEY = 'discover_github_seen';

function getSeenIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function addSeenId(id: number) {
  const seen = getSeenIds();
  if (!seen.includes(id)) {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
  }
}

async function fetchRandomProject(excludeIds: number[]): Promise<Project | null> {
  const excludeParam = excludeIds.length > 0 ? `?exclude=${excludeIds.join(',')}` : '';
  const res = await fetch(`/api/projects/random${excludeParam}`);
  if (!res.ok) return null;
  return res.json();
}

export default function Home() {
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioning = useRef(false);

  const currentProject = history[historyIndex] ?? null;

  const showToast = useCallback((msg: string, duration = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), duration);
  }, []);

  const transition = useCallback(async (fn: () => Promise<void>) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setVisible(false);
    await new Promise((r) => setTimeout(r, 200));
    await fn();
    setVisible(true);
    isTransitioning.current = false;
  }, []);

  const loadNext = useCallback(async () => {
    await transition(async () => {
      setLoading(true);
      const seenIds = getSeenIds();
      const project = await fetchRandomProject(seenIds);
      if (!project) {
        setEmpty(true);
        setLoading(false);
        return;
      }
      addSeenId(project.id);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const next = [...sliced, project];
        setHistoryIndex(next.length - 1);
        return next;
      });
      setLoading(false);
      setEmpty(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition, historyIndex]);

  const goBack = useCallback(async () => {
    if (historyIndex <= 0) return;
    await transition(async () => {
      setHistoryIndex((i) => i - 1);
    });
  }, [transition, historyIndex]);

  const saveProject = useCallback(async () => {
    if (!currentProject) return;
    if (savedIds.has(currentProject.id)) {
      showToast('Already saved');
      return;
    }

    const res = await fetch('/api/saves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: currentProject.id,
        github_owner: currentProject.github_owner,
        github_repo: currentProject.github_repo,
        description: currentProject.description,
        stars: currentProject.stars,
        language: currentProject.language,
        github_url: currentProject.github_url,
        hn_url: currentProject.hn_url,
      }),
    });

    const data = await res.json();

    if (res.status === 400 && data.error === 'limit_reached') {
      showToast('Save limit reached (500/500)', 3000);
      return;
    }

    if (res.ok) {
      setSavedIds((prev) => new Set(prev).add(currentProject.id));
      showToast(`Saved! (${data.count}/500)`);
    }
  }, [currentProject, savedIds, showToast]);

  // Initial load
  useEffect(() => {
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (showHelp && (e.key === 'Escape' || e.key === '?')) {
        setShowHelp(false);
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          loadNext();
          break;
        case ' ':
          e.preventDefault();
          loadNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          goBack();
          break;
        case 's':
          saveProject();
          break;
        case 'g':
          if (currentProject) window.open(currentProject.github_url, '_blank');
          break;
        case 'h':
          if (currentProject) window.open(currentProject.hn_url, '_blank');
          break;
        case '?':
          setShowHelp((v) => !v);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loadNext, goBack, saveProject, currentProject, showHelp]);

  return (
    <main className="page">
      <header className="site-header">
        <span className="site-name">discover.gh</span>
        <span className="site-tagline">interesting projects from Hacker News</span>
      </header>

      <div className="card-area">
        {loading && !currentProject ? (
          <div className="loading">
            <div className="loading-dot" />
          </div>
        ) : empty ? (
          <div className="empty-state">
            <p className="empty-title">You&apos;ve seen everything!</p>
            <p className="empty-body">Come back tomorrow for fresh projects.</p>
            <button
              className="reset-btn"
              onClick={() => {
                localStorage.removeItem(SEEN_KEY);
                setEmpty(false);
                loadNext();
              }}
            >
              Reset &amp; start over
            </button>
          </div>
        ) : currentProject ? (
          <ProjectCard
            project={currentProject}
            visible={visible}
            onSave={saveProject}
            isSaved={savedIds.has(currentProject.id)}
          />
        ) : null}
      </div>

      <footer className="nav-bar">
        <button
          className="nav-hint"
          onClick={goBack}
          disabled={historyIndex <= 0}
          title="Previous (← ↑ k)"
        >
          <span className="nav-key">←</span> prev
        </button>
        <button
          className="nav-hint"
          onClick={loadNext}
          title="Next (→ ↓ j space)"
        >
          next <span className="nav-key">→</span>
        </button>
        <button
          className="nav-hint"
          onClick={saveProject}
          disabled={!currentProject}
          title="Save (s)"
        >
          <span className="nav-key">s</span> save
        </button>
        <button
          className="nav-hint"
          onClick={() => currentProject && window.open(currentProject.github_url, '_blank')}
          disabled={!currentProject}
          title="Open GitHub (g)"
        >
          <span className="nav-key">g</span> github
        </button>
        <button
          className="nav-hint"
          onClick={() => currentProject && window.open(currentProject.hn_url, '_blank')}
          disabled={!currentProject}
          title="Open HN (h)"
        >
          <span className="nav-key">h</span> hn
        </button>
        <button
          className="nav-hint"
          onClick={() => setShowHelp(true)}
          title="Keyboard help (?)"
        >
          <span className="nav-key">?</span> help
        </button>
      </footer>

      {toastMsg && (
        <div className="toast">{toastMsg}</div>
      )}

      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
    </main>
  );
}
