import React, { useState, useEffect } from 'react';

function formatPermName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface RoleItem {
  id: string;
  role: string;
  rawName: string;
  description: string;
  permissions: string[];
  permissionIds: string[];
}

interface RoleManagementTableProps {
  darkMode: boolean;
  roles: RoleItem[];
  isLoading?: boolean;
  allPermissions: string[];
  openPermissions: number | null;
  setOpenPermissions: (i: number | null) => void;
  onSavePermissions: (roleRawName: string, permissionNames: string[]) => void;
  isSaving?: boolean;
}

const RoleManagementTable: React.FC<RoleManagementTableProps> = ({
  darkMode, roles, isLoading, allPermissions, openPermissions, setOpenPermissions, onSavePermissions, isSaving,
}) => {
  const [localPerms, setLocalPerms] = useState<string[]>([]);

  useEffect(() => {
    if (openPermissions !== null && roles[openPermissions]) {
      setLocalPerms([...roles[openPermissions].permissions]);
    }
  }, [openPermissions, roles]);

  const togglePerm = (perm: string) => {
    setLocalPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className={`border rounded-[32px] shadow-sm overflow-hidden flex flex-col transition-colors duration-300 ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
      <div className={`p-8 border-b ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
        <h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Role Management</h3>
        <p className={`text-[11px] font-bold mt-1 uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Set roles that control user access and actions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800/10 border-[#1e2430]' : 'bg-gray-50/50 border-gray-50'}`}>
              <th className="px-8 py-4">Role</th>
              <th className="px-8 py-4">Description</th>
              <th className="px-8 py-4">Permissions</th>
            </tr>
          </thead>
          <tbody className={`divide-y transition-colors duration-300 ${darkMode ? 'divide-[#1e2430]' : 'divide-gray-50'}`}>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading roles...</span>
                  </div>
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={3} className={`py-20 text-center text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  No roles configured
                </td>
              </tr>
            ) : (
              roles.map((role, i) => (
                <tr key={role.id || i} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/20' : 'hover:bg-gray-50/50'}`}>
                  <td className={`px-8 py-6 text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{role.role}</td>
                  <td className={`px-8 py-6 text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{role.description || '-'}</td>
                  <td className="px-8 py-6 relative">
                    <div className="flex items-center gap-2 flex-wrap">
                      {role.permissions.length > 0 ? (
                        role.permissions.map((p) => (
                          <span key={p} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>
                            {formatPermName(p)}
                          </span>
                        ))
                      ) : (
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No permissions</span>
                      )}
                      <button
                        onClick={() => setOpenPermissions(openPermissions === i ? null : i)}
                        className={`ml-2 px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-500 hover:text-gray-300 hover:border-gray-600' : 'border-gray-100 text-gray-300 hover:text-gray-500 hover:border-gray-200'}`}
                      >
                        Edit
                      </button>
                    </div>

                    {openPermissions === i && (
                      <div className={`absolute right-8 top-full mt-2 w-72 rounded-2xl shadow-2xl border z-50 p-6 animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-[#1a1f2b] border-[#2d364a]' : 'bg-white border-gray-100'}`}>
                        <p className={`text-xs font-bold mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Permissions for {role.role}
                        </p>
                        <div className="space-y-4">
                          {allPermissions.length > 0 ? allPermissions.map((perm) => (
                            <label key={perm} className="flex items-center gap-3 cursor-pointer group" onClick={() => togglePerm(perm)}>
                              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${localPerms.includes(perm) ? 'bg-[#009688] border-[#009688]' : darkMode ? 'bg-[#12161f] border-[#2d364a] group-hover:border-[#009688]' : 'bg-white border-gray-100 group-hover:border-[#009688]'}`}>
                                {localPerms.includes(perm) && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                )}
                              </div>
                              <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatPermName(perm)}</span>
                            </label>
                          )) : (
                            <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No permissions defined in the system yet.</p>
                          )}
                          <button
                            onClick={() => onSavePermissions(role.rawName, localPerms)}
                            disabled={isSaving}
                            className="w-full mt-2 py-3 bg-[#009688] text-white rounded-xl font-bold text-sm hover:bg-[#00796b] transition-all shadow-lg shadow-[#009688]/20 disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagementTable;
