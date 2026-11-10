
import { useParams, Link } from "react-router-dom";

import {
  ArrowLeft,
  Download,
  FileText,
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/pdf-viewer.css";

function PDFViewer() {
  const {
    departmentId,
    yearId,
    semesterId,
    subjectId,
    materialId,
  } = useParams();

  const apiBase = API.defaults.baseURL.replace(/\/+$/, "");

  const viewUrl = `${apiBase}/materials/${materialId}/view`;
  const downloadUrl = `${apiBase}/materials/${materialId}/download`;

  return (
    <div className="pdf-viewer-page">

      {/* SHARED STUDENT NAVBAR */}
      <StudentNavbar />

      {/* PDF TOOLBAR */}
      <header className="pdf-viewer-header">

        <Link
          to={`/departments/${departmentId}/years/${yearId}/semesters/${semesterId}/subjects/${subjectId}/materials`}
          className="pdf-back-link"
        >
          <ArrowLeft size={18} />
          Back to Materials
        </Link>

      </header>

      {/* PDF CONTENT */}
      <main className="pdf-viewer-container">

        {/* DOCUMENT HEADING */}
        <div className="pdf-document-heading">

          <div className="pdf-document-info">
            <FileText size={25} />

            <div>
              <h2>Study Material</h2>
              <p>PDF Document</p>
            </div>
          </div>

          {/* DOWNLOAD */}
          <a
            href={downloadUrl}
            className="pdf-download-button"
          >
            <Download size={18} />
            Download PDF
          </a>

        </div>

        {/* PDF VIEWER */}
        <div className="pdf-frame-container">

          <iframe
            src={viewUrl}
            title="Study Material PDF"
            className="pdf-frame"
          />

        </div>

      </main>

    </div>
  );
}

export default PDFViewer;
