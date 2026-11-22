
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowDownToLine,
  ArrowLeft,
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
  Share2,
  Eye,
  Copy,
  Check,
  X,
  LoaderCircle,
} from "lucide-react";

import {
  FaWhatsapp,
  FaTelegramPlane,
  FaFacebookF,
  FaLinkedinIn,
  FaEnvelope,
} from "react-icons/fa";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/materials.css";

function Materials() {
  const { departmentId, yearId, semesterId, subjectId } = useParams();

  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [departmentName, setDepartmentName] = useState("");
  const [academicYearName, setAcademicYearName] = useState("");
  const [semesterName, setSemesterName] = useState("");
  const [subjectName, setSubjectName] = useState("");

  const [activeShareId, setActiveShareId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState("");

  const shareAreaRef = useRef(null);
  const toastTimerRef = useRef(null);

  // CUSTOM TOAST
  const showToast = useCallback((message) => {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast("");
    }, 3000);
  }, []);

  // CLEAN UP TOAST TIMER
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // CLOSE SHARE MENU
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        shareAreaRef.current &&
        !shareAreaRef.current.contains(event.target)
      ) {
        setActiveShareId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActiveShareId(null);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // FETCH LOCATION DETAILS
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

        setSubjectName(subject?.name || `Subject ${subjectId}`);
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
      console.error("Materials API Error:", err);

      setMaterials([]);

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : err.response
            ? `Unable to load materials (${err.response.status}).`
            : err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // SEARCH MATERIALS
  const filteredMaterials = materials.filter((material) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      (material.title || "").toLowerCase().includes(search) ||
      (material.description || "").toLowerCase().includes(search) ||
      (material.file_name || "").toLowerCase().includes(search)
    );
  });

  // PERMANENT PORTAL LINK FOR SHARING
  const getMaterialShareUrl = (material) => {
    return new URL(
      `/departments/${departmentId}/years/${yearId}/semesters/${semesterId}/subjects/${subjectId}/materials/${material.id}`,
      window.location.origin
    ).href;
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

  
const handleDownload = async (material) => {
  if (downloadingId !== null) return;

  let objectUrl = null;

  try {
    setDownloadingId(material.id);
    setActiveShareId(null);

    // 1. Get a fresh Supabase signed URL from FastAPI
    const response = await API.get(
      `/materials/${material.id}/download`
    );

    const downloadUrl =
      typeof response.data === "string"
        ? response.data
        : response.data?.download_url ||
          response.data?.url ||
          response.data?.signed_url;

    if (!downloadUrl) {
      throw new Error("Download URL was not returned by the server.");
    }

    // 2. Request the actual PDF file
    const pdfResponse = await fetch(downloadUrl);

    if (!pdfResponse.ok) {
      throw new Error(
        `PDF download failed with status ${pdfResponse.status}`
      );
    }

    // 3. Convert PDF response into a Blob
    const pdfBlob = await pdfResponse.blob();

    if (!pdfBlob.size) {
      throw new Error("Downloaded PDF is empty.");
    }

    // 4. Create a temporary local download URL
    objectUrl = URL.createObjectURL(pdfBlob);

    const fileName =
      material.file_name ||
      material.title ||
      "study-material.pdf";

    // 5. Trigger download without navigating to another page
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("PDF downloaded successfully!");
  } catch (err) {
    console.error("PDF download error:", err);

    if (
      err instanceof TypeError &&
      err.message.toLowerCase().includes("fetch")
    ) {
      showToast(
        "Unable to access the PDF. Please check Supabase storage CORS settings."
      );
    } else {
      showToast(
        err.message || "Unable to download PDF. Please try again."
      );
    }
  } finally {
    if (objectUrl) {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    }

    setDownloadingId(null);
  }
};


  // COPY SHARE LINK
  const copyMaterialLink = async (material) => {
    const shareUrl = getMaterialShareUrl(material);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const temporaryInput = document.createElement("textarea");

        temporaryInput.value = shareUrl;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";

        document.body.appendChild(temporaryInput);
        temporaryInput.select();

        const copied = document.execCommand("copy");
        document.body.removeChild(temporaryInput);

        if (!copied) {
          throw new Error("Clipboard copy failed.");
        }
      }

      setActiveShareId(null);
      showToast("PDF link copied successfully!");
    } catch (err) {
      console.error("Copy link error:", err);
      showToast("Unable to copy link. Please try again.");
    }
  };

  // SHARE TO SOCIAL APPS
  const shareToApp = (app, material) => {
    const shareUrl = getMaterialShareUrl(material);

    const shareTitle =
      material.title || material.file_name || "Study Material";

    const shareText = `${shareTitle} - ${subjectName || "NIE PDF HUB"}`;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    const shareLinks = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,

      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,

      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,

      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,

      email: `mailto:?subject=${encodeURIComponent(
        shareTitle
      )}&body=${encodedText}%0A%0A${encodedUrl}`,
    };

    const targetUrl = shareLinks[app];

    if (!targetUrl) return;

    setActiveShareId(null);

    if (app === "email") {
      window.location.href = targetUrl;
      return;
    }

    window.open(
      targetUrl,
      "_blank",
      "noopener,noreferrer,width=650,height=550"
    );
  };

  // TOGGLE SHARE MENU
  const toggleShareMenu = (materialId) => {
    setActiveShareId((current) =>
      current === materialId ? null : materialId
    );
  };

  return (
    <div className="materials-page">
      <StudentNavbar />

      {/* CUSTOM TOAST */}
      {toast && (
        <div className="materials-toast" role="status">
          <span className="materials-toast-icon">
            <Check size={17} />
          </span>

          <span>{toast}</span>

          <button
            type="button"
            onClick={() => setToast("")}
            aria-label="Close notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

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
            <span>
              {departmentName || `Department ${departmentId}`}
            </span>
          </div>

          <div className="materials-context-item">
            <GraduationCap size={18} />
            <span>
              {academicYearName || `Academic Year ${yearId}`}
            </span>
          </div>

          <div className="materials-context-item">
            <Layers size={17} />
            <span>
              {semesterName || `Semester ${semesterId}`}
            </span>
          </div>

          <div className="materials-context-item">
            <BookMarked size={17} />
            <span>
              {subjectName || `Subject ${subjectId}`}
            </span>
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

            <button type="button" onClick={fetchMaterials}>
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

                  <span className="material-pdf-label">PDF</span>
                </div>

                <h3>{material.title || "Untitled Material"}</h3>

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
                    <Eye size={17} />
                    View PDF
                  </Link>

                  <button
                    type="button"
                    className="material-download-button"
                    onClick={() => handleDownload(material)}
                    disabled={downloadingId === material.id}
                  >
                    {downloadingId === material.id ? (
                      <>
                        <LoaderCircle
                          size={18}
                          className="materials-spinner"
                        />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine size={18} />
                        Download
                      </>
                    )}
                  </button>

                  {/* SHARE AREA */}
                  <div
                    className="material-share-area"
                    ref={
                      activeShareId === material.id
                        ? shareAreaRef
                        : null
                    }
                  >
                    <button
                      type="button"
                      className={`material-share-button ${
                        activeShareId === material.id ? "active" : ""
                      }`}
                      onClick={() => toggleShareMenu(material.id)}
                      aria-expanded={activeShareId === material.id}
                      aria-label={`Share ${
                        material.title || material.file_name || "PDF"
                      }`}
                      title="Share PDF"
                    >
                      <Share2 size={18} />
                      Share
                    </button>

                    {activeShareId === material.id && (
                      <div className="material-share-menu">
                        <div className="material-share-menu-heading">
                          <span>Share this PDF</span>

                          <button
                            type="button"
                            onClick={() => setActiveShareId(null)}
                            aria-label="Close share menu"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="material-share-options">
                          <button
                            type="button"
                            className="share-option whatsapp"
                            onClick={() =>
                              shareToApp("whatsapp", material)
                            }
                          >
                            <FaWhatsapp />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            className="share-option telegram"
                            onClick={() =>
                              shareToApp("telegram", material)
                            }
                          >
                            <FaTelegramPlane />
                            <span>Telegram</span>
                          </button>

                          <button
                            type="button"
                            className="share-option facebook"
                            onClick={() =>
                              shareToApp("facebook", material)
                            }
                          >
                            <FaFacebookF />
                            <span>Facebook</span>
                          </button>

                          <button
                            type="button"
                            className="share-option linkedin"
                            onClick={() =>
                              shareToApp("linkedin", material)
                            }
                          >
                            <FaLinkedinIn />
                            <span>LinkedIn</span>
                          </button>

                          <button
                            type="button"
                            className="share-option email"
                            onClick={() =>
                              shareToApp("email", material)
                            }
                          >
                            <FaEnvelope />
                            <span>Email</span>
                          </button>

                          <button
                            type="button"
                            className="share-option copy-link"
                            onClick={() =>
                              copyMaterialLink(material)
                            }
                          >
                            <Copy />
                            <span>Copy Link</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
