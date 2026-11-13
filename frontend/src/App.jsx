
import {
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

// Analytics
import PageViewTracker from "./components/PageViewTracker";

// Student pages
import Home from "./pages/Home";
import Departments from "./pages/Departments";
import Regulations from "./pages/Regulations";
import AcademicYears from "./pages/academicyears";
import Semesters from "./pages/semesters";
import Subjects from "./pages/Subjects";
import Materials from "./pages/Materials";
import PDFViewer from "./pages/PDFViewer";

// Admin pages
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import DepartmentManagement from "./pages/DepartmentManagement";
import RegulationManagement from "./pages/RegulationManagement";
import AcademicYearManagement from "./pages/AcademicYearManagement";
import SemesterManagement from "./pages/SemesterManagement";
import SubjectManagement from "./pages/SubjectManagement";
import MaterialManagement from "./pages/MaterialManagement";
import AdminSettings from "./pages/AdminSettings";

// REDIRECT OLD ACADEMIC YEAR URL
function LegacyYearsRedirect() {
  const { departmentId } = useParams();

  return (
    <Navigate
      to={`/departments/${departmentId}/regulations`}
      replace
    />
  );
}

function App() {
  return (
    <>
      <PageViewTracker />

      <Routes>
        {/* PUBLIC STUDENT PORTAL */}
        <Route path="/" element={<Home />} />

        <Route
          path="/departments"
          element={<Departments />}
        />

        {/* OLD URL REDIRECT */}
        <Route
          path="/departments/:departmentId/years"
          element={<LegacyYearsRedirect />}
        />

        {/* STUDENT REGULATIONS */}
        <Route
          path="/departments/:departmentId/regulations"
          element={<Regulations />}
        />

        {/* STUDENT ACADEMIC YEARS */}
        <Route
          path="/departments/:departmentId/regulations/:regulationId/years"
          element={<AcademicYears />}
        />

        {/* STUDENT SEMESTERS */}
        <Route
          path="/departments/:departmentId/years/:yearId/semesters"
          element={<Semesters />}
        />

        {/* STUDENT SUBJECTS */}
        <Route
          path="/departments/:departmentId/years/:yearId/semesters/:semesterId/subjects"
          element={<Subjects />}
        />

        {/* STUDENT MATERIALS */}
        <Route
          path="/departments/:departmentId/years/:yearId/semesters/:semesterId/subjects/:subjectId/materials"
          element={<Materials />}
        />

        {/* STUDENT PDF VIEWER */}
        <Route
          path="/departments/:departmentId/years/:yearId/semesters/:semesterId/subjects/:subjectId/materials/:materialId"
          element={<PDFViewer />}
        />

        {/* ADMIN LOGIN */}
        <Route
          path="/manage-portal"
          element={<AdminLogin />}
        />

        {/* ADMIN LAYOUT */}
        <Route path="/admin" element={<AdminLayout />}>

          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="departments"
            element={<DepartmentManagement />}
          />

          {/* ADMIN REGULATION MANAGEMENT */}
          <Route
            path="regulations"
            element={<RegulationManagement />}
          />

          <Route
            path="academic-years"
            element={<AcademicYearManagement />}
          />

          <Route
            path="semesters"
            element={<SemesterManagement />}
          />

          <Route
            path="subjects"
            element={<SubjectManagement />}
          />

          <Route
            path="materials"
            element={<MaterialManagement />}
          />

          <Route
            path="settings"
            element={<AdminSettings />}
          />

        </Route>

        {/* FALLBACK */}
        <Route
          path="*"
          element={<h2>404 - Page Not Found</h2>}
        />

      </Routes>
    </>
  );
}

export default App;
