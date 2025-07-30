import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 space-y-4">
        <h1 className="text-xl font-bold mb-6">Admin Management</h1>
        <nav className="space-y-2">
          <a href="/admin" className="block hover:text-gray-300">
            Dashboard
          </a>
          <a href="/admin/restaurants" className="block hover:text-gray-300">
            Restaurants
          </a>
          <a href="/admin/roles" className="block hover:text-gray-300">
            Roles
          </a>
          <a href="/admin/permissions" className="block hover:text-gray-300">
            Permissions
          </a>
        </nav>
        <div>
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 bg-gray-100">{children}</main>
    </div>
  );
}
