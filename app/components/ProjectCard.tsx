'use client';

export interface Project {
  id: number;
  hn_post_id: string;
  hn_title: string;
  hn_url: string;
  hn_score: number;
  hn_author: string;
  hn_created_at: string;
  github_url: string;
  github_owner: string;
  github_repo: string;
  description: string | null;
  readme_preview: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  owner_avatar: string;
  owner_bio: string | null;
  owner_repos: number;
  owner_stars: number;
}

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

interface ProjectCardProps {
  project: Project;
  visible: boolean;
}

export function ProjectCard({ project, visible }: ProjectCardProps) {
  return (
    <article className={`card ${visible ? 'card-visible' : 'card-hidden'}`}>

      {/* HN Section */}
      <div className="card-hn-row">
        <a
          href={project.hn_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hn-score"
          title="Open HN thread"
        >
          ▲ {project.hn_score}
        </a>
        <h2 className="hn-title">{project.hn_title}</h2>
      </div>

      <div className="divider" />

      {/* Owner Section */}
      <div className="owner-row">
        {project.owner_avatar && (
          <img
            src={project.owner_avatar}
            alt={project.github_owner}
            className="owner-avatar"
          />
        )}
        <div className="owner-info">
          <a
            href={`https://github.com/${project.github_owner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="owner-handle"
          >
            github.com/{project.github_owner}
          </a>
          <div className="owner-stats">
            <span className="meta">{project.owner_repos} repos</span>
            <span className="meta-sep">·</span>
            <span className="meta">⭐ {fmt(project.owner_stars)} total stars</span>
          </div>
          {project.owner_bio && (
            <p className="owner-bio">{project.owner_bio}</p>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* Repo Section */}
      <div className="repo-section">
        <h1 className="repo-name">
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="repo-link"
          >
            {project.github_owner}/{project.github_repo}
          </a>
        </h1>

        {project.description && (
          <p className="repo-description">{project.description}</p>
        )}

        {project.readme_preview && (
          <p className="readme-preview">{project.readme_preview}</p>
        )}

        {project.topics && project.topics.length > 0 && (
          <div className="topics">
            {project.topics.map((t) => (
              <span key={t} className="topic-tag">{t}</span>
            ))}
          </div>
        )}

        <div className="repo-stats">
          <span className="stat">⭐ {fmt(project.stars)}</span>
          <span className="stat">⑂ {fmt(project.forks)}</span>
          {project.language && (
            <span className="stat">● {project.language}</span>
          )}
        </div>
      </div>

    </article>
  );
}
