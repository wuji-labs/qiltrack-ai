"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditManager } from "@/lib/core/credits/manager";

interface CreditInfo {
  user_id: string;
  email: string;
  display_name?: string;
  credits_available: number;
  credits_used: number;
  last_updated: string;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<CreditInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantingCredits, setGrantingCredits] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>("admin_manual_grant");

  useEffect(() => {
    fetchCredits();
  }, []);

  async function fetchCredits() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("report_credits")
        .select(`
          user_id,
          credits_available,
          credits_used,
          updated_at,
          profiles!inner(email, display_name, full_name)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const formatted = data?.map((item) => ({
        user_id: item.user_id,
        email: item.profiles.email,
        display_name: item.profiles.display_name || item.profiles.full_name,
        credits_available: item.credits_available,
        credits_used: item.credits_used,
        last_updated: item.updated_at,
      })) || [];

      setCredits(formatted);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGrantCredits(e: React.FormEvent) {
    e.preventDefault();
    setGrantingCredits(true);

    try {
      const supabase = createClient();

      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to grant credits");
        return;
      }

      const creditManager = new CreditManager();

      await creditManager.grantCredits(
        user.id,
        selectedUser,
        amount,
        reason
      );

      alert(`Successfully granted ${amount} credits!`);

      // Reset form
      setAmount(10);
      setReason("admin_manual_grant");
      setSelectedUser("");

      // Refresh credits list
      await fetchCredits();
    } catch (error) {
      console.error("Failed to grant credits:", error);
      alert(`Failed to grant credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGrantingCredits(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Credits Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage user credits
        </p>
      </div>

      {/* Grant Credits Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Grant Credits</h2>
        <form onSubmit={handleGrantCredits} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a user...</option>
              {credits.map((credit) => (
                <option key={credit.user_id} value={credit.user_id}>
                  {credit.display_name || credit.email} (Current: {credit.credits_available} credits)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
              max="1000"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Bonus, Compensation, Test"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={grantingCredits || !selectedUser}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {grantingCredits ? "Granting..." : "Grant Credits"}
          </button>
        </form>
      </div>

      {/* Credits Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading credits...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Granted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {credits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No credit records found
                  </td>
                </tr>
              ) : (
                credits.map((credit) => (
                  <tr key={credit.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {credit.display_name || credit.email}
                      </div>
                      <div className="text-sm text-gray-500">{credit.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {credit.credits_available}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {credit.credits_used}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {credit.credits_available + credit.credits_used}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(credit.last_updated).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
