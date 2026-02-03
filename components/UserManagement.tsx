
import React, { useState } from 'react';

type SettingsTab = 'USER_MANAGEMENT' | 'ROLE_MANAGEMENT';

interface UserManagementProps {
    darkMode?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ darkMode }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('USER_MANAGEMENT');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<any>(null);
    const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
    const [showAttentionModal, setShowAttentionModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [openPermissions, setOpenPermissions] = useState<number | null>(null);

    const teamMembers = [
        { id: '3452', name: 'Johnson Olawale', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Super Admin' },
        { id: '3452', name: 'Chijioke Nwosu', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
        { id: '3452', name: 'Chiamaka Ibeme', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
        { id: '3452', name: 'Marshall Mathers', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
        { id: '3452', name: 'Sarah Johnson', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
        { id: '3452', name: 'Sarah Johnson', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
        { id: '3452', name: 'Sarah Johnson', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
        { id: '3452', name: 'Sarah Johnson', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
        { id: '3452', name: 'Sarah Johnson', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
        { id: '3452', name: 'Sarah Johnson', email: 'contactmichaeleze@gmail.com', phone: '08101790957', date: '10 Jan 2026, 10:12 AM', role: 'Member' },
    ];

    const roles = [
        { role: 'Super Admin', description: 'MD, CEO, CDO, CTO', permissions: ['Live Map', 'Analytics', 'Data Comparison', 'Add Member'] },
        { role: 'Admin', description: 'Manager', permissions: ['Live Map', 'Analytics', 'Data Comparison'] },
        { role: 'Member', description: 'Team Member', permissions: ['Live Map', 'Data Comparison'] },
    ];

    const handleDelete = () => {
        setShowAttentionModal(false);
        setShowSuccessModal(true);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowEditModal(null);
        setShowSuccessModal(true);
    };

    return (
        <div className={`flex-1 overflow-y-auto p-12 transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-white'}`}>
            <h1 className={`text-3xl font-extrabold tracking-tight mb-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Settings/{activeTab === 'USER_MANAGEMENT' ? 'User Management' : 'Role Management'}
            </h1>

            <div className="flex gap-10 items-start">
                {/* Categories Sidebar */}
                <div className="w-64 space-y-6">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Categories</p>
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveTab('USER_MANAGEMENT')}
                            className={`w-full text-left px-4 py-3 font-bold rounded-xl text-sm transition-all border-l-4 ${activeTab === 'USER_MANAGEMENT' ? 'bg-[#009688]/10 text-[#009688] border-[#009688]' : darkMode ? 'text-gray-500 hover:bg-gray-800/50 border-transparent' : 'text-gray-400 hover:bg-gray-50 border-transparent'}`}
                        >
                            User Management
                        </button>
                        <button
                            onClick={() => setActiveTab('ROLE_MANAGEMENT')}
                            className={`w-full text-left px-4 py-3 font-bold rounded-xl text-sm transition-all border-l-4 ${activeTab === 'ROLE_MANAGEMENT' ? 'bg-[#009688]/10 text-[#009688] border-[#009688]' : darkMode ? 'text-gray-500 hover:bg-gray-800/50 border-transparent' : 'text-gray-400 hover:bg-gray-50 border-transparent'}`}
                        >
                            Role Management
                        </button>
                    </div>
                </div>

                {/* Dynamic Content */}
                <div className="flex-1">
                    {activeTab === 'USER_MANAGEMENT' ? (
                        <div className={`border rounded-[32px] shadow-sm overflow-hidden flex flex-col transition-colors duration-300 ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
                            <div className={`p-8 border-b flex items-center justify-between ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
                                <h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Team Members</h3>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className={`pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none w-64 transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-300'
                                                }`}
                                        />
                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <button className={`px-4 py-2.5 border rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                                        }`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                        Filter
                                    </button>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="px-5 py-2.5 bg-[#002b28] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#003d38] transition-all shadow-lg"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                                        Add New
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800/10 border-[#1e2430]' : 'bg-gray-50/50 border-gray-50'
                                            }`}>
                                            <th className="px-8 py-4">ID</th>
                                            <th className="px-8 py-4">Full Name</th>
                                            <th className="px-8 py-4">Email Address</th>
                                            <th className="px-8 py-4">Phone Number</th>
                                            <th className="px-8 py-4">Date Created</th>
                                            <th className="px-8 py-4">Role</th>
                                            <th className="px-8 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y transition-colors duration-300 ${darkMode ? 'divide-[#1e2430]' : 'divide-gray-50'}`}>
                                        {teamMembers.map((member, i) => (
                                            <tr key={i} className={`transition-colors group ${darkMode ? 'hover:bg-gray-800/20' : 'hover:bg-gray-50/50'}`}>
                                                <td className={`px-8 py-5 text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{member.id}</td>
                                                <td className={`px-8 py-5 text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{member.name}</td>
                                                <td className={`px-8 py-5 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>{member.email}</td>
                                                <td className={`px-8 py-5 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>{member.phone}</td>
                                                <td className={`px-8 py-5 text-[11px] font-bold uppercase tracking-tight ${darkMode ? 'text-gray-500' : 'text-gray-800'}`}>{member.date}</td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${member.role === 'Super Admin'
                                                        ? darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                                                        : 'bg-[#009688]/10 text-[#009688]'
                                                        }`}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right relative">
                                                    <button
                                                        onClick={() => setShowActionMenu(showActionMenu === i ? null : i)}
                                                        className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                                    </button>

                                                    {showActionMenu === i && (
                                                        <div className={`absolute right-12 top-0 w-48 rounded-2xl shadow-2xl z-20 p-2 border flex flex-col items-start animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-[#1a1f2b] border-[#2d364a]' : 'bg-white border-gray-100'
                                                            }`}>
                                                            <button
                                                                onClick={() => { setShowEditModal(member); setShowActionMenu(null); }}
                                                                className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                Manage Member
                                                            </button>
                                                            <button
                                                                onClick={() => { setShowAttentionModal(true); setShowActionMenu(null); }}
                                                                className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
                                                                    }`}
                                                            >
                                                                Delete Member
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
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
                                        <tr className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800/10 border-[#1e2430]' : 'bg-gray-50/50 border-gray-50'
                                            }`}>
                                            <th className="px-8 py-4 flex items-center gap-1.5">
                                                Role <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </th>
                                            <th className="px-8 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    Description <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                            </th>
                                            <th className="px-8 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    Permissions <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y transition-colors duration-300 ${darkMode ? 'divide-[#1e2430]' : 'divide-gray-50'}`}>
                                        {roles.map((role, i) => (
                                            <tr key={i} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/20' : 'hover:bg-gray-50/50'}`}>
                                                <td className={`px-8 py-6 text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{role.role}</td>
                                                <td className={`px-8 py-6 text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{role.description}</td>
                                                <td className="px-8 py-6 relative">
                                                    <button
                                                        onClick={() => setOpenPermissions(openPermissions === i ? null : i)}
                                                        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-bold transition-all ${darkMode
                                                            ? 'bg-[#12161f] border-[#1e2430] text-gray-500 hover:text-gray-300 hover:border-gray-600'
                                                            : 'border-gray-100 text-gray-300 hover:text-gray-500 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        Manage
                                                        <svg className={`w-4 h-4 transition-transform ${openPermissions === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                                    </button>

                                                    {openPermissions === i && (
                                                        <div className={`absolute right-8 top-full mt-2 w-64 rounded-2xl shadow-2xl border z-50 p-6 animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-[#1a1f2b] border-[#2d364a]' : 'bg-white border-gray-100'
                                                            }`}>
                                                            <div className="space-y-4">
                                                                {['Live Map', 'Analytics', 'Data Comparison', 'Add Member'].map((perm) => (
                                                                    <label key={perm} className="flex items-center gap-3 cursor-pointer group">
                                                                        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${role.permissions.includes(perm)
                                                                            ? 'bg-[#009688] border-[#009688]'
                                                                            : darkMode ? 'bg-[#12161f] border-[#2d364a] group-hover:border-[#009688]' : 'bg-white border-gray-100 group-hover:border-[#009688]'
                                                                            }`}>
                                                                            {role.permissions.includes(perm) && (
                                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                            )}
                                                                        </div>
                                                                        <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{perm}</span>
                                                                    </label>
                                                                ))}
                                                                <button
                                                                    onClick={() => setOpenPermissions(null)}
                                                                    className="w-full mt-2 py-3 bg-[#009688] text-white rounded-xl font-bold text-sm hover:bg-[#00796b] transition-all shadow-lg shadow-[#009688]/20"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}

            {/* Edit/Manage Member Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
                    <div className={`w-full max-w-md rounded-[32px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-[#12161f] border border-[#1e2430]' : 'bg-white border border-gray-100'
                        }`}>
                        <div className={`px-10 py-8 border-b flex justify-between items-center ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
                            <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manage Member</h2>
                            <button onClick={() => setShowEditModal(null)} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form className="p-10 space-y-6" onSubmit={handleSaveEdit}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue={showEditModal.name}
                                    className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-100 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue={showEditModal.email}
                                    className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-100 text-gray-900'
                                        }`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Role</label>
                                <div className="relative">
                                    <select className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-100 text-gray-900'
                                        }`}>
                                        <option selected={showEditModal.role === 'Member'}>Member</option>
                                        <option selected={showEditModal.role === 'Super Admin'}>Super Admin</option>
                                        <option>Admin</option>
                                    </select>
                                    <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setShowEditModal(null)} className={`px-8 py-3.5 border rounded-2xl font-extrabold text-sm transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50'
                                    }`}>Cancel</button>
                                <button type="submit" className="px-8 py-3.5 bg-[#009688] text-white rounded-2xl font-extrabold text-sm hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
                    <div className={`w-full max-w-md rounded-[32px] shadow-3xl p-10 space-y-8 animate-in zoom-in-95 duration-300 border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'
                        }`}>
                        <div className="flex justify-between items-center">
                            <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New Member</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); setShowSuccessModal(true); }}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-600' : 'bg-white border-gray-100 text-gray-900 placeholder-gray-400'
                                        }`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-600' : 'bg-white border-gray-100 text-gray-900 placeholder-gray-400'
                                        }`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Role</label>
                                <div className="relative">
                                    <select className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer transition-all focus:ring-1 focus:ring-[#009688] ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-gray-600' : 'bg-white border-gray-100 text-gray-400'
                                        }`}>
                                        <option>Select role</option>
                                        <option>Super Admin</option>
                                        <option>Member</option>
                                    </select>
                                    <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className={`flex-1 py-4 border rounded-2xl font-extrabold text-sm transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50'
                                    }`}>Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-[#009688] text-white rounded-2xl font-extrabold text-sm hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attention Modal */}
            {showAttentionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-6 animate-in fade-in duration-300">
                    <div className={`w-full max-w-sm rounded-[32px] shadow-3xl p-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300 border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'
                        }`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                            <div className={`absolute inset-0 rounded-full border-2 opacity-50 ${darkMode ? 'border-orange-500/20' : 'border-orange-100'}`}></div>
                            <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Attention</h2>
                            <p className={`text-sm font-bold leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Are you sure you want to delete this team member?</p>
                        </div>
                        <div className="flex gap-4 w-full pt-4">
                            <button onClick={() => setShowAttentionModal(false)} className={`flex-1 py-4 border rounded-2xl font-extrabold text-sm transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-100 text-gray-800 hover:bg-gray-50'
                                }`}>Cancel</button>
                            <button onClick={handleDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-extrabold text-sm hover:bg-red-600 transition-all shadow-xl shadow-red-500/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[130] p-6 animate-in fade-in duration-300">
                    <div className={`w-full max-w-sm rounded-[32px] shadow-3xl p-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300 border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'
                        }`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${darkMode ? 'bg-[#009688]/10' : 'bg-[#009688]/10'}`}>
                            <div className={`absolute inset-0 rounded-full border-2 opacity-50 ${darkMode ? 'border-[#009688]/20' : 'border-[#009688]/20'}`}></div>
                            <svg className="w-10 h-10 text-[#009688]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Success!</h2>
                            <p className={`text-sm font-bold leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Team member action processed successfully</p>
                        </div>
                        <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-[#009688] text-white rounded-2xl font-extrabold text-sm hover:bg-[#00796b] transition-all shadow-xl shadow-[#009688]/20 mt-4">
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
