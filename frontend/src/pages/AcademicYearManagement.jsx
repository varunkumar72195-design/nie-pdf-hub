
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Building2,
  GraduationCap,
  Layers3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import API from "../services/api";
import "../styles/academic-year-management.css";

function AcademicYearManagement() {
  const [departments, setDepartments] = useState([]);
  const [years, setYears] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState(null);

  const [formData, setFormData] = useState({
    department_id: "",
    year_number: "",
    name: "",
  });

  const getErrorMessage = (err, fallback) => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;

    if (status === 401 || status === 403) {
      return "Admin session expired. Please log in again.";
    }

    if (status === 409) {
      return typeof detail === "string"
        ? detail
        : "This academic year already exists or cannot be deleted.";
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === "object"
            ? `${item.loc?.join(" → ") || "Field"}: ${item.msg}`
            : String(item)
        )
        .join(" | ");
    }

    if (typeof detail === "string") return detail;

    if (!err.response) {
      return "Cannot connect to the backend. Please check your connection.";
    }

    return fallback;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [departmentResponse, yearResponse] = await Promise.all([
        API.get("/departments/"),
        API.get("/academic-years", { requiresAuth: true }),
      ]);

      setDepartments(
        Array.isArray(departmentResponse.data)
          ? departmentResponse.data
          : []
      );

      setYears(
        Array.isArray(yearResponse.data)
          ? yearResponse.data
          : []
      );
    } catch (err) {
      console.error("Academic year fetch error:", err.response?.data || err);
      setError(
        getErrorMessage(err, "Unable to load academic years.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      department_id: "",
      year_number: "",
      name: "",
    });

    setEditingYear(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingYear(null);

    setFormData({
      department_id: "",
      year_number: "",
      name: "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (year) => {
    setEditingYear(year);

    setFormData({
      department_id: String(year.department_id),
      year_number: String(year.year_number),
      name: year.name || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editingYear && !formData.department_id) {
      setError("Please select a department.");
      return;
    }

    const yearNumber = Number(formData.year_number);

    if (!Number.isInteger(yearNumber) || yearNumber < 1) {
      setError("Please enter a valid academic year number.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter an academic year name.");
      return;
    }

    const payload = {
      year_number: yearNumber,
      name: formData.name.trim(),
    };

    if (!editingYear) {
      payload.department_id = Number(formData.department_id);
    }

    setSaving(true);

    try {
      if (editingYear) {
        await API.put(
          `/academic-years/${editingYear.id}`,
          payload,
          { requiresAuth: true }
        );

        setSuccess("Academic year updated successfully.");
      } else {
        await API.post(
          "/academic-years",
          payload,
          { requiresAuth: true }
        );

        setSuccess("Academic year created successfully.");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Academic year save error:", err.response?.data || err);
      setError(
        getErrorMessage(err, "Unable to save academic year.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (year) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${year.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await API.delete(
        `/academic-years/${year.id}`,
        { requiresAuth: true }
      );

      setSuccess("Academic year deleted successfully.");
      await fetchData();
    } catch (err) {
      console.error("Academic year delete error:", err.response?.data || err);
      setError(
        getErrorMessage(
          err,
          "Unable to delete academic year."
        )
      );
    }
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find(
      (item) => String(item.id) === String(departmentId)
    );

    return department?.name || "Unknown department";
  };

  const filteredYears = useMemo(() => {
    const query = search.trim().toLowerCase();

    return years.filter((year) => {
      const departmentName = getDepartmentName(year.department_id);

      const matchesSearch =
        year.name?.toLowerCase().includes(query) ||
        departmentName.toLowerCase().includes(query) ||
        String(year.year_number).includes(query);

      const matchesDepartment =
        filterDepartment === "all" ||
        String(year.department_id) === filterDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [years, departments, search, filterDepartment]);

  return (
    <div className="academic-year-page">
      <div className="academic-year-header">
        <div>
          <span className="academic-year-eyebrow">
            ADMINISTRATION
          </span>

          <h1>Academic Year Management</h1>

          <p>
            Create, organize and manage academic years across departments.
          </p>
        </div>

        <button
          className="ay-primary-btn"
          onClick={openCreateForm}
        >
          <Plus size={18} />
          Add Academic Year
        </button>
      </div>

      {error && (
        <div className="ay-alert ay-alert-error">
          <AlertCircle size={19} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Close error">
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="ay-alert ay-alert-success">
          <CheckCircle2 size={19} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} aria-label="Close message">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="ay-stats-grid">
        <div className="ay-stat-card">
          <div className="ay-stat-icon blue">
            <CalendarDays size={23} />
          </div>
          <div>
            <span>Total Academic Years</span>
            <h2>{years.length}</h2>
          </div>
        </div>

        <div className="ay-stat-card">
          <div className="ay-stat-icon purple">
            <Building2 size={23} />
          </div>
          <div>
            <span>Total Departments</span>
            <h2>{departments.length}</h2>
          </div>
        </div>

        <div className="ay-stat-card">
          <div className="ay-stat-icon green">
            <GraduationCap size={23} />
          </div>
          <div>
            <span>Displayed Academic Years</span>
            <h2>{filteredYears.length}</h2>
          </div>
        </div>
      </div>

      <section className="ay-content-card">
        <div className="ay-content-header">
          <div>
            <h2>Academic Years</h2>
            <p>Manage academic year records for each department.</p>
          </div>

          <button
            className="ay-refresh-btn"
            onClick={fetchData}
            disabled={loading}
            title="Refresh academic years"
          >
            <RefreshCw size={17} className={loading ? "ay-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="ay-toolbar">
          <div className="ay-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search academic years..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="ay-filter"
            value={filterDepartment}
            onChange={(event) => setFilterDepartment(event.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="ay-empty-state">
            <RefreshCw size={28} className="ay-spin" />
            <p>Loading academic years...</p>
          </div>
        ) : filteredYears.length === 0 ? (
          <div className="ay-empty-state">
            <CalendarDays size={42} />
            <h3>No academic years found</h3>
            <p>
              {search || filterDepartment !== "all"
                ? "Try changing your search or department filter."
                : "Add an academic year to get started."}
            </p>
            {!search && filterDepartment === "all" && (
              <button className="ay-primary-btn" onClick={openCreateForm}>
                <Plus size={17} />
                Add Academic Year
              </button>
            )}
          </div>
        ) : (
          <div className="ay-table-wrapper">
            <table className="ay-table">
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th>Year Number</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredYears.map((year) => (
                  <tr key={year.id}>
                    <td>
                      <div className="ay-name-cell">
                        <div className="ay-row-icon">
                          <CalendarDays size={20} />
                        </div>
                        <div>
                          <strong>{year.name}</strong>
                          <span>ID: {year.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="ay-year-badge">
                        Year {year.year_number}
                      </span>
                    </td>

                    <td>{getDepartmentName(year.department_id)}</td>

                    <td>
                      <div className="ay-actions">
                        <button
                          className="ay-icon-btn edit"
                          title="Edit academic year"
                          onClick={() => openEditForm(year)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="ay-icon-btn delete"
                          title="Delete academic year"
                          onClick={() => handleDelete(year)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="ay-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              resetForm();
            }
          }}
        >
          <div className="ay-modal">
            <div className="ay-modal-header">
              <div>
                <span className="academic-year-eyebrow">
                  {editingYear ? "UPDATE RECORD" : "NEW RECORD"}
                </span>

                <h2>
                  {editingYear
                    ? "Edit Academic Year"
                    : "Add Academic Year"}
                </h2>
              </div>

              <button
                className="ay-close-btn"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ay-form-field">
                <label>Department *</label>

                <select
                  value={formData.department_id}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      department_id: event.target.value,
                    }))
                  }
                  disabled={Boolean(editingYear)}
                  required
                >
                  <option value="">Select department</option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>

                {editingYear && (
                  <small>
                    Department cannot be changed while editing.
                  </small>
                )}
              </div>

              <div className="ay-form-field">
                <label>Year Number *</label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Example: 1"
                  value={formData.year_number}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      year_number: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="ay-form-field">
                <label>Academic Year Name *</label>

                <input
                  type="text"
                  maxLength={100}
                  placeholder="Example: 1st Year"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="ay-modal-actions">
                <button
                  type="button"
                  className="ay-secondary-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ay-primary-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="ay-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingYear ? "Save Changes" : "Create Academic Year"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcademicYearManagement;
