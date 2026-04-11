import { NavLink } from 'react-router-dom'

const navItems = [
    { label: "⬆️ Upload", path: "/" },
    { label: "📊 Results", path: "/results" },
    { label: "🔍 Explainability", path: "/explain" },
    { label: "🔧 Mitigation", path: "/mitigate" },
]

const Sidebar = () => (
    <div className="w-64 h-screen bg-white shadow-md flex flex-col p-6">
        <h1 className="text-2xl font-bold text-purple-700 mb-8">⚖️ FairLens</h1>

        {navItems.map(item => (
            <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                    `p-3 rounded-lg mb-2 font-medium transition-all ${
                        isActive
                            ? "bg-purple-100 text-purple-700"
                            : "text-gray-600 hover:bg-gray-100"
                    }`
                }
            >
                {item.label}
            </NavLink>
        ))}
    </div>
)

export default Sidebar