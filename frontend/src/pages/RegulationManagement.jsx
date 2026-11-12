
import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  BookMarked,
  X,
  RefreshCw,
  Building2,
} from "lucide-react";

import API from "../services/api";
import "../styles/regulation-management.css";

function RegulationManagement() {
  const [departments, setDepartments] = useState([]);
  const [regulations, setRegulations] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    department_id: "",
    name: "",
    code: "",
    description: "",
  });

  // HANDLE AUTHENTICATION ERRORS
  const handleAuthError = (err) => {
    if (
      err.response?.status === 401 ||
      err.response?.status === 403
    ) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("token_type");
      sessionStorage.removeItem("expires_in");

      setError("Authentication failed. Please login again.");
      return true;
    }

    return false;
  };

  // FETCH DEPARTMENTS AND REGULATIONS
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [departmentResponse, regulationResponse] =
        await Promise.all([
          API.get("/departments/"),
          API.get("/admin/regulations/", {
            requiresAuth: true,
          }),
        ]);

      setDepartments(departmentResponse.data);
      setRegulations(regulationResponse.data);

    } catch (err) {
      console.error("Regulation fetch error:", err);

      if (!handleAuthError(err)) {
        setError(
          err.response?.data?.detail ||
          "Unable to load regulations."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // RESET FORM
  const resetForm = () => {
    setFormData({
      department_id: "",
      name: "",
      code: "",
      description: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // HANDLE FORM INPUTS
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // OPEN CREATE FORM
  const handleCreate = () => {
    resetForm();
    setMessage("");
    setError("");
    setShowForm(true);
  };

  // OPEN EDIT FORM
  const handleEdit = (regulation) => {
    setFormData({
      department_id: String(regulation.department_id),
      name: regulation.name,
      code: regulation.code,
      description: regulation.description || "",
    });

    setEditingId(regulation.id);
    setShowForm(true);

    setMessage("");
    setError("");
  };

  // CREATE OR UPDATE REGULATION
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
      };

      if (editingId) {
        await API.put(
          `/admin/regulations/${editingId}`,
          payload,
          {
            requiresAuth: true,
          }
        );

        setMessage("Regulation updated successfully.");

      } else {
        await API.post(
          "/admin/regulations/",
          {
            department_id: Number(formData.department_id),
            ...payload,
          },
          {
            requiresAuth: true,
          }
        );

        setMessage("Regulation created successfully.");
      }

      resetForm();
      await fetchData();

    } catch (err) {
      console.error("Regulation save error:", err);

      if (!handleAuthError(err)) {
        setError(
          err.response?.data?.detail ||
          "Unable to save regulation."
        );
      }

    } finally {
      setSaving(false);
    }
  };

  // DELETE REGULATION
  const handleDelete = async (regulation) => {
    const departmentName =
      departments.find(
        (department) =>
          department.id === regulation.department_id
      )?.name || "this department";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${regulation.name} (${regulation.code}) from ${departmentName}?\n\nRegulations containing academic years cannot be deleted.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await API.delete(
        `/admin/regulations/${regulation.id}`,
        {
          requiresAuth: true,
        }
      );

      setMessage("Regulation deleted successfully.");

      await fetchData();

    } catch (err) {
      console.error("Regulation delete error:", err);

      if (!handleAuthError(err)) {
        setError(
          err.response?.data?.detail ||
          "Unable to delete regulation."
        );
      }
    }
  };

  // DEPARTMENT NAME
  const getDepartmentName = (departmentId) => {
    const department = departments.find(
      (item) => item.id === departmentId
    );

    return department
      ? `${department.name} (${department.code})`
      : "Unknown Department";
  };

  // FILTER REGULATIONS
  const filteredRegulations = regulations.filter((regulation) => {
    const departmentName = getDepartmentName(
      regulation.department_id
    );

    const matchesSearch = (
      `${regulation.name} ${regulation.code} ${regulation.description || ""} ${departmentName}`
    )
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "all" ||
      String(regulation.department_id) === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="regulation-management-page">

      <main className="regulation-management-container">

        {/* PAGE HEADING */}
        <section className="regulation-page-heading">

          <div>
            <p className="regulation-eyebrow">
              ADMINISTRATION
            </p>

            <h1>Regulations</h1>

            <p>
              Manage academic regulations for all departments.
            </p>
          </div>

          <button
            className="add-regulation-button"
            onClick={handleCreate}
          >
            <Plus size={19} />
            Add Regulation
          </button>

        </section>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="regulation-success">
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="regulation-error">
            {error}
          </div>
        )}

        {/* REGULATION FORM */}
        {showForm && (
          <section className="regulation-form-card">

            <div className="regulation-form-heading">

              <div>
                <h2>
                  {editingId
                    ? "Update Regulation"
                    : "Create Regulation"}
                </h2>

                <p>
                  Enter the academic regulation details.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close form"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="regulation-form-grid">

                {/* DEPARTMENT */}
                <div className="regulation-field">

                  <label>Department *</label>

                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    required
                    disabled={Boolean(editingId)}
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name} ({department.code})
                      </option>
                    ))}

                  </select>

                  {editingId && (
                    <small>
                      Department cannot be changed while editing.
                    </small>
                  )}

                </div>

                {/* REGULATION NAME */}
                <div className="regulation-field">

                  <label>Regulation Name *</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Example: R26 Regulation"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={50}
                    required
                  />

                </div>

                {/* REGULATION CODE */}
                <div className="regulation-field">

                  <label>Regulation Code *</label>

                  <input
                    type="text"
                    name="code"
                    placeholder="Example: R26"
                    value={formData.code}
                    onChange={handleChange}
                    maxLength={20}
                    required
                  />

                </div>

                {/* DESCRIPTION */}
                <div className="regulation-field full-width">

                  <label>Description</label>

                  <textarea
                    name="description"
                    placeholder="Enter regulation description..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />

                </div>

              </div>

              {/* FORM ACTIONS */}
              <div className="regulation-form-actions">

                <button
                  type="button"
                  className="cancel-regulation-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-regulation-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Regulation"
                    : "Create Regulation"}
                </button>

              </div>

            </form>

          </section>
        )}

        {/* REGULATION LIST */}
        <section className="regulation-list-card">

          <div className="regulation-list-heading">

            <div>
              <h2>All Regulations</h2>

              <p>
                {regulations.length} regulations registered
              </p>
            </div>

            <button
              className="refresh-regulations"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

          </div>

          {/* FILTERS */}
          <div className="regulation-filters">

            <div className="regulation-search">

              <Search size={19} />

              <input
                type="text"
                placeholder="Search regulation name, code or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

            </div>

            <div className="regulation-department-filter">

              <Building2 size={18} />

              <select
                value={selectedDepartment}
                onChange={(e) =>
                  setSelectedDepartment(e.target.value)
                }
              >
                <option value="all">
                  All Departments
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.code}
                  </option>
                ))}

              </select>

            </div>

          </div>

          {/* LOADING */}
          {loading ? (

            <div className="regulation-empty">
              <RefreshCw size={22} />
              <p>Loading regulations...</p>
            </div>

          ) : filteredRegulations.length === 0 ? (

            <div className="regulation-empty">
              <BookMarked size={30} />

              <h3>No Regulations Found</h3>

              <p>
                {search || selectedDepartment !== "all"
                  ? "Try changing your search or department filter."
                  : "Create your first academic regulation."}
              </p>
            </div>

          ) : (

            <div className="regulation-management-grid">

              {filteredRegulations.map((regulation) => (

                <article
                  className="regulation-management-card"
                  key={regulation.id}
                >

                  <div className="regulation-card-top">

                    <div className="regulation-card-icon">
                      <BookMarked size={25} />
                    </div>

                    <span className="regulation-code">
                      {regulation.code}
                    </span>

                  </div>

                  <h3>{regulation.name}</h3>

                  <div className="regulation-department-name">
                    <Building2 size={16} />

                    <span>
                      {getDepartmentName(regulation.department_id)}
                    </span>
                  </div>

                  <p className="regulation-description">
                    {regulation.description ||
                      "No description available."}
                  </p>

                  <div className="regulation-card-actions">

                    <button
                      className="edit-regulation-button"
                      onClick={() => handleEdit(regulation)}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      className="delete-regulation-button"
                      onClick={() => handleDelete(regulation)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default RegulationManagement;
