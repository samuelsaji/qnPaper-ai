import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Zap } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { apiLogin, apiSignup } from "../utils/api";

function TextInput({ icon: Icon, error, right, ...props }) {
  return (
    <label className="block">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 focus-within:border-[#2563EB]">
        {Icon ? <Icon className="h-4 w-4 text-[var(--text-muted)]" /> : null}
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          {...props}
        />
        {right}
      </div>
      {error ? <p className="mt-1.5 text-xs font-semibold text-[var(--danger)]">{error}</p> : null}
    </label>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [tab, setTab] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signInErrors, setSignInErrors] = useState({});

  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Teacher",
  });
  const [signUpErrors, setSignUpErrors] = useState({});

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignIn = async () => {
    const errors = {};
    if (!signInData.email) errors.email = "Email is required";
    else if (!validateEmail(signInData.email)) errors.email = "Enter a valid email";
    if (!signInData.password) errors.password = "Password is required";
    if (Object.keys(errors).length) { setSignInErrors(errors); return; }

    setLoading(true);
    try {
      const res = await apiLogin(signInData.email.trim().toLowerCase(), signInData.password);
      login(res.token, { user_id: res.user_id, email: signInData.email.trim().toLowerCase(), name: signInData.email.split("@")[0] });
      navigate("/dashboard");
    } catch (err) {
      setSignInErrors({ password: err.message || "Invalid credentials" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const errors = {};
    if (!signUpData.fullName || signUpData.fullName.trim().length < 2)
      errors.fullName = "Full name must be at least 2 characters";
    if (!signUpData.email) errors.email = "Email is required";
    else if (!validateEmail(signUpData.email)) errors.email = "Enter a valid email";
    if (!signUpData.password || signUpData.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (signUpData.confirmPassword !== signUpData.password)
      errors.confirmPassword = "Passwords do not match";
    if (Object.keys(errors).length) { setSignUpErrors(errors); return; }

    setLoading(true);
    try {
      await apiSignup(
        signUpData.email.trim().toLowerCase(),
        signUpData.password,
        signUpData.fullName.trim()
      );
      // Auto sign in after signup
      const res = await apiLogin(signUpData.email.trim().toLowerCase(), signUpData.password);
      login(res.token, {
        user_id: res.user_id,
        email: signUpData.email.trim().toLowerCase(),
        name: signUpData.fullName.trim(),
      });
      navigate("/templates");
    } catch (err) {
      setSignUpErrors({ email: err.message || "Signup failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#F0F4F8] lg:grid-cols-2">
      {/* Left panel */}
      <section className="flex min-h-[48vh] flex-col justify-between bg-[#111827] p-8 text-white md:p-12 lg:min-h-screen">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2563EB]/15 text-[#2563EB]">
          <Zap className="h-7 w-7 fill-[#2563EB]" />
        </div>
        <div className="my-12 max-w-xl">
          <h1 className="text-5xl font-bold leading-tight text-white">Question Papers</h1>
          <p className="mt-5 text-3xl font-bold text-[#2563EB]">India's AI Exam Builder</p>
          <p className="mt-4 text-lg text-gray-300">Generate structured exam papers in seconds</p>
        </div>
      </section>

      {/* Right panel */}
      <section className="flex items-center justify-center p-5 md:p-10">
        <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-md md:p-10 border border-[#E2E8F0]">
          <div className="mb-8 flex gap-8 border-b border-[var(--border)]">
            {[["signin", "Sign In"], ["signup", "Sign Up"]].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); setSignInErrors({}); setSignUpErrors({}); }}
                className={`border-b-2 pb-3 text-sm font-bold transition ${
                  tab === key ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[var(--text-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "signin" ? (
            <div className="space-y-4">
              <TextInput
                icon={Mail}
                placeholder="Email Address"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                error={signInErrors.email}
              />
              <TextInput
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                error={signInErrors.password}
                right={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--text-muted)]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="h-11 w-full rounded-full bg-[#111827] font-bold text-white hover:bg-[#1f2937] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <TextInput
                icon={User}
                placeholder="Full Name"
                value={signUpData.fullName}
                onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                error={signUpErrors.fullName}
              />
              <TextInput
                icon={Mail}
                placeholder="Email Address"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                error={signUpErrors.email}
              />
              <TextInput
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                error={signUpErrors.password}
                right={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--text-muted)]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <TextInput
                icon={Lock}
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={signUpData.confirmPassword}
                onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                error={signUpErrors.confirmPassword}
                right={
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-[var(--text-muted)]">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <select
                value={signUpData.role}
                onChange={(e) => setSignUpData({ ...signUpData, role: e.target.value })}
                className="h-12 w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[#2563EB]"
              >
                <option>Teacher</option>
                <option>Admin</option>
              </select>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="h-11 w-full rounded-full bg-[#111827] font-bold text-white hover:bg-[#1f2937] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
