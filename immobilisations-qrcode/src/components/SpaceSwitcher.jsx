import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

// Le logiciel a trois espaces distincts (cabinet, scan mobile, super admin) —
// ce sélecteur les rend explicites partout, pour qu'on sache toujours où on
// est et comment changer d'espace.
export default function SpaceSwitcher({ current, isPlatformAdmin }) {
  const { profile } = useAuth();
  if (!profile) return null;

  const spaces = [
    { key: "cabinet", label: "Cabinet", to: "/backoffice" },
    { key: "scan", label: "Scan mobile", to: "/scanner" },
  ];
  if (isPlatformAdmin) {
    spaces.push({ key: "admin", label: "Super admin", to: "/admin" });
  }

  return (
    <div className="space-switcher">
      {spaces.map((s) => (
        <Link
          key={s.key}
          to={s.to}
          className={`space-pill${s.key === current ? " space-pill-active" : ""}`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
