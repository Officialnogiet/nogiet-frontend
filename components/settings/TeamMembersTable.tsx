import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  role: string;
}

interface TeamMembersTableProps {
  darkMode: boolean;
  members: TeamMember[];
  isLoading?: boolean;
  showActionMenu: number | null;
  setShowActionMenu: (i: number | null) => void;
  onAddNew: () => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (id: string) => void;
  search?: string;
  onSearchChange?: (s: string) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (p: number) => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  darkMode, members, isLoading, showActionMenu, setShowActionMenu, onAddNew, onEdit, onDelete,
  search = '', onSearchChange, page = 1, totalPages = 1, total = 0, onPageChange,
}) => (
  <div className={`border rounded-[32px] shadow-sm overflow-hidden flex flex-col transition-colors duration-300 ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
    <div className={`p-8 border-b flex items-center justify-between ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
      <div>
        <h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Team Members</h3>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{total} member{total !== 1 ? 's' : ''} total</p>
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className={`pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none w-64 transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-300'}`}
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <button onClick={onAddNew} className="px-5 py-2.5 bg-[#002b28] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#003d38] transition-all shadow-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
          Add New
        </button>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800/10 border-[#1e2430]' : 'bg-gray-50/50 border-gray-50'}`}>
            <th className="px-8 py-4">Full Name</th>
            <th className="px-8 py-4">Email Address</th>
            <th className="px-8 py-4">Phone Number</th>
            <th className="px-8 py-4">Date Created</th>
            <th className="px-8 py-4">Role</th>
            <th className="px-8 py-4"></th>
          </tr>
        </thead>
        <tbody className={`divide-y transition-colors duration-300 ${darkMode ? 'divide-[#1e2430]' : 'divide-gray-50'}`}>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading team members...</span>
                </div>
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={6} className={`py-20 text-center text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {search ? 'No members match your search' : 'No team members yet'}
              </td>
            </tr>
          ) : (
            members.map((member, i) => (
              <tr key={member.id + '-' + i} className={`transition-colors group ${darkMode ? 'hover:bg-gray-800/20' : 'hover:bg-gray-50/50'}`}>
                <td className={`px-8 py-5 text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{member.name}</td>
                <td className={`px-8 py-5 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>{member.email}</td>
                <td className={`px-8 py-5 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>{member.phone}</td>
                <td className={`px-8 py-5 text-[11px] font-bold uppercase tracking-tight ${darkMode ? 'text-gray-500' : 'text-gray-800'}`}>{member.date}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${member.role === 'Super Admin' ? darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600' : 'bg-[#009688]/10 text-[#009688]'}`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-8 py-5 text-right relative">
                  <button onClick={() => setShowActionMenu(showActionMenu === i ? null : i)} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                  </button>
                  {showActionMenu === i && (
                    <div className={`absolute right-12 top-0 w-48 rounded-2xl shadow-2xl z-20 p-2 border flex flex-col items-start animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-[#1a1f2b] border-[#2d364a]' : 'bg-white border-gray-100'}`}>
                      <button onClick={() => { onEdit(member); setShowActionMenu(null); }} className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'}`}>
                        Manage Member
                      </button>
                      <button onClick={() => { onDelete(member.id); setShowActionMenu(null); }} className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}>
                        Delete Member
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {totalPages > 1 && (
      <div className={`px-8 py-4 border-t flex items-center justify-between ${darkMode ? 'border-[#1e2430]' : 'border-gray-100'}`}>
        <span className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Page {page} of {totalPages} ({total} total)
        </span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}
            className={`p-2 rounded-xl transition-all disabled:opacity-30 ${darkMode ? 'hover:bg-[#1e2430] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, page - 3), Math.min(totalPages, page + 2)
          ).map(p => (
            <button key={p} onClick={() => onPageChange?.(p)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${p === page ? 'bg-teal-600 text-white' : darkMode ? 'text-gray-400 hover:bg-[#1e2430]' : 'text-gray-500 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}
            className={`p-2 rounded-xl transition-all disabled:opacity-30 ${darkMode ? 'hover:bg-[#1e2430] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )}
  </div>
);

export default TeamMembersTable;
