import { useState, useMemo } from 'react';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../features/api/apiSlice.js';
import { useDebounce } from '../utils/useDebounce.js';
import { PageLoader, EmptyState, Pagination } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import { ROLES, ROLE_LABELS } from '../utils/constants.js';
import { toast, confirmAction, apiErrorMessage } from '../utils/alert.js';
import { IconPlus, IconSearch, IconTrash } from '../components/Icons.jsx';

const ROLE_PILL = {
  SUPER_ADMIN: 'bg-gold-100 text-gold-700',
  STAFF: 'bg-indigo-100 text-indigo-700',
  AGENT: 'bg-sky-100 text-sky-700',
  USER: 'bg-navy-100 text-navy-600',
};

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const debounced = useDebounce(search);

  const params = useMemo(
    () => ({ page, limit: 12, search: debounced || undefined, role: roleFilter || undefined }),
    [page, debounced, roleFilter]
  );
  const { data, isLoading } = useGetUsersQuery(params);
  const [createOpen, setCreateOpen] = useState(false);

  const users = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input w-auto">
            <option value="">All roles</option>
            {Object.values(ROLES).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button onClick={() => setCreateOpen(true)} className="btn-gold whitespace-nowrap">
            <IconPlus className="h-4 w-4" /> Add user
          </button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" subtitle="Try a different search or add a new user." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50/50 text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {users.map((u) => <UserRow key={u._id} u={u} />)}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => <UserCard key={u._id} u={u} />)}
          </div>

          <Pagination page={pagination?.page} pages={pagination?.pages} onChange={setPage} />
        </>
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function useUserActions(u) {
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const toggleActive = async () => {
    try {
      await updateUser({ id: u._id, isActive: !u.isActive }).unwrap();
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remove = async () => {
    const ok = await confirmAction({
      title: `Deactivate ${u.name}?`,
      text: 'They will no longer be able to sign in.',
      confirmText: 'Deactivate',
    });
    if (!ok) return;
    try {
      await deleteUser(u._id).unwrap();
      toast.success('User deactivated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return { toggleActive, remove };
}

function UserRow({ u }) {
  const { toggleActive, remove } = useUserActions(u);
  return (
    <tr className="hover:bg-navy-50/40">
      <td className="px-5 py-3.5 font-semibold text-navy-900">{u.name}</td>
      <td className="px-5 py-3.5 text-navy-600">{u.email}</td>
      <td className="px-5 py-3.5">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_PILL[u.role]}`}>{ROLE_LABELS[u.role]}</span>
      </td>
      <td className="px-5 py-3.5">
        <button onClick={toggleActive} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {u.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-5 py-3.5 text-right">
        <button onClick={remove} className="text-navy-300 hover:text-rose-600" aria-label="Deactivate">
          <IconTrash className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function UserCard({ u }) {
  const { toggleActive, remove } = useUserActions(u);
  return (
    <div className="card flex items-center justify-between p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-navy-900">{u.name}</p>
        <p className="truncate text-xs text-navy-400">{u.email}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_PILL[u.role]}`}>{ROLE_LABELS[u.role]}</span>
          <button onClick={toggleActive} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {u.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>
      <button onClick={remove} className="text-navy-300 hover:text-rose-600" aria-label="Deactivate">
        <IconTrash className="h-4 w-4" />
      </button>
    </div>
  );
}

function CreateUserModal({ open, onClose }) {
  const [createUser, { isLoading }] = useCreateUserMutation();
  const empty = { name: '', email: '', password: '', role: ROLES.AGENT, phone: '' };
  const [form, setForm] = useState(empty);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      await createUser(form).unwrap();
      toast.success('User created');
      setForm(empty);
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add user">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full name *</label>
            <input name="name" required value={form.name} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Email *</label>
            <input name="email" type="email" required value={form.email} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Password *</label>
            <input name="password" type="password" required value={form.password} onChange={onChange} className="input" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" value={form.phone} onChange={onChange} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Role *</label>
            <select name="role" value={form.role} onChange={onChange} className="input">
              {Object.values(ROLES).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold">Create user</button>
        </div>
      </form>
    </Modal>
  );
}
