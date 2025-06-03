'use client';
import { useState, useEffect } from 'react';
import { Loader, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ConversationData {
  question: string;
  response: string;
  timestamp: string;
}

interface SessionMetrics {
  session_id: string;
  date: string;
  agent: string;
  conversation_count: number;
  start_time: string;
  end_time: string;
  coming_soon_1: string;
  coming_soon_2: string;
  conversation_data: ConversationData[];
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<SessionMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        if (data.success) {
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const toggleRow = (sessionId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(sessionId)) {
      newExpandedRows.delete(sessionId);
    } else {
      newExpandedRows.add(sessionId);
    }
    setExpandedRows(newExpandedRows);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-900">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Session Metrics</h1>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-10 px-6 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Session ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Conversations</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coming Soon 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coming Soon 2</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {metrics.map((metric) => (
                    <>
                      <tr 
                        key={metric.session_id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => toggleRow(metric.session_id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {expandedRows.has(metric.session_id) ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.session_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.agent}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.conversation_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.start_time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.end_time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.coming_soon_1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.coming_soon_2}</td>
                      </tr>
                      {expandedRows.has(metric.session_id) && (
                        <tr>
                          <td colSpan={9} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                            <div className="space-y-4">
                              {metric.conversation_data?.map((conversation, index) => (
                                <div key={index} className="border-l-4 border-blue-500 pl-4">
                                  <div className="mb-2">
                                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">User question:</p>
                                    <p className="text-gray-700 dark:text-gray-300">{conversation.question}</p>
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Generated response:</p>
                                    <article className="prose prose-sm max-w-none dark:prose-invert">
                                      <ReactMarkdown>{conversation.response}</ReactMarkdown>
                                    </article>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {formatTimestamp(conversation.timestamp)}
                                  </p>
                                  {index < metric.conversation_data.length - 1 && (
                                    <div className="my-3 border-b border-gray-200 dark:border-gray-700" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 