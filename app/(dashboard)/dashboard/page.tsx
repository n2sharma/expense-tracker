import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Welcome back, {session?.user?.name}!
      </h1>
      <p className="text-gray-600 mt-2">Your dashboard is ready.</p>
    </div>
  );
}
