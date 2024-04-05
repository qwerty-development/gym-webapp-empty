import { redirect } from "next/navigation";
import { checkRole } from "../../../../utils/roles";
import { SearchUsers } from "./_search-users";
import { clerkClient } from "@clerk/nextjs";
import { setRole } from "./_action";
import adminNavbarComponent from "@/app/components/admin/adminnavbar"
import AdminNavbarComponent from "@/app/components/admin/adminnavbar";
import ModifyCreditsComponent from "@/app/components/admin/modifycredits";

export default async function AdminDashboard(params: {
  searchParams: { search?: string };
}) {
  if (!checkRole("admin")) {
    redirect("/");
  }

  const query = params.searchParams.search;

  const users = query ? await clerkClient.users.getUserList({ query }) : [];

  return (
    <div>
      <AdminNavbarComponent />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl mt-4 text-center font-bold mb-4">Add Time Slots</h1>
        <SearchUsers />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {users.map((user) => (
            <div key={user.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-6 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-700">{user.firstName} {user.lastName}</h3>
                  <p className="text-gray-500">{user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress}</p>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 rounded-full uppercase font-semibold tracking-wide">
                    {user.publicMetadata.role as string}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <form action={setRole} className="flex-1">
                  <input type="hidden" value={user.id} name="id" />
                  <input type="hidden" value="admin" name="role" />
                  <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                    Make Admin
                  </button>
                </form>

                <form action={setRole} className="flex-1">
                  <input type="hidden" value={user.id} name="id" />
                  <input type="hidden" value="moderator" name="role" />
                  <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                    Make Moderator
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
        <div className=" md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <h1 className="text-2xl mt-4 text-center font-bold mb-4">Modify credits</h1>
          <ModifyCreditsComponent />
        </div>
      </div>
    </div>
  );
}
