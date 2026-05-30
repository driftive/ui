import {lazy, Suspense} from "react";
import {Route, Routes} from "react-router";
import {Spin} from "antd";
import {LoginPage} from "./pages/login/Login.tsx";
import {LoginSuccessPage} from "./pages/login/Success.tsx";
import {OrganizationsPage} from "./pages/organizations/OrganizationsPage.tsx";
import {RepositoriesPage} from "./pages/repositories/RepositoriesPage.tsx";
import {RepositoryPage} from "./pages/repository/RepositoryPage.tsx";
import {AppLayout} from "./components/AppLayout/AppLayout.tsx";
import {ProtectedRoute} from "./components/ProtectedRoute/ProtectedRoute.tsx";
import {RootRedirect} from "./components/RootRedirect/RootRedirect.tsx";

// RunResultPage pulls in react-syntax-highlighter; defer it until a user
// actually navigates to a run.
const RunResultPage = lazy(() => import("./pages/run_result/RunResult.tsx"));

const RouteFallback = () => (
  <div style={{display: 'flex', justifyContent: 'center', padding: '48px 0'}}>
    <Spin size="large" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/login/success" element={<LoginSuccessPage/>}/>

        {/* Authenticated routes with AppLayout */}
        <Route element={<ProtectedRoute/>}>
          <Route element={<AppLayout />}>
            <Route path="/:provider/orgs" element={<OrganizationsPage/>}/>
            <Route path="/:provider/:org" element={<RepositoriesPage/>}/>
            <Route path="/:provider/:org/:repo" element={<RepositoryPage/>}/>
            <Route path="/:provider/:org/:repo/run/:run" element={<RunResultPage/>}/>
            <Route path="/results" element={<RunResultPage/>}/>
          </Route>
        </Route>

        <Route path="*" element={<div>Not Found</div>}/>
      </Routes>
    </Suspense>
  )
}
