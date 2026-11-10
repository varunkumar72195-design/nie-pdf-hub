
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  FileText,
  RefreshCw,
  Search,
  AlertCircle,
  CalendarDays,
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/materials.css";

function Materials() {
  const {
    departmentId,
    yearId,
    semesterId,
    subjectId,
  } = useParams();

  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH MATERIALS
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!subjectId) {
        throw new Error("Subject ID is missing.");
      }

      const response = await API.get(
        `/subjects/${subjectId}/materials`
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid materials response from server.");
      }

      setMaterials(response.data);

    } catch (err) {
      console.error("Materials API Error:", {
        message: err.message,
        status: err.response?.status,
        response: err.response?.data,
        url: err.config?.url,
      });

      setMaterials([]);

      if (err.response) {
        const detail = err.response.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : `Unable to load materials (${err.response.status}).`
        );
      } else {
        setError(
          err.message || "Unable to connect to the server."
        );
      }

    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // SEARCH FILTER
  const filteredMaterials = materials.filter((material) => {
    const search = searchTerm.toLowerCase();

    return (
      (material.title || "").toLowerCase().includes(search) ||
      (material.description || "").toLowerCase().includes(search) ||
      (material.file_name || "").toLowerCase().includes(search)
    );
  });

  // FILE URL
  const getFileUrl = (path) => {
    if (!path) return "#";

    try {
      return new URL(path, API.defaults.baseURL).href;
    } catch {
      return path;
    }
  };

  // FILE SIZE
  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return "Size unavailable";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // UPLOAD DATE
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="materials-page">

      {/* SHARED STUDENT NAVBAR */}
      <StudentNavbar />

      {/* HERO */}
      <header className="materials-hero">
        <span>STUDY RESOURCES</span>

        <h1>Study Materials</h1>

        <p>
          Access your subject notes, question papers and PDF resources.
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main className="materials-content">

        <div className="materials-heading">
          <div>
            <h2>Available PDF Materials</h2>

            <p>
              {materials.length} resource
              {materials.length !== 1 ? "s" : ""} available
            </p>
          </div>

          <FileText size={31} />
        </div>

        {/* SEARCH */}
        <div className="materials-search">
          <Search size={20} />

          <input
            type="text"
            placeholder="Search materials by title or filename..."
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
          <div className="materials-status">
            <RefreshCw className="materials-spinner" size={22} />
            <p>Loading study materials...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="materials-status materials-error">
            <AlertCircle size={25} />

            <p>{error}</p>

            <button onClick={fetchMaterials}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && materials.length === 0 && (
          <div className="materials-status">
            <BookOpen size={34} />

            <h3>No Materials Available</h3>

            <p>
              Study materials have not been uploaded for this subject yet.
            </p>

            <Link
              to={`/departments/${departmentId}/years/${yearId}/semesters/${semesterId}/subjects`}
              className="material-view-button"
            >
              Back to Subjects
            </Link>
          </div>
        )}

        {/* NO SEARCH RESULTS */}
        {!loading &&
          !error &&
          materials.length > 0 &&
          filteredMaterials.length === 0 && (
            <div className="materials-status">
              <Search size={30} />

              <h3>No Matching Materials</h3>

              <p>Try another search term.</p>
            </div>
          )}

        {/* MATERIAL CARDS */}
        {!loading && !error && filteredMaterials.length > 0 && (
          <div className="materials-grid">

            {filteredMaterials.map((material) => (
              <article className="material-card" key={material.id}>

                <div className="material-card-top">
                  <div className="material-file-icon">
                    <FileText size={29} />
                  </div>

                  <span className="material-pdf-label">
                    PDF
                  </span>
                </div>

                <h3>{material.title}</h3>

                <p className="material-description">
                  {material.description ||
                    "PDF study material for this subject."}
                </p>

                <div className="material-details">

                  <span>
                    <FileText size={15} />
                    {formatFileSize(material.file_size)}
                  </span>

                  <span>
                    <CalendarDays size={15} />
                    {formatDate(material.uploaded_at)}
                  </span>

                </div>

                {material.file_name && (
                  <p className="material-filename">
                    {material.file_name}
                  </p>
                )}

                {/* PDF ACTIONS */}
                <div className="material-actions">

                  <Link
                    to={`/departments/${departmentId}/years/${yearId}/semesters/${semesterId}/subjects/${subjectId}/materials/${material.id}`}
                    className="material-view-button"
                  >
                    View PDF
                    <ArrowRight size={16} />
                  </Link>

                  <a
                    href={getFileUrl(material.download_url)}
                    className="material-download-button"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => {
                      if (!material.download_url) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <ArrowDownToLine size={18} />
                    Download
                  </a>

                </div>

              </article>
            ))}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="materials-footer">
        NIE PDF HUB · Academic Resources
      </footer>

    </div>
  );
}

export default Materials;
