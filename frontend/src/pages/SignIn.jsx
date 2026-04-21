import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import {
  MdEmail, MdLock, MdPerson, MdPhone,
  MdSchool, MdCorporateFare, MdInfoOutline, MdArrowForward, MdClose
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Checkbox from "components/checkbox";
import axios from "axios";

// ─── CONFIG ────────────────────────────────────────────────
// Set this in your .env file as REACT_APP_API_URL=http://localhost:5000
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Artificial Intelligence",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  facultyRole: "",
  department: "",
};

// ─── COMPONENT ─────────────────────────────────────────────
export default function SignIn() {
  const navigate = useNavigate();

  // ── All hooks MUST be inside the component ──
  const [isLogin, setIsLogin] = useState(true);
  const [regRole, setRegRole] = useState("student");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // ── Helpers ──────────────────────────────────────────────
  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setError("");
  };

  const switchTab = (loginMode) => {
    setIsLogin(loginMode);
    resetForm(); // clears all fields + error when switching tabs
  };

  const switchRole = (role) => {
    setRegRole(role);
    resetForm(); // clears all fields + error when switching student ↔ faculty
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ── API Call ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // ── LOGIN ──────────────────────────────────────────
        const { data } = await axios.post(`${API_BASE}/api/auth/login`, {
          email: formData.email,
          password: formData.password,
        });

        console.log("SUCCESSFUL LOGIN DATA:", data);

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("user", JSON.stringify(data));

        const role = data.role;
        if (role === "student") {
          navigate("/admin/my-bookings");
        } else if (role === "faculty") {
          navigate("/admin/my-schedule");
        } else if (role === "jr_assistant") {
          navigate("/admin/jr-approvals");
        } else if (role === "superintendent") {
          navigate("/admin/exec-dashboard");
        } else if (role === "ar") {
          navigate("/admin/exec-approvals");
        } else {
          navigate("/");
        }
      } else {
        // ── REGISTER ──────────────────────────────────────
        // POST /api/auth/register  →  { name, email, password, role, phone?, facultyRole?, department? }
        // Response: { message: "Account created. Awaiting approval." }  (faculty)
        //           { token, user }                                      (student → auto-login)
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: regRole,
          ...(regRole === "faculty" && {
            phoneNumber: formData.phone,
            facultyRole: formData.facultyRole,
            department: formData.department,
          }),
        };

        const { data } = await axios.post(`${API_BASE}/api/auth/register`, payload);

        if (regRole === "faculty") {
          // Faculty needs manual approval → stay on page, show success message
          setError(""); // clear errors
          alert("Registration submitted! Wait for admin approval before logging in.");
          switchTab(true); // flip back to login
        } else {
          // Student gets auto-logged in
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("user", JSON.stringify(data));
          navigate("/student/dashboard");
        }
      }
    } catch (err) {
      // Extract error message from backend response or fallback
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ───────────────────────────────────────────────
  const inputStyle =
    "w-full rounded-xl p-3.5 pl-11 text-sm border border-gray-200 dark:border-navy-700 dark:bg-navy-900 dark:text-white text-navy-700 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 placeholder-gray-400 transition-all disabled:opacity-60";
  const selectStyle =
    "w-full rounded-xl p-3.5 pl-4 text-sm border border-gray-200 dark:border-navy-700 dark:bg-navy-900 dark:text-white text-navy-700 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none disabled:opacity-60";

  // ─── RENDER ────────────────────────────────────────────────
  return (
    <div className="h-screen w-full overflow-y-auto bg-[#F4F7FE] dark:bg-navy-900 px-4 py-12">

      {/* ─── MAIN FLOATING CARD ─── */}
      <div className="relative mx-auto w-full max-w-[440px] flex flex-col rounded-[24px] bg-white p-8 shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-navy-700 dark:bg-navy-800 dark:shadow-[0_0_24px_rgba(0,0,0,0.2)]">

        {/* ── Tab Toggle ── */}
        <div className="mb-8 flex rounded-xl bg-gray-50 dark:bg-navy-900/60 p-1.5 border border-gray-100 dark:border-navy-700 shadow-inner">
          {["Sign In", "Create Account"].map((label, i) => {
            const active = i === 0 ? isLogin : !isLogin;
            return (
              <button
                key={label}
                onClick={() => switchTab(i === 0)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all duration-300 ${
                  active
                    ? "bg-white dark:bg-navy-800 text-brand-500 shadow-sm border border-gray-100 dark:border-navy-700"
                    : "text-gray-500 hover:text-navy-700 dark:hover:text-gray-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Title ── */}
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-navy-700 dark:text-white">
            {isLogin ? "Welcome Back" : "IITR HallSync"}
          </h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {isLogin
              ? "Enter your email and password to sign in."
              : "Register using your institutional details."}
          </p>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3">
            <MdInfoOutline size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex-1">{error}</p>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
              <MdClose size={16} />
            </button>
          </div>
        )}

        {/* ── Google Auth (Login Only) ── */}
        {isLogin && (
          <>
            <button
              type="button"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-navy-700 transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:hover:bg-navy-900 disabled:opacity-60"
            >
              <FcGoogle size={20} /> Sign in with Google
            </button>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200 dark:bg-navy-700" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Or</p>
              <div className="h-px flex-1 bg-gray-200 dark:bg-navy-700" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Role Selector (Register Only) ── */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3 mb-2">
              {[
                { role: "student", label: "Student", Icon: MdSchool, color: "brand" },
                { role: "faculty", label: "Faculty", Icon: MdPerson, color: "purple" },
              ].map(({ role, label, Icon, color }) => {
                const active = regRole === role;
                return (
                  <div
                    key={role}
                    onClick={() => switchRole(role)}
                    className={`cursor-pointer rounded-xl border-2 p-3.5 flex items-center gap-3 transition-all ${
                      active
                        ? `border-${color}-500 bg-${color}-50/50 dark:bg-${color}-400/10 dark:border-${color}-400`
                        : "border-gray-100 bg-gray-50/50 hover:bg-gray-100 dark:bg-navy-900/50 dark:border-navy-700"
                    }`}
                  >
                    <div
                      className={`rounded-full p-2 flex-shrink-0 ${
                        active
                          ? `bg-${color}-500 text-white shadow-md shadow-${color}-500/20`
                          : "bg-white text-gray-400 dark:bg-navy-800"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <p
                      className={`text-sm font-bold ${
                        active ? `text-${color}-600 dark:text-${color}-400` : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Name (Register Only) ── */}
          {!isLogin && (
            <div className="relative">
              <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" name="name" required
                placeholder="Full Legal Name"
                value={formData.name} onChange={handleChange}
                disabled={loading}
                className={inputStyle}
              />
            </div>
          )}

          {/* ── Email ── */}
          <div className="relative">
            <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email" name="email" required
              placeholder={
                isLogin ? "mail@iitrpr.ac.in"
                : regRole === "student" ? "e.g., 2024csb1034@iitrpr.ac.in"
                : "e.g., prof@iitrpr.ac.in"
              }
              value={formData.email} onChange={handleChange}
              disabled={loading}
              className={inputStyle}
            />
          </div>

          {!isLogin && regRole === "student" && (
            <p className="text-[11px] font-bold text-brand-500 flex items-center gap-1.5 px-1 -mt-2">
              <MdInfoOutline size={14} /> Valid batches: 2022–2026 with program code.
            </p>
          )}

          {/* ── Faculty-Specific Fields ── */}
          {!isLogin && regRole === "faculty" && (
            <div className="flex flex-col gap-4">
              <div className="relative">
                <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel" name="phone" required
                  placeholder="Phone Number"
                  value={formData.phone} onChange={handleChange}
                  disabled={loading}
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select name="facultyRole" required value={formData.facultyRole} onChange={handleChange} disabled={loading} className={selectStyle}>
                  <option value="" disabled>Rank...</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Prof.</option>
                  <option value="Assistant Professor">Assistant Prof.</option>
                  <option value="Adjunct Professor">Adjunct</option>
                </select>
                <select name="department" required value={formData.department} onChange={handleChange} disabled={loading} className={selectStyle}>
                  <option value="" disabled>Dept...</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
                  <MdInfoOutline size={14} /> Manual Approval Required
                </p>
                <p className="text-xs font-medium text-navy-700 dark:text-gray-300">
                  Faculty accounts must be verified by the admin before login is permitted.
                </p>
              </div>
            </div>
          )}

          {/* ── Password ── */}
          <div className="relative">
            <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password" name="password" required
              placeholder={isLogin ? "Password" : "Create Password (Min. 8 chars)"}
              value={formData.password} onChange={handleChange}
              disabled={loading}
              className={inputStyle}
            />
          </div>

          {/* ── Login Footer ── */}
          {isLogin && (
            <div className="flex items-center justify-between px-1 mt-1">
              <div className="flex items-center gap-2">
                <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <p className="text-sm font-medium text-navy-700 dark:text-white">Keep me logged in</p>
              </div>
              <a href="#!" className="text-sm font-bold text-brand-500 hover:text-brand-600 transition-colors">
                Forgot Password?
              </a>
            </div>
          )}

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={loading}
            className={`mt-4 w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed ${
              !isLogin && regRole === "faculty"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-purple-500/25"
                : "bg-gradient-to-r from-brand-500 to-blue-600 hover:from-brand-400 hover:to-blue-500 shadow-brand-500/25"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {isLogin ? "Signing In..." : "Creating Account..."}
              </span>
            ) : (
              <>
                {isLogin ? "Sign In Securely" : "Create Account"}
                <MdArrowForward size={18} />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}