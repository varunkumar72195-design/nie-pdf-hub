
import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";

import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  CalendarCheck,
  BookOpen,
  BookMarked,
  FileUp,
  Settings,
  House,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import API from "../services/api";
import "../styles/admin-layout.css";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // ADMIN NAVIGATION ITEMS
  const navItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Departments",
      path: "/admin/departments",
      icon: Building2,
    },
    {
      label: "Regulations",
      path: "/admin/regulations",
      icon: BookMarked,
    },
    {
      label: "Academic Years",
      path: "/admin/academic-years",
      icon: CalendarDays,
    },
    {
      label: "Semesters",
      path: "/admin/semesters",
      icon: CalendarCheck,
    },
    {
      label: "Subjects",
      path: "/admin/subjects",
      icon: BookOpen,
    },
    {
      label: "PDF Uploads",
      path: "/admin/materials",
      icon: FileUp,
    },
  ];

  const pageItems = [
    ...navItems,
    {
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  // CURRENT PAGE
  const currentPage =
    pageItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`)
    )?.label || "Admin Workspace";

  // ADMIN AUTHENTICATION
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
      navigate("/manage-portal", { replace: true });
      return;
    }

    API.get("/admin/me", { requiresAuth: true })
      .then((response) => {
        setAdmin(response.data);
      })
      .catch((error) => {
        console.error("Admin profile error:", error);

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          sessionStorage.removeItem("access_token");
          navigate("/manage-portal", { replace: true });
        }
      });
  }, [navigate]);

  // UPDATE DATE PERIODICALLY
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    navigate("/manage-portal", { replace: true });
  };

  // CLOSE SIDEBAR
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // FORMATTED DATE
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(currentDate);

  return (
    <div className="admin-shell">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <button
          className="admin-mobile-overlay"
          onClick={closeSidebar}
          aria-label="Close navigation"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}
      >

        {/* BRAND */}
        <div className="admin-brand">

          <div className="admin-brand-logo">
            <img
              src="/nie-logo.png"
              alt="Newton's Institute of Engineering"
            />
          </div>

          <div className="admin-brand-text">
            <h2>NIE PDF HUB</h2>
            <span>Administration</span>
          </div>

          <button
            className="admin-mobile-close"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>

        </div>

        {/* MAIN MENU */}
        <div className="admin-nav-label">
          MAIN MENU
        </div>

        <nav className="admin-nav">

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

        </nav>

        {/* PREFERENCES */}
        <div className="admin-nav-label admin-bottom-label">
          PREFERENCES
        </div>

        <nav className="admin-nav">

          {/* SETTINGS */}
          <NavLink
            to="/admin/settings"
            end
            onClick={closeSidebar}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>

          {/* PUBLIC HOME */}
          <a
            href="/"
            className="admin-nav-link"
            onClick={closeSidebar}
          >
            <House size={19} />
            <span>Go to Public Home</span>
          </a>

        </nav>

        {/* ADMIN PROFILE */}
        <div className="admin-sidebar-footer">

          <div className="admin-user-avatar">
            {admin?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div className="admin-user-info">
            <strong>
              {admin?.name || "Admin"}
            </strong>

            <span>
              {admin?.email || "Loading profile..."}
            </span>
          </div>

          {/* LOGOUT */}
          <button
            className="admin-logout-icon"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={19} />
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">

        {/* TOPBAR */}
        <header className="admin-topbar">

          <div className="admin-topbar-left">

            {/* MOBILE MENU */}
            <button
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div className="admin-heading-group">

              {/* BREADCRUMB */}
              <div className="admin-breadcrumb">

                <Link to="/admin/dashboard">
                  <House size={13} />
                  <span>Admin</span>
                </Link>

                <ChevronRight size={14} />

                <span className="admin-breadcrumb-current">
                  {currentPage}
                </span>

              </div>

              {/* PAGE TITLE */}
              <h1 className="admin-topbar-heading">
                {currentPage}
              </h1>

            </div>

          </div>

          <div className="admin-topbar-right">

            {/* CURRENT DATE */}
            <div className="admin-date-display">
              <CalendarDays size={17} />
              <span>{formattedDate}</span>
            </div>

            {/* ADMIN PROFILE */}
            <div className="admin-topbar-profile">

              <div className="admin-topbar-avatar">
                {admin?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="admin-topbar-profile-info">

                <strong>
                  {admin?.name || "Admin"}
                </strong>

                <span>
                  <ShieldCheck size={12} />
                  Administrator
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <div className="admin-page-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}

export default AdminLayout;
