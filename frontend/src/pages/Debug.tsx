import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const Debug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      localStorage: {
        token: localStorage.getItem('token'),
        hasToken: !!localStorage.getItem('token'),
      },
      apiConfig: {
        baseURL: api.defaults.baseURL,
        headers: api.defaults.headers,
      },
      testRequest: null as any,
    };

    // Test API request
    api.get('/dashboard')
      .then(response => {
        info.testRequest = {
          success: true,
          status: response.status,
          data: response.data,
          headers: response.config.headers,
        };
        setDebugInfo(info);
      })
      .catch(error => {
        info.testRequest = {
          success: false,
          status: error.response?.status,
          message: error.message,
          headers: error.config?.headers,
          response: error.response?.data,
        };
        setDebugInfo(info);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">localStorage</h2>
          <pre className="bg-white dark:bg-gray-900 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo.localStorage, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">API Configuration</h2>
          <pre className="bg-white dark:bg-gray-900 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo.apiConfig, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Test API Request</h2>
          {debugInfo.testRequest ? (
            <pre className="bg-white dark:bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo.testRequest, null, 2)}
            </pre>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}; 