
import { useEffect, useState } from "react";
import {
  Upload,
  Search,
  FileText,
  Eye,
  Download,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  FolderOpen,
  FilePlus2,
  CalendarDays,
  HardDrive,
} from "lucide-react";

import API from "../services/api";
import "../styles/material-management.css";

function MaterialManagement() {
  const [departments, setDepartments] = useState([]);
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [departmentId, setDepartmentId] = useState("");
  const [yearId, setYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null,
  });

  const [selectedFileName, setSelectedFileName] = useState("");

  // --------------------------------------------------
  // ERROR HANDLING
  // --------------------------------------------------

  function getErrorMessage(err, fallback) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;

    if (status === 401 || status === 403) {
      return "Your admin session is invalid or expired. Please log in again.";
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (typeof item === "object" && item !== null) {
            const field = Array.isArray(item.loc)
              ? item.loc.join(" → ")
              : "Field";

            return `${field}: ${item.msg || "Invalid value"}`;
          }

          return String(item);
        })
        .join(" | ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    if (typeof detail === "object" && detail !== null) {
      return JSON.stringify(detail);
    }

    if (status === 422) {
      return "Invalid request data. Please check the submitted fields.";
    }

    if (!err.response) {
      return "Unable to connect to the server. Check whether the backend is running.";
    }

    return fallback;
  }

  // --------------------------------------------------
  // INITIAL DATA
  // --------------------------------------------------

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        fetchDepartments(),
        fetchYears(),
      ]);

      setPageLoading(false);
    };

    initializePage();
  }, []);

  // --------------------------------------------------
  // DEPARTMENT CHANGE
  // --------------------------------------------------

  useEffect(() => {
    if (!departmentId) {
      setYearId("");
      setSemesterId("");
      setSubjectId("");

      setSemesters([]);
      setSubjects([]);
      setMaterials([]);

      return;
    }

    const availableYears = years.filter(
      (year) =>
        String(year.department_id) === String(departmentId)
    );

    const selectedYearExists = availableYears.some(
      (year) => String(year.id) === String(yearId)
    );

    if (yearId && !selectedYearExists) {
      setYearId("");
      setSemesterId("");
      setSubjectId("");

      setSemesters([]);
      setSubjects([]);
      setMaterials([]);
    }
  }, [departmentId, years]);

  // --------------------------------------------------
  // ACADEMIC YEAR CHANGE
  // --------------------------------------------------

  useEffect(() => {
    if (yearId) {
      fetchSemesters(yearId);
    } else {
      setSemesters([]);
      setSemesterId("");
      setSubjects([]);
      setSubjectId("");
      setMaterials([]);
    }
  }, [yearId]);

  // --------------------------------------------------
  // SEMESTER CHANGE
  // --------------------------------------------------

  useEffect(() => {
    if (semesterId) {
      fetchSubjects(semesterId);
    } else {
      setSubjects([]);
      setSubjectId("");
      setMaterials([]);
    }
  }, [semesterId]);

  // --------------------------------------------------
  // SUBJECT CHANGE
  // --------------------------------------------------

  useEffect(() => {
    if (subjectId) {
      fetchMaterials(subjectId);
    } else {
      setMaterials([]);
    }
  }, [subjectId]);

  // --------------------------------------------------
  // FETCH DEPARTMENTS
  // GET /api/departments/
  // --------------------------------------------------

  const fetchDepartments = async () => {
    try {
      const response = await API.get("/departments/");

      setDepartments(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Department loading error:", err.response?.data || err);

      setError(
        getErrorMessage(err, "Unable to load departments.")
      );
    }
  };

  // --------------------------------------------------
  // FETCH ACADEMIC YEARS
  // GET /api/academic-years
  // --------------------------------------------------

  const fetchYears = async () => {
    try {
      const response = await API.get("/academic-years", {
        requiresAuth: true,
      });

      setYears(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Academic year loading error:", err.response?.data || err);

      setError(
        getErrorMessage(err, "Unable to load academic years.")
      );
    }
  };

  // --------------------------------------------------
  // FETCH SEMESTERS
  // GET /api/academic-years/{id}/semesters
  // --------------------------------------------------

  const fetchSemesters = async (id) => {
    try {
      const response = await API.get(
        `/academic-years/${id}/semesters`
      );

      setSemesters(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Semester loading error:", err.response?.data || err);

      setError(
        getErrorMessage(err, "Unable to load semesters.")
      );
    }
  };

  // --------------------------------------------------
  // FETCH SUBJECTS
  // GET /api/semesters/{id}/subjects
  // --------------------------------------------------

  const fetchSubjects = async (id) => {
    try {
      const response = await API.get(
        `/semesters/${id}/subjects`
      );

      setSubjects(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Subject loading error:", err.response?.data || err);

      setError(
        getErrorMessage(err, "Unable to load subjects.")
      );
    }
  };

  // --------------------------------------------------
  // FETCH MATERIALS
  // GET /api/subjects/{id}/materials
  // --------------------------------------------------

  const fetchMaterials = async (id) => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get(
        `/subjects/${id}/materials`
      );

      setMaterials(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Material loading error:", err.response?.data || err);

      setError(
        getErrorMessage(err, "Unable to load PDF materials.")
      );

      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      file: null,
    });

    setSelectedFileName("");
    setEditingMaterial(null);
    setShowForm(false);
  };

  // --------------------------------------------------
  // OPEN UPLOAD FORM
  // --------------------------------------------------

  const openUploadForm = () => {
    setEditingMaterial(null);

    setFormData({
      title: "",
      description: "",
      file: null,
    });

    setSelectedFileName("");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // --------------------------------------------------
  // OPEN EDIT FORM
  // --------------------------------------------------

  const openEditForm = (material) => {
    setEditingMaterial(material);

    setFormData({
      title: material.title || "",
      description: material.description || "",
      file: null,
    });

    setSelectedFileName("");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // --------------------------------------------------
  // FILE VALIDATION
  // --------------------------------------------------

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setFormData((previous) => ({
        ...previous,
        file: null,
      }));

      setSelectedFileName("");
      return;
    }

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("PDF size must not exceed 20 MB.");
      event.target.value = "";
      return;
    }

    setError("");

    setFormData((previous) => ({
      ...previous,
      file,
    }));

    setSelectedFileName(file.name);
  };

  // --------------------------------------------------
  // UPLOAD / UPDATE MATERIAL
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editingMaterial && !subjectId) {
      setError("Please select a subject first.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a PDF title.");
      return;
    }

    if (!editingMaterial && !formData.file) {
      setError("Please choose a PDF file.");
      return;
    }

    const payload = new FormData();

    payload.append("title", formData.title.trim());
    payload.append("description", formData.description);

    if (formData.file) {
      payload.append("file", formData.file);
    }

    if (!editingMaterial) {
      payload.append("subject_id", String(subjectId));
    }

    setLoading(true);

    try {
      if (editingMaterial) {
        await API.put(
          `/materials/${editingMaterial.id}`,
          payload,
          {
            requiresAuth: true,
          }
        );

        setSuccess("PDF material updated successfully.");
      } else {
        await API.post(
          "/materials",
          payload,
          {
            requiresAuth: true,
          }
        );

        setSuccess("PDF uploaded successfully.");
      }

      resetForm();

      await fetchMaterials(subjectId);
    } catch (err) {
      console.error("Material save error:", err.response?.data || err);

      setError(
        getErrorMessage(err, "Unable to save PDF material.")
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // DELETE MATERIAL
  // DELETE /api/materials/{id}
  // --------------------------------------------------

  const handleDelete = async (material) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${material.title}"? This will also delete the stored PDF file.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await API.delete(
        `/materials/${material.id}`,
        {
          requiresAuth: true,
        }
      );

      setSuccess("PDF material deleted successfully.");

      await fetchMaterials(subjectId);
    } catch (err) {
      console.error("Material delete error:", err.response?.data || err);

      setError(
        getErrorMessage(err, "Unable to delete PDF material.")
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // PDF URL
  // --------------------------------------------------

  const getFileUrl = (path) => {
    return new URL(
      path,
      API.defaults.baseURL
    ).toString();
  };

  // --------------------------------------------------
  // VIEW PDF
  // --------------------------------------------------

  const handleView = (material) => {
    window.open(
      getFileUrl(material.view_url),
      "_blank",
      "noopener,noreferrer"
    );
  };

  // --------------------------------------------------
  // DOWNLOAD PDF
  // --------------------------------------------------

  const handleDownload = (material) => {
    const link = document.createElement("a");

    link.href = getFileUrl(material.download_url);
    link.download = material.file_name || "material.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // --------------------------------------------------
  // FORMAT FILE SIZE
  // --------------------------------------------------

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredMaterials = materials.filter((material) => {
    const query = search.toLowerCase();

    return (
      material.title?.toLowerCase().includes(query) ||
      material.file_name?.toLowerCase().includes(query) ||
      material.description?.toLowerCase().includes(query)
    );
  });

  // --------------------------------------------------
  // INITIAL LOADING
  // --------------------------------------------------

  if (pageLoading) {
    return (
      <div className="material-loading">
        <RefreshCw className="spin" size={24} />
        <p>Loading PDF management...</p>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div className="material-management">

      {/* PAGE HEADER */}

      <div className="material-page-header">
        <div>
          <span className="material-eyebrow">
            ADMINISTRATION
          </span>

          <h1>PDF Upload Management</h1>

          <p>
            Upload, organize, update and manage academic PDF materials.
          </p>
        </div>

        <button
          className="material-primary-btn"
          onClick={openUploadForm}
          disabled={!subjectId}
        >
          <Upload size={18} />
          Upload PDF
        </button>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="material-alert material-alert-error">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="material-alert material-alert-success">
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
            aria-label="Close message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ACADEMIC SELECTION */}

      <section className="material-selection-card">

        <div className="material-section-heading">
          <FolderOpen size={20} />

          <div>
            <h2>Select Academic Details</h2>
            <p>Choose where the PDF materials belong.</p>
          </div>
        </div>

        <div className="material-filter-grid">

          {/* DEPARTMENT */}

          <div className="material-field">
            <label>Department</label>

            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setYearId("");
                setSemesterId("");
                setSubjectId("");
              }}
            >
              <option value="">Select department</option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {/* ACADEMIC YEAR */}

          <div className="material-field">
            <label>Academic Year</label>

            <select
              value={yearId}
              onChange={(e) => {
                setYearId(e.target.value);
                setSemesterId("");
                setSubjectId("");
              }}
              disabled={!departmentId}
            >
              <option value="">Select academic year</option>

              {years
                .filter(
                  (year) =>
                    String(year.department_id) ===
                    String(departmentId)
                )
                .map((year) => (
                  <option
                    key={year.id}
                    value={year.id}
                  >
                    {year.name}
                  </option>
                ))}
            </select>
          </div>

          {/* SEMESTER */}

          <div className="material-field">
            <label>Semester</label>

            <select
              value={semesterId}
              onChange={(e) => {
                setSemesterId(e.target.value);
                setSubjectId("");
              }}
              disabled={!yearId}
            >
              <option value="">Select semester</option>

              {semesters.map((semester) => (
                <option
                  key={semester.id}
                  value={semester.id}
                >
                  {semester.name}
                </option>
              ))}
            </select>
          </div>

          {/* SUBJECT */}

          <div className="material-field">
            <label>Subject</label>

            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!semesterId}
            >
              <option value="">Select subject</option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* MATERIAL LIST */}

      <section className="material-list-section">

        <div className="material-list-header">

          <div>
            <h2>Uploaded PDF Materials</h2>

            <p>
              {subjectId
                ? `${materials.length} PDF material(s) found`
                : "Select a subject to view its PDF materials."}
            </p>
          </div>

          <div className="material-search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search PDFs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!subjectId}
            />
          </div>

        </div>

        {!subjectId ? (

          <div className="material-empty-state">
            <FolderOpen size={42} />

            <h3>Select a subject</h3>

            <p>
              Choose a department, year, semester and subject
              to manage PDFs.
            </p>
          </div>

        ) : loading && materials.length === 0 ? (

          <div className="material-empty-state">
            <RefreshCw className="spin" size={28} />
            <p>Loading materials...</p>
          </div>

        ) : filteredMaterials.length === 0 ? (

          <div className="material-empty-state">
            <FilePlus2 size={42} />

            <h3>No PDF materials found</h3>

            <p>
              {search
                ? "Try another search term."
                : "Upload the first PDF for this subject."}
            </p>

            {!search && (
              <button
                className="material-primary-btn"
                onClick={openUploadForm}
              >
                <Upload size={17} />
                Upload PDF
              </button>
            )}
          </div>

        ) : (

          <div className="material-table-wrapper">

            <table className="material-table">

              <thead>
                <tr>
                  <th>PDF Material</th>
                  <th>File Size</th>
                  <th>Uploaded Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredMaterials.map((material) => (

                  <tr key={material.id}>

                    <td>
                      <div className="material-file-cell">

                        <div className="material-pdf-icon">
                          <FileText size={22} />
                        </div>

                        <div>
                          <strong>{material.title}</strong>

                          <span>{material.file_name}</span>

                          {material.description && (
                            <small>{material.description}</small>
                          )}
                        </div>

                      </div>
                    </td>

                    <td>
                      <span className="material-size">
                        <HardDrive size={14} />
                        {formatFileSize(material.file_size)}
                      </span>
                    </td>

                    <td>
                      <span className="material-date">
                        <CalendarDays size={14} />
                        {formatDate(material.uploaded_at)}
                      </span>
                    </td>

                    <td>
                      <div className="material-action-buttons">

                        <button
                          className="material-icon-btn view"
                          title="Preview PDF"
                          onClick={() => handleView(material)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          className="material-icon-btn download"
                          title="Download PDF"
                          onClick={() => handleDownload(material)}
                        >
                          <Download size={17} />
                        </button>

                        <button
                          className="material-icon-btn edit"
                          title="Edit or replace PDF"
                          onClick={() => openEditForm(material)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="material-icon-btn delete"
                          title="Delete PDF"
                          onClick={() => handleDelete(material)}
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

      {/* UPLOAD / EDIT MODAL */}

      {showForm && (

        <div
          className="material-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              resetForm();
            }
          }}
        >

          <div className="material-modal">

            <div className="material-modal-header">

              <div>
                <span className="material-eyebrow">
                  {editingMaterial
                    ? "UPDATE MATERIAL"
                    : "NEW MATERIAL"}
                </span>

                <h2>
                  {editingMaterial
                    ? "Edit PDF Material"
                    : "Upload PDF Material"}
                </h2>
              </div>

              <button
                className="material-close-btn"
                onClick={resetForm}
                aria-label="Close form"
              >
                <X size={21} />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {/* TITLE */}

              <div className="material-field">
                <label>PDF Title *</label>

                <input
                  type="text"
                  placeholder="Enter PDF title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((previous) => ({
                      ...previous,
                      title: e.target.value,
                    }))
                  }
                  maxLength={200}
                  required
                />
              </div>

              {/* DESCRIPTION */}

              <div className="material-field">
                <label>Description</label>

                <textarea
                  placeholder="Enter a short description (optional)"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((previous) => ({
                      ...previous,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {/* PDF FILE */}

              <div className="material-field">

                <label>
                  {editingMaterial
                    ? "Replace PDF (optional)"
                    : "Choose PDF *"}
                </label>

                <label className="material-file-drop">

                  <Upload size={25} />

                  <strong>
                    {selectedFileName ||
                      "Click to choose a PDF"}
                  </strong>

                  <span>
                    PDF only · Maximum size 20 MB
                  </span>

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    required={!editingMaterial}
                  />

                </label>

                {editingMaterial && (
                  <p className="material-current-file">
                    Current file: {editingMaterial.file_name}
                  </p>
                )}

              </div>

              {/* BUTTONS */}

              <div className="material-modal-actions">

                <button
                  type="button"
                  className="material-secondary-btn"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="material-primary-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="spin" size={17} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload size={17} />

                      {editingMaterial
                        ? "Save Changes"
                        : "Upload PDF"}
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

export default MaterialManagement;
