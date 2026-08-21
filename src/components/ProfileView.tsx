import React, { useState } from "react";
import {
  User,
  Mail,
  Briefcase,
  Award,
  Layers,
  Save,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { UserProfile } from "../types.js";

interface ProfileViewProps {
  user: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
  onShowToast: (
    title: string,
    message?: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onShowToast,
}) => {
  const [fullName, setFullName] = useState(user?.fullName || "Alex Morgan");
  const [email, setEmail] = useState(user?.email || "alex.morgan@example.com");
  const [targetJobTitle, setTargetJobTitle] = useState(
    user?.targetJobTitle || "Senior Full Stack Engineer",
  );
  const [experienceLevel, setExperienceLevel] = useState<
    "entry" | "mid" | "senior" | "lead" | "executive"
  >(user?.experienceLevel || "senior");
  const [skillsInput, setSkillsInput] = useState(
    user?.savedSkills?.join(", ") ||
      "React, TypeScript, Node.js, Next.js, PostgreSQL, AWS, Docker, GraphQL",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const skillsArray = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedUser: UserProfile = {
      id: user?.id || "demo-user-123",
      email,
      fullName,
      targetJobTitle,
      experienceLevel,
      savedSkills: skillsArray,
    };

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      if (res.ok) {
        onUpdateUser(updatedUser);
        onShowToast(
          "Profile Saved",
          "Your career preferences and target skills have been updated.",
          "success",
        );
      } else {
        throw new Error("Failed to save profile.");
      }
    } catch {
      onUpdateUser(updatedUser);
      onShowToast("Profile Saved", "Preferences updated locally.", "success");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="profile-page"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <User className="w-7 h-7 text-indigo-600 " />
          <span>Candidate Profile & ATS Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Customize your career targets and default skill inventory to fine-tune
          AI resume scoring.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 ">
            Account Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 "
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 "
                />
              </div>
            </div>
          </div>
        </div>

        {/* Career Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 ">
            Target Career Goals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Role / Job Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={targetJobTitle}
                  onChange={(e) => setTargetJobTitle(e.target.value)}
                  placeholder="e.g. Senior Staff Engineer"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 "
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 capitalize"
              >
                <option value="entry">Entry-Level (0-2 years)</option>
                <option value="mid">Mid-Level (3-5 years)</option>
                <option value="senior">Senior (6-9 years)</option>
                <option value="lead">Lead / Staff (10+ years)</option>
                <option value="executive">Executive / VP / C-Suite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Core Skills & Tools Inventory (comma separated)
            </label>
            <textarea
              rows={3}
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. React, Python, Product Strategy, Agile, SQL..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The AI will check your resumes against this inventory when
              analyzing gaps.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
