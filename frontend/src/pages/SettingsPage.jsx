import { useEffect, useRef, useState, useContext } from "react";
import { Bell, BookOpen, CreditCard, Link2, LogOut, Save, ShieldAlert, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearAll, clearUser, getDefaults, getUser, saveDefaults, setUser } from "../utils/storage";
import { AuthContext } from "../context/AuthContext";

const tabs = [
  ["profile", "Profile", User],
  ["notifications", "Notifications", Bell],
  ["defaults", "Exam Defaults", BookOpen],
  ["integrations", "Integrations", Link2],
  ["billing", "Billing", CreditCard],
];

function initials(name = "Question Papers") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[1001] rounded-2xl bg-[#111827] px-5 py-4 text-sm font-bold text-white shadow-lg">
      {toast}
    </div>
  );
}

function Toggle({ label, description, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      type="button"
      onClick={() => setChecked((value) => !value)}
      className="flex w-full items-center justify-between gap-5 rounded-2xl border border-[var(--border)] bg-white p-4 text-left"
    >
      <span>
        <span className="block font-bold text-[#111827]">{label}</span>
        <span className="mt-1 block text-sm text-[#6B7280]">{description}</span>
      </span>
      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-[#2563EB]" : "bg-[var(--border)]"}`}>
        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

function inputClass() {
  return "h-[40px] w-full appearance-none rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB] read-only:bg-[#F0F4F8]";
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const { setIsAuthenticated, setCurrentPage, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    school: "",
    role: "Teacher",
  });
  const [avatar, setAvatar] = useState("");
  const [defaults, setDefaults] = useState(getDefaults());
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) {
      setProfile({
        name: storedUser.name || storedUser.fullName || "",
        email: storedUser.email || "",
        school: storedUser.school || storedUser.institution || "",
        role: storedUser.role || "Teacher",
      });
    }
    setAvatar(localStorage.getItem("qp_avatar") || "");
  }, []);

  const saveProfile = () => {
    const userToSave = {
      name: profile.name,
      email: profile.email,
      school: profile.school,
      role: profile.role,
    };
    localStorage.setItem("qp_current_user", JSON.stringify(userToSave));
    localStorage.setItem("qp_auth", "true");
    
    // Dispatch update event for sidebar
    window.dispatchEvent(new Event("qp_profile_changed"));
    showToast("Profile saved successfully!");
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("qp_avatar", reader.result);
      setAvatar(reader.result);
      window.dispatchEvent(new Event("qp_profile_changed"));
      showToast("Avatar updated successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const deleteAccount = () => {
    if (!window.confirm("This will permanently delete your account. Are you sure?")) return;
    
    // Clear all qp_* keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("qp_")) {
        localStorage.removeItem(key);
      }
    });
    window.dispatchEvent(new Event("qp_profile_changed"));
    navigate("/");
  };

  return (
    <div className="animate-page-fade">
      <h1 className="text-4xl font-extrabold text-[#111827]">Settings</h1>
      <p className="mt-2 text-[#6B7280]">Manage profile, preferences, integrations, and billing.</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl bg-white p-3 shadow-sm border border-[#E2E8F0] xl:self-start">
          <nav className="flex gap-2 overflow-x-auto xl:flex-col">
            {tabs.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${
                  activeTab === id ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#6B7280] hover:bg-[#F0F4F8]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="rounded-2xl bg-white p-6 shadow-sm border border-[#E2E8F0]">
          {activeTab === "profile" ? (
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827]">Profile Information</h2>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="h-20 w-20 rounded-full object-cover border border-[#E2E8F0]" />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-[#2563EB] text-2xl font-extrabold text-white">
                      {initials(profile.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-[#111827]">{profile.name || "Teacher"}</p>
                    <p className="text-sm text-[#6B7280]">{profile.role}</p>
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-11 rounded-lg border border-[#2563EB] bg-white px-5 text-sm font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition"
                  >
                    Change Avatar
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#111827]">Full Name</span>
                  <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className={inputClass()} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#111827]">Email Address</span>
                  <input value={profile.email} readOnly className={inputClass()} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#111827]">School / Institution</span>
                  <input value={profile.school} onChange={(event) => setProfile({ ...profile, school: event.target.value })} className={inputClass()} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#111827]">Role</span>
                  <select value={profile.role} onChange={(event) => setProfile({ ...profile, role: event.target.value })} className={inputClass()}>
                    <option>Teacher</option>
                    <option>Admin</option>
                  </select>
                </label>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveProfile}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-[#1D4ED8] transition"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#111827] bg-white px-5 text-sm font-bold text-[#111827] hover:bg-gray-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>

              <div className="mt-8 border-t border-[#E2E8F0] pt-6">
                <h3 className="text-lg font-extrabold text-[#DC2626]">Danger Zone</h3>
                <button
                  type="button"
                  onClick={deleteAccount}
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg border border-[#DC2626] bg-white px-5 text-sm font-bold text-[#DC2626] hover:bg-red-50 transition"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Delete Account
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "notifications" ? (
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827]">Notifications</h2>
              <div className="mt-6 grid gap-3">
                <Toggle label="Email notifications" description="Receive product and account updates." defaultChecked />
                <Toggle label="Paper generation alerts" description="Show alerts when question papers are ready." defaultChecked />
                <Toggle label="Weekly digest" description="Summarize template and paper activity." />
                <Toggle label="New feature announcements" description="Learn about new exam builder tools." />
              </div>
            </div>
          ) : null}

          {activeTab === "defaults" ? (
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827]">Exam Defaults</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#111827]">Default subject</span>
                  <select value={defaults.subject} onChange={(event) => setDefaults({ ...defaults, subject: event.target.value })} className={inputClass()}>
                    {["Physics", "Mathematics", "Chemistry", "Biology", "English", "History"].map((subject) => <option key={subject}>{subject}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#111827]">Default grade</span>
                  <select value={defaults.grade} onChange={(event) => setDefaults({ ...defaults, grade: event.target.value })} className={inputClass()}>
                    {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((grade) => <option key={grade}>{grade}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#111827]">Default duration</span>
                  <input type="number" value={defaults.duration} onChange={(event) => setDefaults({ ...defaults, duration: Number(event.target.value) || 0 })} className={inputClass()} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#111827]">Default total marks</span>
                  <input type="number" value={defaults.totalMarks} onChange={(event) => setDefaults({ ...defaults, totalMarks: Number(event.target.value) || 0 })} className={inputClass()} />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  saveDefaults(defaults);
                  showToast("Defaults saved.");
                }}
                className="mt-6 h-11 rounded-lg bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-[#1D4ED8] transition"
              >
                Save Defaults
              </button>
            </div>
          ) : null}

          {activeTab === "integrations" ? (
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827]">Integrations</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {["Google Classroom", "WhatsApp Share", "Email Export"].map((name) => (
                  <article key={name} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                    <h3 className="font-bold text-[#111827]">{name}</h3>
                    <p className="mt-2 text-sm text-[#6B7280]">Connect classroom workflows.</p>
                    <button type="button" className="mt-5 h-10 rounded-lg border border-[#2563EB] bg-white px-4 text-sm font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition">Connect</button>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "billing" ? (
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827]">Billing</h2>
              <div className="mt-6 rounded-2xl border border-[#E2E8F0] p-6 bg-white">
                <p className="text-sm font-bold uppercase text-[#2563EB]">Free Plan</p>
                <h3 className="mt-2 text-3xl font-extrabold text-[#111827]">₹0 / month</h3>
                <ul className="mt-5 space-y-2 text-sm text-[#6B7280]">
                  <li>Unlimited local templates</li>
                  <li>Frontend-only mock generation</li>
                  <li>PDF export UI controls</li>
                </ul>
                <button type="button" className="mt-6 h-11 rounded-lg bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-[#1D4ED8] transition">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
      <Toast toast={toast} />

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#F0F4F8] px-5">
          <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl border border-[#E2E8F0]">
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
    </div>
  );
}
