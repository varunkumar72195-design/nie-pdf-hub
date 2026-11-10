
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ArrowRight
} from "lucide-react";

import "../styles/student-navbar.css";

function StudentNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  const isHome = location.pathname === "/";

  return (
    <header className="student-navbar">
      <div className="student-navbar-container">

        {/* OFFICIAL NIE LOGO */}
        <Link
          to="/"
          className="student-navbar-logo"
          onClick={closeMenu}
        >
          <div className="student-logo-image">
            <img
              src="/nie-logo.png"
              alt="Newton's Institute of Engineering Logo"
            />
          </div>

          <div className="student-logo-text">
            <span>
              NIE <strong>PDF HUB</strong>
            </span>
            <small>Academic Resource Portal</small>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="student-nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/departments">
            Departments
          </NavLink>

          <a
            href="/#features"
            className={!isHome ? "nav-section-link" : ""}
          >
            Features
          </a>

          <a
            href="/#about"
            className={!isHome ? "nav-section-link" : ""}
          >
            About
          </a>
        </nav>

        {/* DESKTOP ACTION */}
        <Link
          to="/departments"
          className="student-nav-cta"
        >
          Explore Resources
          <ArrowRight size={17} />
        </Link>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="student-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <div className="student-mobile-menu">

          <NavLink to="/" end onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/departments" onClick={closeMenu}>
            Departments
          </NavLink>

          <a href="/#features" onClick={closeMenu}>
            Features
          </a>

          <a href="/#about" onClick={closeMenu}>
            About
          </a>

          <Link
            to="/departments"
            className="student-mobile-cta"
            onClick={closeMenu}
          >
            Explore Resources
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </header>
  );
}

export default StudentNavbar;
