
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  X,
  RefreshCw
} from "lucide-react";

import API from "../services/api";
import "../styles/department-management.css";

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: ""
  });

  // Fetch departments (Public API)
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/departments/");

      setDepartments(response.data);

    } catch (err) {
      console.error("Department fetch error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load departments."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: ""
    });

    setEditingId(null);
    setShowForm(false);
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Edit department
  const handleEdit = (department) => {
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || ""
    });

    setEditingId(department.id);
    setShowForm(true);
    setMessage("");
    setError("");
  };

  // Create or update department
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || null
      };

      if (editingId) {
        // UPDATE - JWT REQUIRED
        await API.put(
          `/departments/${editingId}`,
          payload,
          {
            requiresAuth: true
          }
        );

        setMessage("Department updated successfully.");

      } else {
        // CREATE - JWT REQUIRED
        await API.post(
          "/departments/",
          payload,
          {
            requiresAuth: true
          }
        );

        setMessage("Department created successfully.");
      }

      resetForm();

      await fetchDepartments();

    } catch (err) {
      console.error("Department save error:", err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        setError(
          "Authentication failed. Please login again."
        );

        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("token_type");
        sessionStorage.removeItem("expires_in");

        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to save department."
      );

    } finally {
      setSaving(false);
    }
  };

  // Delete department
  const handleDelete = async (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${department.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      // DELETE - JWT REQUIRED
      await API.delete(
        `/departments/${department.id}`,
        {
          requiresAuth: true
        }
      );

      setMessage("Department deleted successfully.");

      await fetchDepartments();

    } catch (err) {
      console.error("Department delete error:", err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        setError(
          "Authentication failed. Please login again."
        );

        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("token_type");
        sessionStorage.removeItem("expires_in");

        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to delete department."
      );
    }
  };

  // Search departments
  const filteredDepartments = departments.filter(
    (department) =>
      `${department.name} ${department.code}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="department-management-page">

      {/* Header */}
      <header className="department-management-header">

        <Link
          to="/admin/dashboard"
          className="department-back"
        >
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <h2>NIE PDF HUB</h2>

        <span>Department Management</span>

      </header>

      <main className="department-management-container">

        {/* Page Heading */}
        <section className="department-page-heading">

          <div>
            <p className="department-eyebrow">
              ADMINISTRATION
            </p>

            <h1>Departments</h1>

            <p>
              Manage your institution's academic departments.
            </p>
          </div>

          <button
            className="add-department-button"
            onClick={() => {
              resetForm();
              setMessage("");
              setError("");
              setShowForm(true);
            }}
          >
            <Plus size={19} />
            Add Department
          </button>

        </section>

        {/* Success Message */}
        {message && (
          <div className="department-success">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="department-error">
            {error}
          </div>
        )}

        {/* Department Form */}
        {showForm && (
          <section className="department-form-card">

            <div className="department-form-heading">

              <h2>
                {editingId
                  ? "Update Department"
                  : "Create Department"}
              </h2>

              <button
                onClick={resetForm}
                type="button"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="department-form-grid">

                <div className="department-field">

                  <label>Department Name *</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Example: Computer Science"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="department-field">

                  <label>Department Code *</label>

                  <input
                    type="text"
                    name="code"
                    placeholder="Example: CSE"
                    value={formData.code}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="department-field full-width">

                  <label>Description</label>

                  <textarea
                    name="description"
                    placeholder="Enter department description..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />

                </div>

              </div>

              <div className="department-form-actions">

                <button
                  type="button"
                  className="cancel-department-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-department-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Department"
                    : "Create Department"}
                </button>

              </div>

            </form>

          </section>
        )}

        {/* Department List */}
        <section className="department-list-card">

          <div className="department-list-heading">

            <div>
              <h2>All Departments</h2>

              <p>
                {departments.length} departments registered
              </p>
            </div>

            <button
              className="refresh-departments"
              onClick={fetchDepartments}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

          </div>

          {/* Search */}
          <div className="department-search">

            <Search size={19} />

            <input
              type="text"
              placeholder="Search by department name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          {/* Loading */}
          {loading ? (

            <p className="department-empty">
              Loading departments...
            </p>

          ) : filteredDepartments.length === 0 ? (

            <p className="department-empty">
              No departments found.
            </p>

          ) : (

            <div className="department-management-grid">

              {filteredDepartments.map((department) => (

                <article
                  className="department-management-card"
                  key={department.id}
                >

                  <div className="department-card-top">

                    <div className="department-card-icon">
                      <Building2 size={25} />
                    </div>

                    <span className="department-code">
                      {department.code}
                    </span>

                  </div>

                  <h3>{department.name}</h3>

                  <p>
                    {department.description ||
                      "No description available."}
                  </p>

                  <div className="department-card-actions">

                    <button
                      className="edit-department-button"
                      onClick={() => handleEdit(department)}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      className="delete-department-button"
                      onClick={() => handleDelete(department)}
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

export default DepartmentManagement;
