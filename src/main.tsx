import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { IndexRoute, PublicRouteErrorBoundary, publicSnapshotLoader } from "./routes/index";
import { AdminRoute } from "./routes/admin";
import "./styles/globals.css";
import "./styles/theme.css";
import "./styles/public.css";
import "./styles/admin.css";

const router = createBrowserRouter([
  { path: "/", element: <IndexRoute />, loader: publicSnapshotLoader, errorElement: <PublicRouteErrorBoundary /> },
  { path: "/admin", element: <AdminRoute /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
