import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, FolderTree, PlusCircle } from 'lucide-react';
import { adminApi } from '../api/admin';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const AdminDeptsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDeptId, setCatDeptId] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const { data: departments = [] } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: adminApi.listDepartments,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: adminApi.listCategories,
  });

  const createDeptMutation = useMutation({
    mutationFn: (data: any) => adminApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      setIsDeptModalOpen(false);
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
    },
  });

  const createCatMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setIsCatModalOpen(false);
      setCatName('');
      setCatDeptId('');
      setCatDesc('');
    },
  });

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 max-w-6xl mx-auto overflow-x-hidden">
        <div className="pb-6 border-b border-slate-200 mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Departments & Categories
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure business departments and ticket categorization taxonomies for routing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Departments Column */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Departments ({departments.length})
              </h3>
              <Button size="sm" onClick={() => setIsDeptModalOpen(true)} className="text-xs">
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add Department
              </Button>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {departments.map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{d.name}</h5>
                    <p className="text-slate-400 mt-0.5">{d.description || 'No description'}</p>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {d.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Categories Column */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-purple-600" />
                Complaint Categories ({categories.length})
              </h3>
              <Button size="sm" onClick={() => setIsCatModalOpen(true)} className="text-xs">
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add Category
              </Button>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{c.name}</h5>
                    <p className="text-slate-400 mt-0.5">{c.description || 'No description'}</p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {c.department_name || 'General'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create Dept Modal */}
        <Modal
          isOpen={isDeptModalOpen}
          onClose={() => setIsDeptModalOpen(false)}
          title="Create Department"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createDeptMutation.mutate({
                name: deptName.trim(),
                code: deptCode.trim().toUpperCase(),
                description: deptDesc.trim(),
              });
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department Name
              </label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Infrastructure & Security"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Code Identifier
              </label>
              <input
                type="text"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="e.g. INFRA"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
                placeholder="Primary areas of ownership..."
                rows={2}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsDeptModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createDeptMutation.isPending}>
                Create Department
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create Category Modal */}
        <Modal
          isOpen={isCatModalOpen}
          onClose={() => setIsCatModalOpen(false)}
          title="Create Category"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCatMutation.mutate({
                name: catName.trim(),
                department_id: catDeptId || undefined,
                description: catDesc.trim(),
              });
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Account Security Breach"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Associated Department
              </label>
              <select
                value={catDeptId}
                onChange={(e) => setCatDeptId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- General / Any Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Criteria for tickets under this category..."
                rows={2}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsCatModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createCatMutation.isPending}>
                Create Category
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};
