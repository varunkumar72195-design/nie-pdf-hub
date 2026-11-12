
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import StudentNavbar from "../components/StudentNavbar";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Building2,
} from "lucide-react";

import API from "../services/api";
import "../styles/semesters.css";

function Semesters() {
  const { departmentId, yearId } = useParams();

  const [semesters, setSemesters] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [academicYearName, setAcademicYearName] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH DEPARTMENT AND ACADEMIC YEAR DETAILS
  useEffect(() => {
    let active = true;

    const fetchContext = async () => {
      try {
        const [departmentsResponse, yearsResponse] =
          await Promise.all([
            API.get("/departments/"),
            API.get(`/departments/${departmentId}/years`),
          ]);

        if (!active) return;

        const departments = Array.isArray(departmentsResponse.data)
          ? departmentsResponse.data
          : [];

        const years = Array.isArray(yearsResponse.data)
          ? yearsResponse.data
          : [];

        const department = departments.find(
          (item) => String(item.id) === String(departmentId)
        );

        const academicYear = years.find(
          (item) => String(item.id) === String(yearId)
        );

        setDepartmentName(
          department?.name || `Department ${departmentId}`
        );

        setAcademicYearName(
          academicYear?.name ||
          (academicYear?.year_number
            ? `Year ${academicYear.year_number}`
            : `Academic Year ${yearId}`)
        );
      } catch (err) {
        console.error("Academic context error:", err);

        if (active) {
          setDepartmentName(`Department ${departmentId}`);
          setAcademicYearName(`Academic Year ${yearId}`);
        }
      }
    };

    if (departmentId && yearId) {
      fetchContext();
    }

    return () => {
      active = false;
    };
  }, [departmentId, yearId]);

  // FETCH SEMESTERS
  const fetchSemesters = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!yearId) {
        throw new Error("Academic year ID is missing.");
      }

      const response = await API.get(
        `/academic-years/${yearId}/semesters`
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid semesters response.");
      }

      setSemesters(response.data);
    } catch (err) {
      console.error("Semesters API Error:", err);

      setSemesters([]);

      if (err.response) {
        const detail = err.response.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : `Unable to load semesters (${err.response.status}).`
        );
      } else {
        setError(
          err.message || "Unable to connect to the server."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [yearId]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  return (
    <div className="semesters-page">
      <StudentNavbar />

      {/* HERO */}
      <header className="semesters-hero">
        <span>ACADEMIC RESOURCES</span>
        <h1>Select Semester</h1>
        <p>
          Choose your semester to explore subjects and study materials.
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="semesters-content">

        {/* BACK BUTTON */}
        <div className="semester-navigation">
          <Link
            to={`/departments/${departmentId}/years`}
            className="semester-back-button"
          >
            <ArrowLeft size={18} />
            Back to Academic Years
          </Link>
        </div>

        {/* BREADCRUMB */}
        <nav className="semester-breadcrumb" aria-label="Breadcrumb">
          <Link to="/departments">Departments</Link>
          <span>/</span>

          <Link to={`/departments/${departmentId}/years`}>
            Academic Years
          </Link>

          <span>/</span>
          <span className="breadcrumb-current">Semesters</span>
        </nav>

        {/* CURRENT LOCATION */}
        <div className="semester-context">
          <div className="context-item">
            <Building2 size={17} />
            <span>{departmentName || `Department ${departmentId}`}</span>
          </div>

          <div className="context-divider">/</div>

          <div className="context-item">
            <GraduationCap size={18} />
            <span>
              {academicYearName || `Academic Year ${yearId}`}
            </span>
          </div>
        </div>

        {/* PAGE HEADING */}
        <div className="semesters-heading">
          <div>
            <h2>Available Semesters</h2>
            <p>
              {semesters.length > 0
                ? `${semesters.length} semester${semesters.length > 1 ? "s" : ""} available`
                : "Select a semester below."}
            </p>
          </div>

          <Layers size={30} />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="semesters-status">
            <RefreshCw size={22} className="loading-icon" />
            <p>Loading semesters...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="semesters-status error">
            <AlertCircle size={25} />
            <p>{error}</p>

            <button onClick={fetchSemesters}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && semesters.length === 0 && (
          <div className="semesters-status">
            <BookOpen size={32} />

            <h3>No Semesters Found</h3>

            <p>
              No semesters are currently available for this academic year.
            </p>
          </div>
        )}

        {/* SEMESTER CARDS */}
        {!loading && !error && semesters.length > 0 && (
          <div className="semesters-grid">
            {semesters.map((semester) => (
              <Link
                to={`/departments/${departmentId}/years/${yearId}/semesters/${semester.id}/subjects`}
                className="semester-card"
                key={semester.id}
              >
                <div className="semester-icon">
                  <BookOpen size={25} />
                </div>

                <span className="semester-number">
                  SEMESTER {semester.semester_number}
                </span>

                <h3>{semester.name}</h3>

                <p>
                  Explore subjects and study materials.
                </p>

                <div className="semester-action">
                  View Subjects
                  <ArrowRight size={17} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="semesters-footer">
        NIE PDF HUB · Academic Resources
      </footer>
    </div>
  );
}

export default Semesters;
