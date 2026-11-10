
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import StudentNavbar from "../components/StudentNavbar";

import {
  ArrowRight,
  BookOpen,
  Layers,
  RefreshCw,
  AlertCircle
} from "lucide-react";

import API from "../services/api";
import "../styles/semesters.css";

function Semesters() {
  const { departmentId, yearId } = useParams();

  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {/* SHARED STUDENT NAVBAR */}
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

        <div className="semesters-heading">
          <div>
            <h2>Available Semesters</h2>
            <p>Select a semester below.</p>
          </div>

          <Layers size={30} />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="semesters-status">
            <RefreshCw size={20} className="loading-icon" />
            <p>Loading semesters...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="semesters-status error">
            <AlertCircle size={24} />

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
            <BookOpen size={30} />

            <h3>No Semesters Found</h3>

            <p>
              No semesters are currently available for this academic year.
            </p>

            <Link
              to={`/departments/${departmentId}/years`}
              className="semester-action"
            >
              Back to Academic Years
            </Link>
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
                  <BookOpen size={30} />
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
