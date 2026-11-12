
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/regulations.css";

function Regulations() {
  const { departmentId } = useParams();

  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRegulations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        `/departments/${departmentId}/regulations/`
      );

      setRegulations(response.data);
    } catch (err) {
      console.error("Regulation API error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load regulations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegulations();
  }, [departmentId]);

  return (
    <div className="regulations-page">
      <StudentNavbar />

      {/* HERO SECTION */}
      <header className="regulations-hero">
        <span>ACADEMIC RESOURCES</span>

        <h1>Select Your Regulation</h1>

        <p>
          Choose your academic regulation to explore the
          corresponding years, semesters, subjects and study materials.
        </p>
      </header>

      <main className="regulations-content">

        {/* BACK TO DEPARTMENTS */}
        <div className="regulations-back-wrapper">
          <Link
            to="/departments"
            className="regulations-back-button"
          >
            <ArrowLeft size={18} />
            Back to Departments
          </Link>
        </div>

        {/* PAGE HEADING */}
        <div className="regulations-heading">
          <div>
            <h2>Available Regulations</h2>
            <p>
              {regulations.length} regulations available
            </p>
          </div>

          <BookOpen size={30} />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="regulations-status">
            Loading regulations...
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="regulations-status error">
            <p>{error}</p>

            <button onClick={fetchRegulations}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && regulations.length === 0 && (
          <div className="regulations-status">
            No regulations available for this department yet.
          </div>
        )}

        {/* REGULATION CARDS */}
        {!loading && !error && regulations.length > 0 && (
          <div className="regulations-grid">
            {regulations.map((regulation) => (
              <Link
                key={regulation.id}
                to={`/departments/${departmentId}/regulations/${regulation.id}/years`}
                className="regulation-card"
              >
                <div className="regulation-card-top">
                  <div className="regulation-icon">
                    <ShieldCheck size={28} />
                  </div>

                  <span className="regulation-code">
                    {regulation.code}
                  </span>
                </div>

                <h3>{regulation.name}</h3>

                <p>
                  {regulation.description ||
                    "Explore academic years under this regulation."}
                </p>

                <div className="regulation-action">
                  Explore Academic Years
                  <ArrowRight size={17} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="regulations-footer">
        <strong>NIE PDF HUB</strong>
        <p>
          Academic resources made accessible for every student.
        </p>
      </footer>
    </div>
  );
}

export default Regulations;
