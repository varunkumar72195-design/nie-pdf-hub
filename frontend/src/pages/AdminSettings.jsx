
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  LockKeyhole,
  Save,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  LogOut,
  KeyRound,
  CheckCircle2,
  Megaphone,
  Info,
  AlertTriangle,
  CircleAlert,
  Bell,
} from "lucide-react";

import API from "../services/api";
import "../styles/admin-settings.css";

function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "Not entered", className: "empty" };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: "Weak", className: "weak" };
  }

  if (score <= 3) {
    return { score, label: "Medium", className: "medium" };
  }

  return { score, label: "Strong", className: "strong" };
}

function AdminSettings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notice Board state
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    announcement_type: "info",
    is_active: false,
  });

  const [noticeLoading, setNoticeLoading] = useState(true);
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeError, setNoticeError] = useState("");

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    loadProfile();
    loadAnnouncement();
  }, []);

  // Load admin profile
  const loadProfile = async () => {
    setLoading(true);
    setProfileError("");

    try {
      const response = await API.get("/admin/me", {
        requiresAuth: true,
      });

      setProfile({
        name: response.data.name || "",
        email: response.data.email || "",
      });
    } catch (error) {
      console.error("Profile loading error:", error);

      setProfileError(
        error.response?.data?.detail || "Unable to load admin profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load saved announcement
  const loadAnnouncement = async () => {
    setNoticeLoading(true);
    setNoticeError("");

    try {
      const response = await API.get("/announcements/admin", {
        requiresAuth: true,
      });

      if (response.data) {
        setAnnouncement({
          title: response.data.title || "",
          message: response.data.message || "",
          announcement_type:
            response.data.announcement_type || "info",
          is_active: response.data.is_active ?? false,
        });
      } else {
        setAnnouncement({
          title: "",
          message: "",
          announcement_type: "info",
          is_active: false,
        });
      }
    } catch (error) {
      console.error("Announcement loading error:", error);

      setNoticeError(
        error.response?.data?.detail ||
          "Unable to load announcement settings."
      );
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setProfileMessage("");
    setProfileError("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPasswordMessage("");
    setPasswordError("");
  };

  // Handle announcement fields
  const handleAnnouncementChange = (event) => {
    const { name, value, type, checked } = event.target;

    setAnnouncement((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setNoticeMessage("");
    setNoticeError("");
  };

  // Save announcement
  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault();

    setNoticeMessage("");
    setNoticeError("");

    const title = announcement.title.trim();
    const message = announcement.message.trim();

    if (!title || !message) {
      setNoticeError("Announcement title and message are required.");
      return;
    }

    setNoticeSaving(true);

    try {
      const response = await API.put(
        "/announcements/admin",
        {
          title,
          message,
          announcement_type: announcement.announcement_type,
          is_active: announcement.is_active,
        },
        {
          requiresAuth: true,
        }
      );

      setAnnouncement({
        title: response.data.title || title,
        message: response.data.message || message,
        announcement_type:
          response.data.announcement_type ||
          announcement.announcement_type,
        is_active: response.data.is_active ?? announcement.is_active,
      });

      setNoticeMessage("Announcement saved successfully.");
    } catch (error) {
      console.error("Announcement save error:", error);

      setNoticeError(
        error.response?.data?.detail ||
          "Unable to save announcement."
      );
    } finally {
      setNoticeSaving(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    const name = profile.name.trim();
    const email = profile.email.trim().toLowerCase();

    if (!name || !email) {
      setProfileError("Name and email are required.");
      return;
    }

    setProfileSaving(true);

    try {
      const response = await API.put(
        "/admin/profile",
        { name, email },
        { requiresAuth: true }
      );

      setProfile({
        name: response.data.name || name,
        email: response.data.email || email,
      });

      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      setProfileError(
        error.response?.data?.detail || "Unable to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !passwords.current_password ||
      !passwords.new_password ||
      !passwords.confirm_password
    ) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (passwords.new_password.length < 8) {
      setPasswordError("New password must contain at least 8 characters.");
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (passwords.current_password === passwords.new_password) {
      setPasswordError(
        "New password must be different from the current password."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      await API.put(
        "/admin/password",
        {
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        },
        { requiresAuth: true }
      );

      setPasswordMessage(
        "Password changed successfully. Log out and sign in again to refresh your session."
      );

      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error("Password update error:", error);

      setPasswordError(
        error.response?.data?.detail || "Unable to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const togglePassword = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out of the admin portal?"
    );

    if (!confirmed) return;

    sessionStorage.removeItem("access_token");
    navigate("/manage-portal", { replace: true });
  };

  const passwordStrength = getPasswordStrength(passwords.new_password);

  if (loading) {
    return (
      <div className="settings-loading">
        <RefreshCw className="settings-spinner" size={22} />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="admin-settings-page">
      <div className="settings-heading">
        <div>
          <span className="settings-eyebrow">ACCOUNT CONTROL</span>
          <h1>Admin Settings</h1>
          <p>Manage your account details and security preferences.</p>
        </div>

        <div className="settings-heading-icon">
          <ShieldCheck size={28} />
        </div>
      </div>

      <div className="settings-grid">

        {/* PROFILE SETTINGS */}
        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon profile-icon">
              <User size={21} />
            </div>

            <div>
              <h2>Profile Information</h2>
              <p>Update your administrator details.</p>
            </div>
          </div>

          {profileError && (
            <div className="settings-alert error">{profileError}</div>
          )}

          {profileMessage && (
            <div className="settings-alert success">
              <CheckCircle2 size={17} />
              <span>{profileMessage}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div className="settings-field">
              <label htmlFor="admin-name">Full Name</label>

              <div className="settings-input-wrapper">
                <User size={18} />
                <input
                  id="admin-name"
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your name"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="admin-email">Email Address</label>

              <div className="settings-input-wrapper">
                <Mail size={18} />
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="Enter your email"
                  maxLength={150}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="settings-primary-button"
              disabled={profileSaving}
            >
              <Save size={17} />
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        {/* PASSWORD SETTINGS */}
        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon password-icon">
              <LockKeyhole size={21} />
            </div>

            <div>
              <h2>Change Password</h2>
              <p>Keep your administrator account secure.</p>
            </div>
          </div>

          {passwordError && (
            <div className="settings-alert error">{passwordError}</div>
          )}

          {passwordMessage && (
            <div className="settings-alert success">
              <CheckCircle2 size={17} />
              <span>{passwordMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="settings-field">
              <label htmlFor="current-password">Current Password</label>

              <div className="settings-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  name="current_password"
                  value={passwords.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-visibility"
                  onClick={() => togglePassword("current")}
                  aria-label="Toggle current password visibility"
                >
                  {showPasswords.current ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="new-password">New Password</label>

              <div className="settings-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  name="new_password"
                  value={passwords.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-visibility"
                  onClick={() => togglePassword("new")}
                  aria-label="Toggle new password visibility"
                >
                  {showPasswords.new ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {passwords.new_password && (
                <div className={`password-strength ${passwordStrength.className}`}>
                  <div className="password-strength-top">
                    <span>Password strength</span>
                    <strong>{passwordStrength.label}</strong>
                  </div>

                  <div className="password-strength-bars">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <span
                        key={bar}
                        className={bar <= passwordStrength.score ? "active" : ""}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="settings-field">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <div className="settings-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirm_password"
                  value={passwords.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-visibility"
                  onClick={() => togglePassword("confirm")}
                  aria-label="Toggle confirm password visibility"
                >
                  {showPasswords.confirm ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <p className="settings-password-hint">
              Use at least 8 characters. A mix of uppercase, lowercase,
              numbers and symbols makes your password stronger.
            </p>

            <button
              type="submit"
              className="settings-primary-button"
              disabled={passwordSaving}
            >
              <LockKeyhole size={17} />
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>

        {/* NOTICE BOARD MANAGEMENT */}
        <section className="settings-card notice-board-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon notice-icon">
              <Megaphone size={21} />
            </div>

            <div>
              <h2>Notice Board Management</h2>
              <p>Publish announcements for students on the Home page.</p>
            </div>
          </div>

          {noticeError && (
            <div className="settings-alert error">{noticeError}</div>
          )}

          {noticeMessage && (
            <div className="settings-alert success">
              <CheckCircle2 size={17} />
              <span>{noticeMessage}</span>
            </div>
          )}

          {noticeLoading ? (
            <div className="notice-loading">
              <RefreshCw className="settings-spinner" size={20} />
              <span>Loading notice board...</span>
            </div>
          ) : (
            <form onSubmit={handleAnnouncementSubmit}>
              <div className="notice-status-row">
                <div className="notice-status-info">
                  <Bell size={19} />
                  <div>
                    <strong>Announcement visibility</strong>
                    <span>
                      {announcement.is_active
                        ? "Students can see this announcement."
                        : "This announcement is hidden from students."}
                    </span>
                  </div>
                </div>

                <label className="notice-toggle">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={announcement.is_active}
                    onChange={handleAnnouncementChange}
                  />
                  <span className="notice-toggle-slider" />
                </label>
              </div>

              <div className="settings-field">
                <label htmlFor="announcement-title">
                  Announcement Title
                </label>

                <input
                  id="announcement-title"
                  className="notice-text-input"
                  type="text"
                  name="title"
                  value={announcement.title}
                  onChange={handleAnnouncementChange}
                  placeholder="Example: Study Materials Available"
                  maxLength={200}
                  required
                />
              </div>

              <div className="settings-field">
                <label htmlFor="announcement-message">
                  Announcement Message
                </label>

                <textarea
                  id="announcement-message"
                  className="notice-textarea"
                  name="message"
                  value={announcement.message}
                  onChange={handleAnnouncementChange}
                  placeholder="Example: Currently, 4th Year study materials are available. Other years will be added soon."
                  rows={5}
                  required
                />
              </div>

              <div className="settings-field">
                <label htmlFor="announcement-type">
                  Announcement Type
                </label>

                <select
                  id="announcement-type"
                  className="notice-text-input"
                  name="announcement_type"
                  value={announcement.announcement_type}
                  onChange={handleAnnouncementChange}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="important">Important</option>
                </select>
              </div>

              <div className={`notice-preview ${announcement.announcement_type}`}>
                {announcement.announcement_type === "info" && (
                  <Info size={20} />
                )}

                {announcement.announcement_type === "warning" && (
                  <AlertTriangle size={20} />
                )}

                {announcement.announcement_type === "important" && (
                  <CircleAlert size={20} />
                )}

                <div>
                  <strong>
                    {announcement.title || "Announcement preview"}
                  </strong>
                  <p>
                    {announcement.message ||
                      "Your announcement message will appear here."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="settings-primary-button"
                disabled={noticeSaving}
              >
                <Save size={17} />
                {noticeSaving ? "Saving..." : "Save Announcement"}
              </button>
            </form>
          )}
        </section>

        {/* ACCOUNT INFORMATION */}
        <section className="settings-card account-info-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon account-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2>Account Information</h2>
              <p>Your current administrator account details.</p>
            </div>
          </div>

          <div className="account-info-list">
            <div className="account-info-item">
              <span>Account name</span>
              <strong>{profile.name || "Not available"}</strong>
            </div>

            <div className="account-info-item">
              <span>Email address</span>
              <strong>{profile.email || "Not available"}</strong>
            </div>

            <div className="account-info-item">
              <span>Account role</span>
              <strong className="account-role">
                <ShieldCheck size={15} />
                Administrator
              </strong>
            </div>

            <div className="account-info-item">
              <span>Portal access</span>
              <strong className="account-active">
                <span className="account-status-dot" />
                Active
              </strong>
            </div>
          </div>
        </section>

        {/* SESSION MANAGEMENT */}
        <section className="settings-card session-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon session-icon">
              <KeyRound size={21} />
            </div>

            <div>
              <h2>Session Management</h2>
              <p>Manage your current admin session.</p>
            </div>
          </div>

          <div className="session-description">
            <p>
              Sign out when you finish managing the portal, especially when
              using a shared computer.
            </p>
          </div>

          <button
            type="button"
            className="settings-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Log Out
          </button>
        </section>
      </div>

      <div className="settings-security-note">
        <ShieldCheck size={20} />

        <div>
          <strong>Account Security</strong>
          <p>
            Never share your administrator password. After changing your
            password, log out and sign in again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
