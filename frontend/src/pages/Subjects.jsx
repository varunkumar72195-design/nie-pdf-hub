
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Search,
  RefreshCw,
  AlertCircle,
  BookMarked,
  Building2,
  GraduationCap,
  Layers,
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/subjects.css";

function Subjects() {
  const { departmentId, yearId, semesterId } = useParams();

  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [departmentName, setDepartmentName] = useState("");
  const [academicYearName, setAcademicYearName] = useState("");
  const [semesterName, setSemesterName] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH DEPARTMENT, YEAR AND SEMESTER DETAILS
  useEffect(() => {
    let active = true;

    const fetchContext = async () => {
      try {
        const [
          departmentsResponse,
          yearsResponse,
          semestersResponse,
        ] = await Promise.all([
          API.get("/departments/"),
          API.get(`/departments/${departmentId}/years`),
          API.get(`/academic-years/${yearId}/semesters`),
        ]);

        if (!active) return;

        const departments = Array.isArray(departmentsResponse.data)
          ? departmentsResponse.data
          : [];

        const years = Array.isArray(yearsResponse.data)
          ? yearsResponse.data
          : [];

        const semesters = Array.isArray(semestersResponse.data)
          ? semestersResponse.data
          : [];

        const department = departments.find(
          (item) => String(item.id) === String(departmentId)
        );

        const academicYear = years.find(
          (item) => String(item.id) === String(yearId)
        );

        const semester = semesters.find(
          (item) => String(item.id) === String(semesterId)
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

        setSemesterName(
          semester?.name ||
          (semester?.semester_number
            ? `Semester ${semester.semester_number}`
            : `Semester ${semesterId}`)
        );
      } catch (err) {
        console.error("Subject page context error:", err);

        if (active) {
          setDepartmentName(`Department ${departmentId}`);
          setAcademicYearName(`Academic Year ${yearId}`);
          setSemesterName(`Semester ${semesterId}`);
        }
      }
    };

    if (departmentId && yearId && semesterId) {
      fetchContext();
    }

    return () => {
      active = false;
    };
  }, [departmentId, yearId, semesterId]);

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
    const search = searchTerm.toLowerCase().trim();

    return (
      (subject.name || "").toLowerCase().includes(search) ||
      (subject.code || "").toLowerCase().includes(search) ||
      (subject.description || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="subjects-page">
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

        {/* BACK BUTTON */}
        <div className="subjects-navigation">
          <Link
            to={`/departments/${departmentId}/years/${yearId}/semesters`}
            className="subjects-back-button"
          >
            <ArrowLeft size={18} />
            Back to Semesters
          </Link>
        </div>

        {/* BREADCRUMB */}
        <nav className="subjects-breadcrumb" aria-label="Breadcrumb">
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

          <span className="subjects-breadcrumb-current">
            Subjects
          </span>
        </nav>

        {/* CURRENT LOCATION */}
        <div className="subjects-context">
          <div className="subjects-context-item">
            <Building2 size={17} />
            <span>
              {departmentName || `Department ${departmentId}`}
            </span>
          </div>

          <span className="subjects-context-divider">/</span>

          <div className="subjects-context-item">
            <GraduationCap size={18} />
            <span>
              {academicYearName || `Academic Year ${yearId}`}
            </span>
          </div>

          <span className="subjects-context-divider">/</span>

          <div className="subjects-context-item">
            <Layers size={17} />
            <span>
              {semesterName || `Semester ${semesterId}`}
            </span>
          </div>
        </div>

        {/* PAGE HEADING */}
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
                    {subject.code || "SUBJECT"}
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
