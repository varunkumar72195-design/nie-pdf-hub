import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  CalendarRange,
  X,
  Save,
} from "lucide-react";

import API from "../services/api";
import "../styles/semester-management.css";

function SemesterManagement() {
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");

  const [semesterNumber, setSemesterNumber] = useState("1");
  const [semesterName, setSemesterName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all academic years for the dropdown
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/academic-years", {
        requiresAuth: true,
      });

      setAcademicYears(response.data || []);

      if (response.data?.length > 0 && !selectedYear) {
        setSelectedYear(String(response.data[0].id));
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load academic years."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch semesters for selected academic year
  const fetchSemesters = async (yearId = selectedYear) => {
    if (!yearId) {
      setSemesters([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        `/academic-years/${yearId}/semesters`
      );

      setSemesters(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load semesters."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchSemesters(selectedYear);
      resetForm();
    } else {
      setSemesters([]);
    }
  }, [selectedYear]);

  const resetForm = () => {
    setEditingId(null);
    setSemesterNumber("1");
    setSemesterName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedYear) {
      setError("Please select an academic year.");
      return;
    }

    if (!semesterName.trim()) {
      setError("Please enter a semester name.");
      return;
    }

    const payload = {
      academic_year_id: Number(selectedYear),
      semester_number: Number(semesterNumber),
      name: semesterName.trim(),
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await API.put(
          `/semesters/${editingId}`,
          {
            semester_number: payload.semester_number,
            name: payload.name,
          },
          { requiresAuth: true }
        );

        setSuccess("Semester updated successfully!");
      } else {
        await API.post("/semesters", payload, {
          requiresAuth: true,
        });

        setSuccess("Semester created successfully!");
      }

      resetForm();
      await fetchSemesters(selectedYear);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to save semester."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (semester) => {
    setEditingId(semester.id);
    setSemesterNumber(String(semester.semester_number));
    setSemesterName(semester.name);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (semester) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${semester.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await API.delete(`/semesters/${semester.id}`, {
        requiresAuth: true,
      });

      setSuccess("Semester deleted successfully!");

      if (editingId === semester.id) {
        resetForm();
      }

      await fetchSemesters(selectedYear);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete semester."
      );
    }
  };

  const filteredSemesters = semesters.filter((semester) =>
    semester.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAcademicYear = academicYears.find(
    (year) => String(year.id) === selectedYear
  );

  return (
    <div className="semester-management-page">
      <div className="semester-management-header">
        <div>
          <span className="semester-management-label">
            ADMINISTRATION
          </span>

          <h1>Semester Management</h1>

          <p>
            Create, update and manage semesters for each academic year.
          </p>
        </div>

        <button
          className="semester-refresh-btn"
          onClick={() => {
            fetchAcademicYears();
            fetchSemesters(selectedYear);
          }}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="semester-alert semester-error">
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="semester-alert semester-success">
          {success}
          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="semester-management-grid">
        {/* Semester Form */}
        <section className="semester-form-card">
          <div className="semester-card-heading">
            <div className="semester-heading-icon">
              {editingId ? <Pencil size={20} /> : <Plus size={20} />}
            </div>

            <div>
              <h2>
                {editingId ? "Edit Semester" : "Add Semester"}
              </h2>
              <p>
                {editingId
                  ? "Update semester information"
                  : "Create a semester under an academic year"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label>Academic Year</label>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              required
              disabled={editingId !== null}
            >
              <option value="">Select Academic Year</option>

              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name || `Year ${year.year_number}`}
                  {" — Department ID: "}
                  {year.department_id}
                </option>
              ))}
            </select>

            <label>Semester Number</label>

            <select
              value={semesterNumber}
              onChange={(e) => setSemesterNumber(e.target.value)}
              required
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>

            <label>Semester Name</label>

            <input
              type="text"
              placeholder="Example: First Semester"
              value={semesterName}
              onChange={(e) => setSemesterName(e.target.value)}
              required
            />

            <div className="semester-form-actions">
              <button
                type="submit"
                className="semester-submit-btn"
                disabled={saving || !selectedYear}
              >
                {saving ? (
                  <RefreshCw size={17} />
                ) : editingId ? (
                  <Save size={17} />
                ) : (
                  <Plus size={17} />
                )}

                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Semester"
                  : "Create Semester"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="semester-cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Semester List */}
        <section className="semester-list-card">
          <div className="semester-list-heading">
            <div>
              <h2>Semesters</h2>
              <p>
                {selectedAcademicYear
                  ? selectedAcademicYear.name ||
                    `Academic Year ${selectedAcademicYear.year_number}`
                  : "Select an academic year"}
              </p>
            </div>

            <span className="semester-count">
              {semesters.length} Total
            </span>
          </div>

          <div className="semester-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search semesters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="semester-empty">
              <RefreshCw className="semester-loading-icon" />
              <p>Loading semesters...</p>
            </div>
          ) : !selectedYear ? (
            <div className="semester-empty">
              <CalendarRange size={35} />
              <p>Please select an academic year.</p>
            </div>
          ) : filteredSemesters.length === 0 ? (
            <div className="semester-empty">
              <CalendarRange size={35} />
              <h3>No Semesters Found</h3>
              <p>Create the first semester using the form.</p>
            </div>
          ) : (
            <div className="semester-items">
              {filteredSemesters.map((semester) => (
                <div
                  className="semester-item"
                  key={semester.id}
                >
                  <div className="semester-item-icon">
                    <CalendarRange size={21} />
                  </div>

                  <div className="semester-item-info">
                    <h3>{semester.name}</h3>
                    <p>
                      Semester {semester.semester_number}
                    </p>
                  </div>

                  <div className="semester-item-actions">
                    <button
                      className="semester-edit-btn"
                      title="Edit semester"
                      onClick={() => handleEdit(semester)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      className="semester-delete-btn"
                      title="Delete semester"
                      onClick={() => handleDelete(semester)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SemesterManagement;