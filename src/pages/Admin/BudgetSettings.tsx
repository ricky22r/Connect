import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EmployeeBudget {
  id: string;
  employee_id: string;
  employee_name: string;
  monthly_budget: number;
  reimbursement_rate_per_km: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

const BudgetSettings: React.FC = () => {
  const { profile } = useAuth();
  const [budgets, setBudgets] = useState<EmployeeBudget[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeBudget, setActiveBudget] = useState<EmployeeBudget | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    monthly_budget: '',
    reimbursement_rate_per_km: ''
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchBudgets();
      fetchEmployees();
    }
  }, [profile]);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_budgets')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setBudgets(data || []);
    } catch (err: any) {
      toast.error('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id,name')
        .eq('role', 'employee')
        .eq('is_active', true);
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      toast.error('Failed to fetch employees');
    }
  };

  const handleSave = async () => {
    if (!formData.employee_id || !formData.monthly_budget || !formData.reimbursement_rate_per_km) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      if (isEditing && activeBudget) {
        // Update
        const { error } = await supabase
          .from('employee_budgets')
          .update({
            monthly_budget: parseFloat(formData.monthly_budget),
            reimbursement_rate_per_km: parseFloat(formData.reimbursement_rate_per_km),
            updated_at: new Date().toISOString()
          })
          .eq('id', activeBudget.id);
        if (error) throw error;
        toast.success('Budget updated successfully');
      } else {
        // Create
        const { error } = await supabase
          .from('employee_budgets')
          .insert({
            employee_id: formData.employee_id,
            monthly_budget: parseFloat(formData.monthly_budget),
            reimbursement_rate_per_km: parseFloat(formData.reimbursement_rate_per_km),
            spent_amount: 0
          });
        if (error) throw error;
        toast.success('Budget created successfully');
      }
      setIsDialogOpen(false);
      fetchBudgets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try {
      const { error } = await supabase
        .from('employee_budgets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Budget deleted');
      fetchBudgets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openDialog = () => {
    setIsEditing(false);
    setActiveBudget(null);
    setFormData({ employee_id: '', monthly_budget: '', reimbursement_rate_per_km: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (budget: EmployeeBudget) => {
    setIsEditing(true);
    setActiveBudget(budget);
    setFormData({
      employee_id: budget.employee_id,
      monthly_budget: budget.monthly_budget.toString(),
      reimbursement_rate_per_km: budget.reimbursement_rate_per_km.toString()
    });
    setIsDialogOpen(true);
  };

  const usagePercent = (spent: number, limit: number) => {
    return limit > 0 ? (spent / limit) * 100 : 0;
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Only admins can access budget settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            Expense Budget Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure employee budgets and reimbursement rates</p>
        </div>
        <Button onClick={openDialog} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Budgets</CardTitle>
          <CardDescription>Allocated monthly expenses and reimbursement rates</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-slate-400">Loading...</div>
          ) : budgets.length === 0 ? (
            <div className="p-6 text-center text-slate-400">No budgets configured. Click "Add Budget" to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Monthly Budget</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Rate/km</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => {
                    const usage = usagePercent(budget.spent_amount, budget.monthly_budget);
                    const statusColor = usage > 90 ? 'text-red-600' : usage > 70 ? 'text-amber-600' : 'text-green-600';
                    return (
                      <TableRow key={budget.id} className="hover:bg-slate-50">
                        <TableCell className="font-semibold">{budget.employee_name}</TableCell>
                        <TableCell>₹{budget.monthly_budget.toLocaleString()}</TableCell>
                        <TableCell className={statusColor}>₹{budget.spent_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all',
                                usage > 90 ? 'bg-red-500' : usage > 70 ? 'bg-amber-500' : 'bg-green-500'
                              )}
                              style={{ width: `${Math.min(usage, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{usage.toFixed(1)}%</p>
                        </TableCell>
                        <TableCell>₹{budget.reimbursement_rate_per_km}/km</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(budget)}
                              className="h-8"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(budget.id)}
                              className="h-8 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Budget' : 'Add Employee Budget'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the budget and reimbursement rate' : 'Set monthly budget and reimbursement rate for an employee'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!isEditing && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Budget (₹)</label>
              <Input
                type="number"
                value={formData.monthly_budget}
                onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                placeholder="e.g., 50000"
                min="0"
                step="100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reimbursement Rate (₹/km)</label>
              <Input
                type="number"
                value={formData.reimbursement_rate_per_km}
                onChange={(e) => setFormData({ ...formData, reimbursement_rate_per_km: e.target.value })}
                placeholder="e.g., 5"
                min="0"
                step="0.1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetSettings;
