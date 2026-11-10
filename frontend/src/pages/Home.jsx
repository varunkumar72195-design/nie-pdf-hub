
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  BookOpen,
  GraduationCap,
  FileText,
  Download,
  Search,
  ArrowRight,
  ShieldCheck,
  LibraryBig,
  Users,
  Building2,
  CalendarDays,
  RefreshCw,
  Eye,
  LoaderCircle,
  AlertCircle,
  Megaphone,
  Info,
  AlertTriangle,
  CircleAlert
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/home.css";

function formatSize(bytes) {
  if (!bytes) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getMaterialRoute(item) {
  return `/departments/${item.department_id}/years/${item.academic_year_id}/semesters/${item.semester_id}/subjects/${item.subject_id}/materials/${item.id}`;
}

function Home() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [announcement, setAnnouncement] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // FETCH PORTAL OVERVIEW
  const fetchOverview = async () => {
    try {
      setLoading(true);
      setOverviewError("");

      const response = await API.get("/portal/overview");

      setOverview(response.data);
    } catch (error) {
      console.error("Overview error:", error);

      setOverviewError(
        error.response?.data?.detail ||
        "Unable to load portal statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH ACTIVE STUDENT ANNOUNCEMENT
  const fetchAnnouncement = async () => {
    try {
      const response = await API.get("/announcements/active");

      if (response.data?.is_active) {
        setAnnouncement(response.data);
      } else {
        setAnnouncement(null);
      }
    } catch (error) {
      console.error("Announcement error:", error);
      setAnnouncement(null);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchAnnouncement();
  }, []);

  // SEARCH MATERIALS
  const handleSearch = async (event) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) {
      setSearchError(
        "Please enter a subject, department or PDF name."
      );
      setHasSearched(false);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError("");
      setHasSearched(true);
      setSearchResults([]);

      const response = await API.get("/portal/search", {
        params: { q: query }
      });

      setSearchResults(response.data);
    } catch (error) {
      console.error("Search error:", error);

      setSearchError(
        error.response?.data?.detail ||
        "Unable to search resources. Please try again."
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // ANNOUNCEMENT ICON
  const getAnnouncementIcon = () => {
    switch (announcement?.announcement_type) {
      case "warning":
        return <AlertTriangle size={25} />;

      case "important":
        return <CircleAlert size={25} />;

      default:
        return <Info size={25} />;
    }
  };

  // STATISTICS
  const statistics = overview?.statistics || {};

  const statCards = [
    {
      label: "Departments",
      value: statistics.departments,
      icon: Building2,
      color: "blue"
    },
    {
      label: "Subjects",
      value: statistics.subjects,
      icon: BookOpen,
      color: "purple"
    },
    {
      label: "Semesters",
      value: statistics.semesters,
      icon: CalendarDays,
      color: "green"
    },
    {
      label: "PDF Resources",
      value: statistics.materials,
      icon: FileText,
      color: "orange"
    }
  ];

  const recentMaterials = overview?.recent_materials || [];

  return (
    <div className="home-page">

      {/* SHARED STUDENT NAVBAR */}
      <StudentNavbar />

      {/* STUDENT ANNOUNCEMENT BOARD */}
      {announcement && (
  <div className="announcement-marquee">
    <div className="announcement-marquee-track">
      <span>
        {announcement.title}: {announcement.message}
      </span>
      <span aria-hidden="true">
        {announcement.title}: {announcement.message}
      </span>
    </div>
  </div>
)}
      {/* HERO */}
      <section className="home-hero">
        <div className="hero-content">

          <span className="hero-badge">
            <BookOpen size={15} />
            Academic Resource Platform
          </span>

          <h1>
            Your Learning Journey,
            <span> All in One Place.</span>
          </h1>

          <p>
            Access study materials, academic notes and previous resources
            from your department. Learn smarter with NIE PDF HUB.
          </p>

          <div className="hero-actions">
            <Link to="/departments" className="primary-btn">
              Explore Departments <ArrowRight size={18} />
            </Link>

            <a href="#about" className="secondary-btn">
              Learn More
            </a>
          </div>

          <div className="hero-trust">
            <ShieldCheck size={18} />
            Free academic resources for NIE students
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-main-card">

            <div className="hero-card-icon">
              <LibraryBig size={38} />
            </div>

            <h3>Digital Learning Library</h3>

            <p>
              Everything you need for your academic journey.
            </p>

            <div className="hero-card-items">
              <div>
                <FileText size={19} />
                Study Materials
              </div>

              <div>
                <Download size={19} />
                PDF Downloads
              </div>

              <div>
                <GraduationCap size={19} />
                All Departments
              </div>
            </div>
          </div>

          <div className="floating-icon floating-one">
            <BookOpen size={25} />
          </div>

          <div className="floating-icon floating-two">
            <FileText size={25} />
          </div>
        </div>
      </section>

      {/* LIVE STATISTICS */}
      <section className="home-stats-section">
        <div className="stats-heading">
          <span>PORTAL OVERVIEW</span>

          <h2>Your Academic Library at a Glance</h2>

          <p>
            Explore the resources currently available in NIE PDF HUB.
          </p>
        </div>

        {loading ? (
          <div className="home-loading">
            <LoaderCircle className="spin-icon" size={25} />
            Loading portal statistics...
          </div>
        ) : overviewError ? (
          <div className="home-error">
            <AlertCircle size={20} />

            <span>{overviewError}</span>

            <button onClick={fetchOverview}>
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        ) : (
          <div className="home-stats-grid">
            {statCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <div className="home-stat-card" key={stat.label}>
                  <div className={`stat-icon ${stat.color}`}>
                    <Icon size={26} />
                  </div>

                  <div>
                    <h3>{stat.value ?? 0}</h3>
                    <p>{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SEARCH */}
      <section className="home-search-section" id="search">
        <div>
          <h2>Find Your Study Materials</h2>

          <p>
            Search by PDF title, subject, subject code or department.
          </p>
        </div>

        <form
          className="home-search-form"
          onSubmit={handleSearch}
        >
          <Search size={20} />

          <input
            type="search"
            placeholder="Search Python, Java, CSE, DBMS..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <button type="submit" disabled={searchLoading}>
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </section>

      {/* SEARCH RESULTS */}
      {hasSearched && (
        <section className="home-search-results">
          <div className="recent-heading">
            <div>
              <span>SEARCH RESULTS</span>

              <h2>
                Resources matching "{searchTerm.trim()}"
              </h2>
            </div>
          </div>

          {searchLoading ? (
            <div className="home-loading">
              <LoaderCircle className="spin-icon" size={24} />
              Searching resources...
            </div>
          ) : searchError ? (
            <div className="home-error">
              <AlertCircle size={20} />
              {searchError}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="home-empty">
              <Search size={30} />

              <h3>No resources found</h3>

              <p>
                Try another subject, department or PDF name.
              </p>
            </div>
          ) : (
            <div className="recent-material-grid">
              {searchResults.map((item) => (
                <div className="recent-material-card" key={item.id}>
                  <div className="recent-file-icon">
                    <FileText size={25} />
                  </div>

                  <div className="recent-material-info">
                    <h3>{item.title}</h3>

                    <p>
                      {item.subject_name} · {item.department_name}
                    </p>

                    <span>
                      {item.file_name} · {formatSize(item.file_size)}
                    </span>
                  </div>

                  <Link
                    to={getMaterialRoute(item)}
                    className="recent-view-link"
                    aria-label={`View ${item.title}`}
                  >
                    <Eye size={19} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* RECENT UPLOADS */}
      <section className="home-recent-section">
        <div className="recent-heading">
          <div>
            <span>LATEST UPDATES</span>

            <h2>Recently Uploaded Materials</h2>

            <p>
              Explore the latest study resources added to the portal.
            </p>
          </div>

          <Link to="/departments" className="view-all-link">
            View All <ArrowRight size={17} />
          </Link>
        </div>

        {loading ? (
          <div className="home-loading">
            <LoaderCircle className="spin-icon" size={24} />
            Loading recent materials...
          </div>
        ) : overviewError ? (
          <div className="home-empty">
            <AlertCircle size={28} />

            <p>
              Recent uploads are temporarily unavailable.
            </p>
          </div>
        ) : recentMaterials.length === 0 ? (
          <div className="home-empty">
            <FileText size={32} />

            <h3>No PDFs uploaded yet</h3>

            <p>
              New study materials will appear here after upload.
            </p>
          </div>
        ) : (
          <div className="recent-material-grid">
            {recentMaterials.map((item) => (
              <div className="recent-material-card" key={item.id}>
                <div className="recent-file-icon">
                  <FileText size={25} />
                </div>

                <div className="recent-material-info">
                  <h3>{item.title}</h3>

                  <p>
                    {item.subject_name} · {item.department_name}
                  </p>

                  <span>
                    {formatDate(item.uploaded_at)} · {formatSize(item.file_size)}
                  </span>
                </div>

                <Link
                  to={getMaterialRoute(item)}
                  className="recent-view-link"
                  aria-label={`View ${item.title}`}
                >
                  <Eye size={19} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="home-features" id="features">
        <div className="section-heading">
          <span>WHAT WE OFFER</span>

          <h2>Everything for Your Academic Success</h2>

          <p>
            A simple platform to access your academic resources.
          </p>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon blue">
              <GraduationCap size={27} />
            </div>

            <h3>All Departments</h3>

            <p>
              Explore academic resources organized department-wise.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple">
              <FileText size={27} />
            </div>

            <h3>Study Materials</h3>

            <p>
              Find notes and PDF materials organized by subjects.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon green">
              <Download size={27} />
            </div>

            <h3>Easy Downloads</h3>

            <p>
              View and download available academic PDFs easily.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon orange">
              <Users size={27} />
            </div>

            <h3>Student Friendly</h3>

            <p>
              Access resources without creating a student account.
            </p>
          </div>

        </div>
      </section>

      {/* ABOUT */}
      <section className="home-about" id="about">
        <div className="about-icon">
          <LibraryBig size={42} />
        </div>

        <div>
          <span>ABOUT NIE PDF HUB</span>

          <h2>Learning Resources Made Accessible</h2>

          <p>
            NIE PDF HUB is an academic resource platform designed for
            Newton's Institute of Engineering students. It organizes
            learning materials by department, academic year, semester
            and subject, making resources easier to find.
          </p>

          <Link to="/departments">
            Browse Resources <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <Link to="/" className="footer-logo">
          NIE PDF HUB
        </Link>

        <p>
          Empowering students through accessible learning resources.
        </p>

        <span>
          © 2026 NIE PDF HUB. All rights reserved.
        </span>
      </footer>

    </div>
  );
}

export default Home;
