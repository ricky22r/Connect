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
import { AlertCircle, Plus, Trash2, Car, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Expense {
  id: string;
  user_id: string;
  expense_type: string;
  amount: number;
  distance_km?: number;
  description: string;
  created_at: string;
}

interface EmployeeBudget {
  monthly_budget: number;
  spent_amount: number;
  reimbursement_rate_per_km: number;
}

const EmployeeExpensesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<EmployeeBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    expense_type: 'conveyance',
    amount: '',
    distance_km: '',
    description: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchExpenses();
      fetchBudget();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (err: any) {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudget = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_budgets')
        .select('*')
        .eq('employee_id', user?.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found (expected)
      setBudget(data);
    } catch (err: any) {
      console.warn('No budget configured for this employee');
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount) {
      toast.error('Please enter an amount');
      return;
    }

    // Validate budget limit
    if (budget) {
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const newTotal = totalExpenses + parseFloat(formData.amount);
      
      if (newTotal > budget.monthly_budget) {
        toast.error(
          `Expense limit exceeded. You have ₹${(budget.monthly_budget - totalExpenses).toLocaleString()} remaining. Please contact Admin.`,
          { duration: 5000 }
        );
        return;
      }
    }

    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: user?.id,
        expense_type: formData.expense_type,
        amount: parseFloat(formData.amount),
        distance_km: formData.distance_km ? parseFloat(formData.distance_km) : null,
        description: formData.description
      });
      if (error) throw error;
      toast.success('Expense submitted successfully');
      setIsDialogOpen(false);
      setFormData({ expense_type: 'conveyance', amount: '', distance_km: '', description: '' });
      fetchExpenses();
      fetchBudget();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Expense deleted');
      fetchExpenses();
      fetchBudget();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = budget ? budget.monthly_budget - totalSpent : 0;
  const usagePercent = budget ? (totalSpent / budget.monthly_budget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            My Expenses
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track your conveyance and business expenses</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Budget Summary Card */}
      {budget && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Budget</p>
              <p className="text-2xl font-bold text-blue-600">₹{budget.monthly_budget.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className={cn(usagePercent > 90 ? 'border-red-200' : usagePercent > 70 ? 'border-amber-200' : 'border-green-200')}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Spent</p>
              <p className={cn('text-2xl font-bold', usagePercent > 90 ? 'text-red-600' : usagePercent > 70 ? 'text-amber-600' : 'text-green-600')}>
                ₹{totalSpent.toLocaleString()}
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{usagePercent.toFixed(1)}% used</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Remaining</p>
              <p className="text-2xl font-bold text-emerald-600">₹{Math.max(remaining, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>All your submitted expenses</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-slate-400">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <Wallet className="h-10 w-10 mx-auto mb-2 opacity-20" />
              No expenses yet. Click "Add Expense" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm">{format(new Date(expense.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {expense.expense_type === 'conveyance' ? '🚗 Conveyance' : expense.expense_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{expense.description || '—'}</TableCell>
                      <TableCell className="text-sm">{expense.distance_km ? `${expense.distance_km} km` : '—'}</TableCell>
                      <TableCell className="text-right font-semibold">₹{expense.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(expense.id)}
                          className="h-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Add Expense
            </DialogTitle>
            <DialogDescription>
              Submit your conveyance or business expenses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Expense Type</label>
              <select
                value={formData.expense_type}
                onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="conveyance">Conveyance (Vehicle)</option>
                <option value="travel">Travel & Accommodation</option>
                <option value="meals">Meals & Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
            {formData.expense_type === 'conveyance' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Distance (km)</label>
                <Input
                  type="number"
                  value={formData.distance_km}
                  onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                  placeholder="e.g., 50"
                  min="0"
                  step="1"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g., 500"
                min="0"
                step="10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Office to client meeting"
              />
            </div>
            {budget && remaining < 5000 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Approaching limit</p>
                  <p className="text-xs text-amber-700">You have ₹{remaining.toLocaleString()} remaining</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Submit Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeExpensesPage;
