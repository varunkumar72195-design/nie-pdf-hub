
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  BookOpen,
  X,
  RefreshCw,
  GraduationCap,
  CalendarDays,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";

import API from "../services/api";
import "../styles/subject-management.css";

function SubjectManagement() {
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [departmentId, setDepartmentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load departments and academic years
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setInitialLoading(true);
    setError("");

    try {
      const [departmentResponse, yearResponse] = await Promise.all([
        API.get("/departments/"),
        API.get("/academic-years", { requiresAuth: true }),
      ]);

      const departmentData = departmentResponse.data || [];
      const yearData = yearResponse.data || [];

      setDepartments(departmentData);
      setAcademicYears(yearData);

      if (departmentData.length > 0) {
        setDepartmentId(String(departmentData[0].id));
      }
    } catch (err) {
      console.error("Initial subject data error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load departments and academic years."
      );
    } finally {
      setInitialLoading(false);
    }
  };

  // Load academic years when department changes
  const filteredYears = useMemo(() => {
    if (!departmentId) return [];

    return academicYears.filter(
      (year) => String(year.department_id) === String(departmentId)
    );
  }, [academicYears, departmentId]);

  useEffect(() => {
    setAcademicYearId("");
    setSemesterId("");
    setSemesters([]);
    setSubjects([]);
    setSearch("");

    if (!departmentId || filteredYears.length === 0) return;

    setAcademicYearId(String(filteredYears[0].id));
  }, [departmentId, filteredYears]);

  // Load semesters when academic year changes
  useEffect(() => {
    setSemesterId("");
    setSemesters([]);
    setSubjects([]);

    if (!academicYearId) return;

    loadSemesters(academicYearId);
  }, [academicYearId]);

  const loadSemesters = async (yearId) => {
    setLoading(true);

    try {
      const response = await API.get(
        `/academic-years/${yearId}/semesters`
      );

      const data = response.data || [];
      setSemesters(data);

      if (data.length > 0) {
        setSemesterId(String(data[0].id));
      }
    } catch (err) {
      console.error("Semester loading error:", err);
      setError(
        err.response?.data?.detail || "Unable to load semesters."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load subjects when semester changes
  useEffect(() => {
    setSubjects([]);
    setSearch("");

    if (!semesterId) return;

    loadSubjects(semesterId);
  }, [semesterId]);

  const loadSubjects = async (selectedSemesterId) => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get(
        `/semesters/${selectedSemesterId}/subjects`
      );

      setSubjects(response.data || []);
    } catch (err) {
      console.error("Subject loading error:", err);
      setError(
        err.response?.data?.detail || "Unable to load subjects."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      description: "",
    });

    setEditingId(null);
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingId(subject.id);

    setForm({
      name: subject.name || "",
      code: subject.code || "",
      description: subject.description || "",
    });

    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Add or update subject
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!semesterId) {
      setError("Please select a semester.");
      return;
    }

    if (!form.name.trim() || !form.code.trim()) {
      setError("Subject name and code are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim() || null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await API.put(
          `/subjects/${editingId}`,
          payload,
          { requiresAuth: true }
        );

        setMessage("Subject updated successfully.");
      } else {
        await API.post(
          "/subjects",
          {
            semester_id: Number(semesterId),
            ...payload,
          },
          { requiresAuth: true }
        );

        setMessage("Subject added successfully.");
      }

      setModalOpen(false);
      resetForm();

      await loadSubjects(semesterId);
    } catch (err) {
      console.error("Subject save error:", err);

      setError(
        err.response?.data?.detail || "Unable to save subject."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete subject
  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await API.delete(`/subjects/${subject.id}`, {
        requiresAuth: true,
      });

      setMessage("Subject deleted successfully.");
      await loadSubjects(semesterId);
    } catch (err) {
      console.error("Subject deletion error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to delete subject."
      );
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const searchText = search.toLowerCase();

    return (
      subject.name?.toLowerCase().includes(searchText) ||
      subject.code?.toLowerCase().includes(searchText) ||
      subject.description?.toLowerCase().includes(searchText)
    );
  });

  const selectedDepartment = departments.find(
    (item) => String(item.id) === String(departmentId)
  );

  const selectedYear = academicYears.find(
    (item) => String(item.id) === String(academicYearId)
  );

  const selectedSemester = semesters.find(
    (item) => String(item.id) === String(semesterId)
  );

  if (initialLoading) {
    return (
      <div className="subject-loading">
        <RefreshCw className="subject-spinner" size={23} />
        <span>Loading subject management...</span>
      </div>
    );
  }

  return (
    <div className="subject-management-page">
      {/* PAGE HEADER */}
      <div className="subject-page-header">
        <div>
          <span className="subject-eyebrow">ACADEMIC MANAGEMENT</span>
          <h1>Subject Management</h1>
          <p>
            Create, update and organize subjects for each semester.
          </p>
        </div>

        <button
          className="subject-add-button"
          onClick={openAddModal}
          disabled={!semesterId}
        >
          <Plus size={19} />
          Add Subject
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {message && (
        <div className="subject-alert success">
          {message}
          <button onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="subject-alert error">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* FILTER SECTION */}
      <section className="subject-filter-card">
        <div className="subject-filter-heading">
          <div>
            <h2>Choose Academic Structure</h2>
            <p>Select a department, academic year and semester.</p>
          </div>
        </div>

        <div className="subject-filter-grid">
          <div className="subject-filter-field">
            <label>
              <GraduationCap size={16} />
              Department
            </label>

            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
            >
              <option value="">Select Department</option>

              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="subject-filter-field">
            <label>
              <CalendarDays size={16} />
              Academic Year
            </label>

            <select
              value={academicYearId}
              onChange={(event) =>
                setAcademicYearId(event.target.value)
              }
              disabled={!departmentId || filteredYears.length === 0}
            >
              <option value="">Select Academic Year</option>

              {filteredYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name || `Year ${year.year_number}`}
                </option>
              ))}
            </select>
          </div>

          <div className="subject-filter-field">
            <label>
              <CalendarCheck size={16} />
              Semester
            </label>

            <select
              value={semesterId}
              onChange={(event) => setSemesterId(event.target.value)}
              disabled={!academicYearId || semesters.length === 0}
            >
              <option value="">Select Semester</option>

              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="subject-selection-summary">
          <span>{selectedDepartment?.name || "No department selected"}</span>
          <span>›</span>
          <span>{selectedYear?.name || "No year selected"}</span>
          <span>›</span>
          <span>{selectedSemester?.name || "No semester selected"}</span>
        </div>
      </section>

      {/* SUBJECT LIST */}
      <section className="subject-list-card">
        <div className="subject-list-header">
          <div>
            <h2>Subjects</h2>
            <p>
              {subjects.length} subject(s) in the selected semester
            </p>
          </div>

          <div className="subject-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={!semesterId}
            />
          </div>
        </div>

        {loading ? (
          <div className="subject-empty-state">
            <RefreshCw className="subject-spinner" size={22} />
            <p>Loading subjects...</p>
          </div>
        ) : !semesterId ? (
          <div className="subject-empty-state">
            <BookOpen size={38} />
            <h3>No semester selected</h3>
            <p>
              Select a department, academic year and semester first.
            </p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="subject-empty-state">
            <BookOpen size={38} />
            <h3>No subjects found</h3>
            <p>
              {search
                ? "Try another search term."
                : "Add the first subject for this semester."}
            </p>
          </div>
        ) : (
          <div className="subject-table-wrapper">
            <table className="subject-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Subject Code</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td>
                      <div className="subject-name-cell">
                        <div className="subject-row-icon">
                          <BookOpen size={18} />
                        </div>

                        <div>
                          <strong>{subject.name}</strong>
                          <span>ID: {subject.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="subject-code">
                        {subject.code}
                      </span>
                    </td>

                    <td className="subject-description-cell">
                      {subject.description || "—"}
                    </td>

                    <td>
                      <div className="subject-actions">
                        <button
                          className="subject-edit-button"
                          onClick={() => openEditModal(subject)}
                          title="Edit subject"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="subject-delete-button"
                          onClick={() => handleDelete(subject)}
                          title="Delete subject"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="subject-list-footer">
          Showing {filteredSubjects.length} of {subjects.length} subjects
        </div>
      </section>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div
          className="subject-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="subject-modal">
            <div className="subject-modal-header">
              <div>
                <span>SUBJECT DETAILS</span>
                <h2>{editingId ? "Edit Subject" : "Add New Subject"}</h2>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            {error && (
              <div className="subject-alert error">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="subject-modal-context">
                <strong>Selected Semester</strong>
                <span>
                  {selectedDepartment?.name} / {selectedYear?.name} /{" "}
                  {selectedSemester?.name}
                </span>
              </div>

              <div className="subject-form-field">
                <label htmlFor="subject-name">Subject Name *</label>

                <input
                  id="subject-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Example: Data Structures"
                  maxLength={150}
                  required
                />
              </div>

              <div className="subject-form-field">
                <label htmlFor="subject-code">Subject Code *</label>

                <input
                  id="subject-code"
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleInputChange}
                  placeholder="Example: CS301"
                  maxLength={50}
                  required
                />
              </div>

              <div className="subject-form-field">
                <label htmlFor="subject-description">
                  Description (Optional)
                </label>

                <textarea
                  id="subject-description"
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Enter subject description..."
                  rows={4}
                />
              </div>

              <div className="subject-modal-actions">
                <button
                  type="button"
                  className="subject-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="subject-submit-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="subject-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingId ? "Save Changes" : "Create Subject"}
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

export default SubjectManagement;
