import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "components/navbar";
import Sidebar from "components/sidebar";
import routes from "routes.js";

export default function Admin(props) {
  const { ...rest } = props;
  const location = useLocation();
  const [currentRoute, setCurrentRoute] = React.useState("Main Dashboard");

  React.useEffect(() => {
    getActiveRoute(routes);
  }, [location.pathname]);

  const getActiveRoute = (routes) => {
    let activeRoute = "Main Dashboard";
    for (let i = 0; i < routes.length; i++) {
      if (
        window.location.href.indexOf(
          routes[i].layout + "/" + routes[i].path
        ) !== -1
      ) {
        setCurrentRoute(routes[i].name);
      }
    }
    return activeRoute;
  };

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };

  document.documentElement.dir = "ltr";
  
  return (
    // ROOT: Strict 100vh/vw, no global scrolling, forced dark background
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b1437] dark:bg-navy-900">
      
      <Sidebar />

      {/* MAIN WRAPPER: Leaves exactly 80px for the collapsed sidebar */}
      <div className="flex flex-1 flex-col overflow-hidden ml-[80px]">
        
        {/* MAGIC CONTAINER: Both Navbar and Content now live inside this single scrolling area */}
        <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8 pt-2">
          
          {/* TOP NAVBAR: Now it sits naturally in the document flow */}
          <div className="mb-6 w-full pt-4">
            <Navbar />
          </div>

          {/* PAGE CONTENT: Right below the Navbar */}
          <div className="mx-auto max-w-7xl">
            <Routes>
              {getRoutes(routes)}
            </Routes>
          </div>

        </main>

      </div>
    </div>
  );
}