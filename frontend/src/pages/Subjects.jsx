
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  Search,
  RefreshCw,
  AlertCircle,
  BookMarked,
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/subjects.css";

function Subjects() {
  const { departmentId, yearId, semesterId } = useParams();

  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH SUBJECTS
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!semesterId) {
        throw new Error("Semester ID is missing.");
      }

      const response = await API.get(
        `/semesters/${semesterId}/subjects`
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid subjects response from server.");
      }

      setSubjects(response.data);

    } catch (err) {
      console.error("Subjects API Error:", {
        message: err.message,
        status: err.response?.status,
        response: err.response?.data,
        url: err.config?.url,
      });

      setSubjects([]);

      if (err.response) {
        const detail = err.response.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : `Unable to load subjects (${err.response.status}).`
        );
      } else {
        setError(
          err.message || "Unable to connect to the server."
        );
      }

    } finally {
      setLoading(false);
    }
  }, [semesterId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // SEARCH FILTER
  const filteredSubjects = subjects.filter((subject) => {
    const search = searchTerm.toLowerCase();

    return (
      (subject.name || "").toLowerCase().includes(search) ||
      (subject.code || "").toLowerCase().includes(search) ||
      (subject.description || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="subjects-page">

      {/* SHARED STUDENT NAVBAR */}
      <StudentNavbar />

      {/* HERO */}
      <header className="subjects-hero">
        <span>ACADEMIC RESOURCES</span>

        <h1>Explore Subjects</h1>

        <p>
          Find your subject and access its study materials.
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="subjects-content">

        <div className="subjects-heading">
          <div>
            <h2>Available Subjects</h2>

            <p>
              {subjects.length} subject
              {subjects.length !== 1 ? "s" : ""} available
            </p>
          </div>

          <BookMarked size={30} />
        </div>

        {/* SEARCH */}
        <div className="subjects-search">
          <Search size={20} />

          <input
            type="text"
            placeholder="Search by subject name, code or description..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="subjects-status">
            <RefreshCw className="subjects-spinner" size={22} />
            <p>Loading subjects...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="subjects-status subjects-error">
            <AlertCircle size={25} />

            <p>{error}</p>

            <button onClick={fetchSubjects}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && subjects.length === 0 && (
          <div className="subjects-status">
            <BookOpen size={32} />

            <h3>No Subjects Found</h3>

            <p>
              No subjects have been added to this semester yet.
            </p>

            <Link
              to={`/departments/${departmentId}/years/${yearId}/semesters`}
              className="subject-action"
            >
              Back to Semesters
            </Link>
          </div>
        )}

        {/* NO SEARCH RESULTS */}
        {!loading &&
          !error &&
          subjects.length > 0 &&
          filteredSubjects.length === 0 && (
            <div className="subjects-status">
              <Search size={30} />

              <h3>No Matching Subjects</h3>

              <p>
                Try searching with another name or subject code.
              </p>
            </div>
          )}

        {/* SUBJECT CARDS */}
        {!loading && !error && filteredSubjects.length > 0 && (
          <div className="subjects-grid">

            {filteredSubjects.map((subject) => (
              <Link
                to={`/departments/${departmentId}/years/${yearId}/semesters/${semesterId}/subjects/${subject.id}/materials`}
                className="subject-card"
                key={subject.id}
              >
                <div className="subject-card-top">

                  <div className="subject-icon">
                    <BookOpen size={27} />
                  </div>

                  <span className="subject-code">
                    {subject.code}
                  </span>

                </div>

                <h3>{subject.name}</h3>

                <p className="subject-description">
                  {subject.description ||
                    "Explore study materials and PDF resources for this subject."}
                </p>

                <div className="subject-action">
                  View Materials
                  <ArrowRight size={17} />
                </div>

              </Link>
            ))}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="subjects-footer">
        NIE PDF HUB · Academic Resources
      </footer>

    </div>
  );
}

export default Subjects;
