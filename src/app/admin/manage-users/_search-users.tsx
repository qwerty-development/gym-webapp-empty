"use client";
 
import { usePathname, useRouter } from "next/navigation";
 
export const SearchUsers = () => {
  const router = useRouter();
  const pathname = usePathname();
 
  return (
<div className="max-w-lg mx-auto my-8">
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const queryTerm = formData.get("search") as string;
      router.push(pathname + "?search=" + queryTerm);
    }}
    className="flex items-center space-x-4"
  >
    <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search for Users</label>
    <div className="flex-1 min-w-0">
      <input
        id="search"
        name="search"
        type="text"
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Enter a name or email"
      />
    </div>
    <button
      type="submit"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Submit
    </button>
  </form>
</div>

  );
};