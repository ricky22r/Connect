import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Lead } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const LeadsWithErrorHandling: React.FC = () => {
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const fetchLeads = useCallback(async (attemptNum = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`[FieldBoy] Attempt ${attemptNum}/${MAX_RETRIES} to fetch leads...`);

      // Verify user is field_boy role
      if (!user || profile?.role !== 'field_boy') {
        throw new Error('Unauthorized: Only field_boy role can access this data');
      }

      // Step 1: Check Supabase connection
      const { data: connectionTest, error: connError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (connError) {
        throw new Error(`Database connection failed: ${connError.message}`);
      }

      // Step 2: Fetch Interested leads (field boy's focus)
      const { data: fetchedLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Interested')
        .order('important', { ascending: false })
        .order('created_date', { ascending: false })
        .timeout(10000); // 10 second timeout

      if (leadsError) {
        throw new Error(`Failed to fetch leads: ${leadsError.message}`);
      }

      if (!Array.isArray(fetchedLeads)) {
        throw new Error('Invalid response format from database');
      }

      // Step 3: Fetch employee names for enrichment
      const { data: employees, error: empError } = await supabase
        .from('user_profiles')
        .select('id,name')
        .timeout(5000);

      if (empError) {
        console.warn('Could not fetch employee names:', empError);
        // Continue without names - don't fail entire operation
      }

      // Build employee map
      const empMap: Record<string, string> = {};
      if (Array.isArray(employees)) {
        employees.forEach((emp: any) => {
          empMap[emp.id] = emp.name;
        });
      }

      setLeads(fetchedLeads || []);
      setRetryCount(0);
      
      if (fetchedLeads && fetchedLeads.length > 0) {
        toast.success(`Loaded ${fetchedLeads.length} leads`);
      } else {
        toast.info('No leads available for closure');
      }

    } catch (err: any) {
      console.error('[FieldBoy] Error:', err);
      setError(err.message);
      
      // Retry logic
      if (attemptNum < MAX_RETRIES) {
        const delayMs = Math.pow(2, attemptNum - 1) * 1000; // Exponential backoff
        toast.error(`Error: ${err.message}. Retrying in ${delayMs / 1000}s...`);
        setTimeout(() => {
          setRetryCount(attemptNum);
          fetchLeads(attemptNum + 1);
        }, delayMs);
      } else {
        toast.error(`Unable to fetch data after ${MAX_RETRIES} attempts. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  useEffect(() => {
    if (user?.id) {
      fetchLeads();
    }
  }, [user?.id, fetchLeads]);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Unable to Fetch Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              {retryCount < MAX_RETRIES && (
                <p className="text-xs text-red-600 mt-2">Retry attempt {retryCount} of {MAX_RETRIES}...</p>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => {
                    setRetryCount(0);
                    fetchLeads(1);
                  }}
                  className="bg-red-600 hover:bg-red-700 gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="animate-spin"><RefreshCw className="h-5 w-5" /></div>
            <span>Loading leads...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Available Leads for Closure</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No leads available for closure</p>
          ) : (
            <p className="text-sm text-slate-600">{leads.length} leads loaded successfully</p>
          )}
        </CardContent>
      </Card>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fetchLeads(1)}
        className="gap-1"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh Data
      </Button>
    </div>
  );
};

export default LeadsWithErrorHandling;
