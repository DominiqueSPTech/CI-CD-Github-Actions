type Props = { path: string };

const LINKS = [
  { href: "#/", label: "Visão geral", icon: "▦", match: (p: string) => !p.startsWith("/lancamentos") },
  { href: "#/lancamentos", label: "Lançamentos", icon: "☰", match: (p: string) => p.startsWith("/lancamentos") },
];

export default function Sidebar({ path }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-logo">$</span>
        <span className="brand-text">GRANA</span>
      </div>
      <nav className="nav">
        <p className="nav-label">Menu</p>
        {LINKS.map((link) => (
          <a
            key={link.href}
            className={`nav-item${link.match(path) ? " active" : ""}`}
            href={link.href}
            title={link.label}
            aria-label={link.label}
          >
            <span aria-hidden>{link.icon}</span> <span className="nav-text">{link.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
