import { AdminSidebar } from "./components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 w-full h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
