
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  RefreshCw,
  Search
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/departments.css";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // FETCH DEPARTMENTS
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/departments/");

      setDepartments(response.data);
    } catch (err) {
      console.error("Department API error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load departments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // SEARCH DEPARTMENTS
  const filteredDepartments = departments.filter((department) =>
    `${department.name} ${department.code}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="departments-page">

      {/* SHARED STUDENT NAVBAR */}
      <StudentNavbar />

      {/* PAGE HERO */}
      <header className="dept-hero">
        <span>ACADEMIC RESOURCES</span>

        <h1>Explore Departments</h1>

        <p>
          Choose your department and discover organized academic
          resources for your learning journey.
        </p>
      </header>

      {/* DEPARTMENT CONTENT */}
      <main className="dept-content">

        {/* TOOLBAR */}
        <div className="dept-toolbar">
          <div>
            <h2>All Departments</h2>

            <p>
              {departments.length} departments available
            </p>
          </div>

          <div className="dept-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="dept-status">
            Loading departments...
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="dept-error">
            <p>{error}</p>

            <button onClick={fetchDepartments}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY RESULTS */}
        {!loading &&
          !error &&
          filteredDepartments.length === 0 && (
            <div className="dept-status">
              {search
                ? "No matching departments found."
                : "No departments available yet."}
            </div>
          )}

        {/* DEPARTMENT CARDS */}
        {!loading &&
          !error &&
          filteredDepartments.length > 0 && (
            <div className="dept-grid">

              {filteredDepartments.map((department) => (
                <Link
                  to={`/departments/${department.id}/years`}
                  className="dept-card"
                  key={department.id}
                >
                  <div className="dept-card-top">

                    <div className="dept-card-icon">
                      <Building2 size={28} />
                    </div>

                    <span>{department.code}</span>

                  </div>

                  <h3>{department.name}</h3>

                  <p>
                    {department.description ||
                      "Explore academic materials and resources."}
                  </p>

                  <div className="dept-card-action">
                    Explore Resources
                    <ArrowRight size={17} />
                  </div>

                </Link>
              ))}

            </div>
          )}

      </main>

      {/* FOOTER */}
      <footer className="dept-footer">
        <strong>NIE PDF HUB</strong>

        <p>
          Academic resources made accessible for every student.
        </p>
      </footer>

    </div>
  );
}

export default Departments;
