'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestRPCPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testRPC = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test with the company ID from our local database
      const { data: result, error: rpcError } = await supabase
        .rpc('get_company_team_members', { 
          company_id_param: 'ea25ff5d-409d-4764-8983-b69ae1fe8dd6' 
        });

      if (rpcError) {
        setError(`RPC Error: ${rpcError.message}`);
        return;
      }

      setData(result);
      console.log('RPC Result:', result);
    } catch (err) {
      setError(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test RPC Function</h1>
      
      <button 
        onClick={testRPC}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test get_company_team_members RPC'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">RPC Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Summary:</h3>
            <ul className="list-disc list-inside">
              <li>Total members: {data.length}</li>
              <li>Active members: {data.length}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
