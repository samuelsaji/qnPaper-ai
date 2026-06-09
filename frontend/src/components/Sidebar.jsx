import { useEffect, useState, useContext } from "react";
import { FileText, LayoutDashboard, LogOut, Settings, Sparkles, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearUser, getUser } from "../utils/storage";
import { AuthContext } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Generate", path: "/generate", icon: Sparkles },
  { label: "Templates", path: "/templates", icon: FileText },
  { label: "Settings", path: "/settings", icon: Settings },
];

function initials(name = "Teacher") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({ mobileOpen, onClose }) {
  const { setIsAuthenticated, setCurrentPage, currentUser, logout } = useContext(AuthContext);
  const [avatar, setAvatar] = useState(() => localStorage.getItem("qp_avatar"));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const showLogout = location.pathname === "/settings";
  const displayName = currentUser?.name || "Teacher";

  useEffect(() => {
    const handleProfileChange = () => {
      setAvatar(localStorage.getItem("qp_avatar"));
    };
    window.addEventListener("qp_profile_changed", handleProfileChange);
    return () => window.removeEventListener("qp_profile_changed", handleProfileChange);
  }, []);

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => { setShowLogoutConfirm(false); logout(); };

  const content = (
    <aside className="flex h-full w-16 md:w-[220px] flex-col border-r border-[var(--border)] bg-white px-3 md:px-5 py-6 transition-all duration-200">
      <div className="mb-8 flex items-center justify-between lg:justify-end">
        <button type="button" className="rounded-full p-2 text-[var(--text-muted)] lg:hidden" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-8 rounded-xl bg-[#EFF6FF] p-2 md:p-4">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover shrink-0" />
          ) : (
            <div className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-full bg-[#2563EB] text-sm font-bold text-white shrink-0">
              {initials(displayName)}
            </div>
          )}
          <div className="min-w-0 hidden md:block">
            <p className="truncate font-bold text-[#111827]">{displayName}</p>
            <p className="text-xs text-[#6B7280]">{currentUser?.role || "Teacher"} Portal</p>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="mt-4 inline-flex rounded-full border border-[#2563EB] px-3 py-1 font-mono text-[10px] font-bold uppercase text-[#2563EB]">
            {currentUser?.role || "Teacher"}
          </span>
        </div>
      </div>

      <p className="mb-3 px-2 text-[11px] font-bold uppercase text-[#6B7280] hidden md:block">Main Menu</p>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "relative flex h-11 items-center gap-3 rounded-xl px-3 md:px-4 text-sm font-semibold transition-all duration-200 justify-center md:justify-start",
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB] before:absolute before:left-0 before:top-2 before:h-7 before:w-[3px] before:rounded-full before:bg-[#2563EB]"
                    : "text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB]",
                ].join(" ")
              }
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden md:block">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {showLogout ? (
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex h-11 items-center gap-3 rounded-xl px-3 md:px-4 text-sm font-semibold text-[#DC2626] hover:bg-red-50 justify-center md:justify-start"
          title="Logout"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="hidden md:block">Logout</span>
        </button>
      ) : null}
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 flex h-full w-16 md:w-[220px] flex-col transition-all duration-200">
        {content}
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close menu" />
          <div className="relative h-full translate-x-0 shadow-2xl">{content}</div>
        </div>
      ) : null}

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 px-5">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#111827]">Sign Out</h3>
            <p className="mt-2 text-sm text-[#6B7280]">Are you sure you want to sign out?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#374151] hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="h-10 rounded-lg bg-[#DC2626] px-4 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
