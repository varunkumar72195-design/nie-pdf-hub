
import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";

import StudentNavbar from "../components/StudentNavbar";

import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  RefreshCw,
  AlertCircle
} from "lucide-react";

import API from "../services/api";
import "../styles/academic-years.css";

function AcademicYears() {
  const { departmentId } = useParams();

  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH ACADEMIC YEARS
  const fetchYears = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!departmentId) {
        throw new Error("Department ID is missing.");
      }

      const requestUrl = `/departments/${departmentId}/years`;

      console.log("ACADEMIC YEARS COMPONENT UPDATED");
      console.log("REQUEST URL:", requestUrl);
      console.log("API BASE URL:", API.defaults.baseURL);

      const response = await API.get(requestUrl);

      console.log("ACADEMIC YEARS RESPONSE:", response.data);

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid academic years response.");
      }

      setYears(response.data);

    } catch (err) {
      console.error("ACADEMIC YEARS ERROR:", {
        message: err.message,
        status: err.response?.status,
        response: err.response?.data,
        url: err.config?.url,
        baseURL: err.config?.baseURL
      });

      setYears([]);

      if (err.response) {
        const detail = err.response.data?.detail;

        if (err.response.status === 401) {
          setError("Unauthorized request. Check API authentication.");
        } else if (err.response.status === 403) {
          setError("Access forbidden.");
        } else if (err.response.status === 404) {
          setError(
            typeof detail === "string"
              ? detail
              : "Department not found."
          );
        } else if (err.response.status >= 500) {
          setError("Server error. Please check your backend.");
        } else {
          setError(
            typeof detail === "string"
              ? detail
              : "Unable to load academic years."
          );
        }
      } else {
        setError(err.message || "Unable to connect to server.");
      }

    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  return (
    <div className="years-page">

      {/* SHARED STUDENT NAVBAR */}
      <StudentNavbar />

      {/* HERO */}
      <header className="years-hero">
        <span>ACADEMIC RESOURCES</span>

        <h1>Select Academic Year</h1>

        <p>
          Choose your academic year to explore semesters
          and study materials.
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="years-content">

        <div className="years-heading">
          <div>
            <h2>Academic Years</h2>
            <p>Select an academic year below.</p>
          </div>

          <CalendarDays size={30} />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="years-status">
            <RefreshCw size={20} />
            <p>Loading academic years...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="years-status error">
            <AlertCircle size={24} />

            <p>{error}</p>

            <button onClick={fetchYears}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && years.length === 0 && (
          <div className="years-status">
            <CalendarDays size={30} />

            <h3>No Academic Years Found</h3>

            <p>
              No academic years are currently available
              for this department.
            </p>

            <Link
              to="/departments"
              className="year-action"
            >
              Back to Departments
            </Link>
          </div>
        )}

        {/* ACADEMIC YEAR CARDS */}
        {!loading && !error && years.length > 0 && (
          <div className="years-grid">

            {years.map((year) => (
              <Link
                to={`/departments/${departmentId}/years/${year.id}/semesters`}
                className="year-card"
                key={year.id}
              >
                <div className="year-icon">
                  <GraduationCap size={30} />
                </div>

                <span className="year-number">
                  YEAR {year.year_number}
                </span>

                <h3>{year.name}</h3>

                <p>
                  Explore semesters and subjects.
                </p>

                <div className="year-action">
                  View Semesters
                  <ArrowRight size={17} />
                </div>
              </Link>
            ))}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="years-footer">
        NIE PDF HUB · Academic Resources
      </footer>

    </div>
  );
}

export default AcademicYears;
