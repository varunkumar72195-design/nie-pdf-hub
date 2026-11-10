
import { Routes, Route } from "react-router-dom";

// Student pages
import Home from "./pages/Home";
import Departments from "./pages/Departments";
import AcademicYears from "./pages/academicyears";
import Semesters from "./pages/Semesters";
import Subjects from "./pages/Subjects";
import Materials from "./pages/Materials";
import PDFViewer from "./pages/PDFViewer";

// Admin pages
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import DepartmentManagement from "./pages/DepartmentManagement";
import AcademicYearManagement from "./pages/AcademicYearManagement";
import SemesterManagement from "./pages/SemesterManagement";
import SubjectManagement from "./pages/SubjectManagement";
import MaterialManagement from "./pages/MaterialManagement";
import AdminSettings from "./pages/AdminSettings";

function App() {
  return (
    <Routes>
      {/* PUBLIC STUDENT PORTAL */}
      <Route path="/" element={<Home />} />
      <Route path="/departments" element={<Departments />} />

      <Route
        path="/departments/:departmentId/years"
        element={<AcademicYears />}
      />

      <Route
        path="/departments/:departmentId/years/:yearId/semesters"
        element={<Semesters />}
      />

      <Route
        path="/departments/:departmentId/years/:yearId/semesters/:semesterId/subjects"
        element={<Subjects />}
      />

      <Route
        path="/departments/:departmentId/years/:yearId/semesters/:semesterId/subjects/:subjectId/materials"
        element={<Materials />}
      />

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
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="academic-years" element={<AcademicYearManagement />} />
        <Route path="semesters" element={<SemesterManagement />} />
        <Route path="subjects" element={<SubjectManagement />} />
        <Route path="materials" element={<MaterialManagement />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* FALLBACK */}
      <Route
        path="*"
        element={<h2>404 - Page Not Found</h2>}
      />
    </Routes>
  );
}

export default App;
