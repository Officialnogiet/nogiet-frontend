import React, { useState } from 'react';
import SettingsSidebar from './settings/SettingsSidebar';
import TeamMembersTable from './settings/TeamMembersTable';
import RoleManagementTable from './settings/RoleManagementTable';
import AddMemberModal from './settings/AddMemberModal';
import EditMemberModal from './settings/EditMemberModal';
import AttentionModal from './settings/AttentionModal';
import SuccessActionModal from './settings/SuccessActionModal';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../src/hooks/useUsers';
import { useRoles, usePermissions, useUpdateRolePermissions } from '../src/hooks/useRoles';

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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: usersData, isLoading: usersLoading } = useUsers(page, 10, search || undefined);
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: allPermissions } = usePermissions();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const updateRolePermissions = useUpdateRolePermissions();

  const roleLabel = (r: string) => {
    switch (r) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'facility_owner': return 'Field Agent';
      default: return 'Member';
    }
  };

  const members = (usersData?.data ?? []).map((u: any) => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    phone: u.phone ?? '-',
    date: new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    role: roleLabel(u.role),
  }));

  const roles = (rolesData ?? []).map((r: any) => ({
    id: r.id,
    role: roleLabel(r.name),
    rawName: r.name,
    description: r.description ?? '',
    permissions: (r.permissions ?? []).map((p: any) => p.name),
    permissionIds: (r.permissions ?? []).map((p: any) => p.id),
  }));

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteUser.mutateAsync(pendingDeleteId);
      setShowAttentionModal(false);
      setPendingDeleteId(null);
      setShowSuccessModal(true);
    } catch { /* error handled by query */ }
  };

  const handleCreateUser = async (data: { fullName: string; email: string; role: string; tempPassword?: string }) => {
    try {
      await createUser.mutateAsync(data);
    } catch { /* error handled by query */ }
  };

  const handleUpdateUser = async (id: string, data: { fullName?: string; email?: string; role?: string }) => {
    try {
      await updateUser.mutateAsync({ id, data });
      setShowEditModal(null);
      setShowSuccessModal(true);
    } catch { /* error handled by query */ }
  };

  const handleSavePermissions = async (roleRawName: string, permissionNames: string[]) => {
    const permIds = permissionNames
      .map((name) => (allPermissions ?? []).find((p: any) => p.name === name)?.id)
      .filter(Boolean) as string[];
    try {
      await updateRolePermissions.mutateAsync({ roleName: roleRawName, permissionIds: permIds });
      setOpenPermissions(null);
    } catch { /* error handled by query */ }
  };

  const meta = usersData?.meta;

  return (
    <div className={`flex-1 overflow-y-auto p-12 transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-white'}`}>
      <h1 className={`text-3xl font-extrabold tracking-tight mb-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {activeTab === 'USER_MANAGEMENT' ? 'User Management' : 'Role Management'}
      </h1>

      <div className="flex gap-10 items-start">
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} darkMode={!!darkMode} />

        <div className="flex-1">
          {activeTab === 'USER_MANAGEMENT' ? (
            <TeamMembersTable
              darkMode={!!darkMode}
              members={members}
              isLoading={usersLoading}
              showActionMenu={showActionMenu}
              setShowActionMenu={setShowActionMenu}
              onAddNew={() => setShowAddModal(true)}
              onEdit={(member) => setShowEditModal(member)}
              onDelete={(id) => { setPendingDeleteId(id); setShowAttentionModal(true); }}
              search={search}
              onSearchChange={setSearch}
              page={page}
              totalPages={meta?.totalPages ?? 1}
              total={meta?.total ?? 0}
              onPageChange={setPage}
            />
          ) : (
            <RoleManagementTable
              darkMode={!!darkMode}
              roles={roles}
              isLoading={rolesLoading}
              allPermissions={(allPermissions ?? []).map((p: any) => p.name)}
              openPermissions={openPermissions}
              setOpenPermissions={setOpenPermissions}
              onSavePermissions={handleSavePermissions}
              isSaving={updateRolePermissions.isPending}
            />
          )}
        </div>
      </div>

      {showEditModal && (
        <EditMemberModal
          darkMode={!!darkMode}
          member={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSave={handleUpdateUser}
          isSaving={updateUser.isPending}
        />
      )}
      {showAddModal && (
        <AddMemberModal
          darkMode={!!darkMode}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateUser}
          isSaving={createUser.isPending}
        />
      )}
      {showAttentionModal && <AttentionModal darkMode={!!darkMode} onCancel={() => { setShowAttentionModal(false); setPendingDeleteId(null); }} onConfirm={handleDelete} isDeleting={deleteUser.isPending} />}
      {showSuccessModal && <SuccessActionModal darkMode={!!darkMode} onClose={() => setShowSuccessModal(false)} />}
    </div>
  );
};

export default UserManagement;
