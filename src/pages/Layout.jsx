import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const Layout = ({ children, activePage, onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#121315] text-white">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <Topbar />
      <div className="ml-64 pt-16">
        {children}
      </div>
    </div>
  );
};

export default Layout;
