
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  RefreshCw,
  Search,
  AlertCircle,
  CalendarDays,
  Building2,
  GraduationCap,
  Layers,
  BookMarked,
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

  const [departmentName, setDepartmentName] = useState("");
  const [academicYearName, setAcademicYearName] = useState("");
  const [semesterName, setSemesterName] = useState("");
  const [subjectName, setSubjectName] = useState("");

  // FETCH CURRENT LOCATION DETAILS
  useEffect(() => {
    let active = true;

    const fetchContext = async () => {
      try {
        const [
          departmentsResponse,
          yearsResponse,
          semestersResponse,
          subjectsResponse,
        ] = await Promise.all([
          API.get("/departments/"),
          API.get(`/departments/${departmentId}/years`),
          API.get(`/academic-years/${yearId}/semesters`),
          API.get(`/semesters/${semesterId}/subjects`),
        ]);

        if (!active) return;

        const departments = departmentsResponse.data || [];
        const years = yearsResponse.data || [];
        const semesters = semestersResponse.data || [];
        const subjects = subjectsResponse.data || [];

        const department = departments.find(
          (item) => String(item.id) === String(departmentId)
        );

        const year = years.find(
          (item) => String(item.id) === String(yearId)
        );

        const semester = semesters.find(
          (item) => String(item.id) === String(semesterId)
        );

        const subject = subjects.find(
          (item) => String(item.id) === String(subjectId)
        );

        setDepartmentName(
          department?.name || `Department ${departmentId}`
        );

        setAcademicYearName(
          year?.name ||
          (year?.year_number
            ? `Year ${year.year_number}`
            : `Academic Year ${yearId}`)
        );

        setSemesterName(
          semester?.name ||
          (semester?.semester_number
            ? `Semester ${semester.semester_number}`
            : `Semester ${semesterId}`)
        );

        setSubjectName(
          subject?.name || `Subject ${subjectId}`
        );
      } catch (err) {
        console.error("Materials context error:", err);

        if (active) {
          setDepartmentName(`Department ${departmentId}`);
          setAcademicYearName(`Academic Year ${yearId}`);
          setSemesterName(`Semester ${semesterId}`);
          setSubjectName(`Subject ${subjectId}`);
        }
      }
    };

    if (departmentId && yearId && semesterId && subjectId) {
      fetchContext();
    }

    return () => {
      active = false;
    };
  }, [departmentId, yearId, semesterId, subjectId]);

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

        {/* BACK BUTTON */}
        <div className="materials-navigation">
          <Link
            to={`/departments/${departmentId}/years/${yearId}/semesters/${semesterId}/subjects`}
            className="materials-back-button"
          >
            <ArrowLeft size={18} />
            Back to Subjects
          </Link>
        </div>

        {/* BREADCRUMB */}
        <nav className="materials-breadcrumb" aria-label="Breadcrumb">

          <Link to="/departments">Departments</Link>
          <span>/</span>

          <Link to={`/departments/${departmentId}/years`}>
            Academic Years
          </Link>
          <span>/</span>

          <Link
            to={`/departments/${departmentId}/years/${yearId}/semesters`}
          >
            Semesters
          </Link>
          <span>/</span>

          <Link
            to={`/departments/${departmentId}/years/${yearId}/semesters/${semesterId}/subjects`}
          >
            Subjects
          </Link>
          <span>/</span>

          <span className="materials-breadcrumb-current">
            Materials
          </span>

        </nav>

        {/* CURRENT LOCATION */}
        <div className="materials-context">

          <div className="materials-context-item">
            <Building2 size={17} />
            <span>{departmentName || `Department ${departmentId}`}</span>
          </div>

          <div className="materials-context-item">
            <GraduationCap size={18} />
            <span>{academicYearName || `Academic Year ${yearId}`}</span>
          </div>

          <div className="materials-context-item">
            <Layers size={17} />
            <span>{semesterName || `Semester ${semesterId}`}</span>
          </div>

          <div className="materials-context-item">
            <BookMarked size={17} />
            <span>{subjectName || `Subject ${subjectId}`}</span>
          </div>

        </div>

        {/* HEADING */}
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
              <ArrowLeft size={16} />
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
                    <FileText size={27} />
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
