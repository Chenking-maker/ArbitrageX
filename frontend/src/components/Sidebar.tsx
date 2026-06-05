import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/* ================================================================
   Navigation Items
   ================================================================ */

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    path: '/strategies',
    label: 'Strategies',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    path: '/trades',
    label: 'Trades',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    path: '/referral',
    label: 'Referral',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

/* ================================================================
   Sidebar Styles (injected once)
   ================================================================ */

const sidebarStyles = `
@keyframes sidebar-link-in {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes sidebar-logo-glow {
  0%, 100% { box-shadow: 0 0 12px rgba(18,99,82,0.3); }
  50% { box-shadow: 0 0 20px rgba(18,99,82,0.5), 0 0 40px rgba(253,116,45,0.1); }
}
@keyframes sidebar-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.ax-sidebar {
  --sb-primary: #126352;
  --sb-primary-light: #1a8a73;
  --sb-accent: #FD742D;
  --sb-bg: rgba(10, 31, 26, 0.85);
  --sb-border: rgba(18, 99, 82, 0.18);
  --sb-border-hover: rgba(18, 99, 82, 0.35);

  width: 260px;
  min-width: 260px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: var(--sb-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid var(--sb-border);
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  overflow: hidden;
  z-index: 10;
}

/* Subtle noise texture overlay */
.ax-sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
}

.ax-sidebar-logo {
  height: 68px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--sb-border);
  position: relative;
  gap: 12px;
  flex-shrink: 0;
}

.ax-sidebar-logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #126352 0%, #1a8a73 60%, #FD742D 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  letter-spacing: -0.02em;
  animation: sidebar-logo-glow 3s ease-in-out infinite;
  flex-shrink: 0;
}

.ax-sidebar-logo-text {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.01em;
}

.ax-sidebar-nav {
  flex: 1;
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.ax-sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255,255,255,0.4);
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  animation: sidebar-link-in 0.4s ease both;
  border: 1px solid transparent;
}

.ax-sidebar-link:hover {
  color: rgba(255,255,255,0.75);
  background: rgba(18,99,82,0.08);
  border-color: rgba(18,99,82,0.1);
}

.ax-sidebar-link.active {
  color: #fff;
  background: linear-gradient(135deg, rgba(18,99,82,0.18) 0%, rgba(18,99,82,0.06) 100%);
  border-color: rgba(18,99,82,0.3);
  box-shadow: 0 0 16px rgba(18,99,82,0.1), inset 0 1px 0 rgba(26,138,115,0.15);
}

.ax-sidebar-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, #126352, #FD742D);
}

.ax-sidebar-link svg {
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.ax-sidebar-link.active svg {
  filter: drop-shadow(0 0 4px rgba(18,99,82,0.4));
}

.ax-sidebar-footer {
  padding: 16px 20px 20px;
  border-top: 1px solid var(--sb-border);
  flex-shrink: 0;
}

.ax-sidebar-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: rgba(255,255,255,0.35);
  font-weight: 500;
}

.ax-sidebar-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: sidebar-pulse-dot 2s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(34,197,94,0.4);
}

.ax-sidebar-version {
  margin-top: 8px;
  font-size: 10.5px;
  color: rgba(255,255,255,0.18);
  letter-spacing: 0.02em;
}

/* User info at bottom */
.ax-sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(18,99,82,0.06);
  border: 1px solid rgba(18,99,82,0.1);
  transition: all 0.25s ease;
}

.ax-sidebar-user:hover {
  background: rgba(18,99,82,0.1);
  border-color: rgba(18,99,82,0.2);
}

.ax-sidebar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #126352, #1a8a73);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.ax-sidebar-user-info {
  flex: 1;
  min-width: 0;
}

.ax-sidebar-username {
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ax-sidebar-role {
  font-size: 10.5px;
  color: rgba(255,255,255,0.3);
  margin-top: 1px;
}
`;

function injectSidebarStyles() {
  if (typeof document === 'undefined') return;
  const id = 'ax-sidebar-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = sidebarStyles;
  document.head.appendChild(style);
}

/* ================================================================
   Sidebar Component
   ================================================================ */

export function Sidebar() {
  const { user } = useAuth();

  // Inject styles on mount
  if (typeof document !== 'undefined') {
    injectSidebarStyles();
  }

  return (
    <aside className="ax-sidebar">
      {/* Logo */}
      <div className="ax-sidebar-logo">
        <div className="ax-sidebar-logo-mark">AX</div>
        <span className="ax-sidebar-logo-text">ArbitrageX</span>
      </div>

      {/* Navigation */}
      <nav className="ax-sidebar-nav">
        {navItems.map((item, idx) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `ax-sidebar-link ${isActive ? 'active' : ''}`
            }
            style={{ animationDelay: `${0.05 + idx * 0.06}s` }}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="ax-sidebar-footer">
        {/* System status */}
        <div className="ax-sidebar-status">
          <div className="ax-sidebar-status-dot" />
          <span>System Online</span>
        </div>
        <div className="ax-sidebar-version">v1.0.0 &middot; Simulation Mode</div>

        {/* User info */}
        {user && (
          <div className="ax-sidebar-user">
            <div className="ax-sidebar-avatar">
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="ax-sidebar-user-info">
              <div className="ax-sidebar-username">{user.username || 'User'}</div>
              <div className="ax-sidebar-role">Trader</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
