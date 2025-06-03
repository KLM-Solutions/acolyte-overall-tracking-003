'use client';
import { useState, useEffect } from 'react';
import { Loader, ChevronDown, ChevronRight, Filter, ChevronUp, Download } from 'lucide-react';
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

type SortField = 'date' | 'agent' | 'conversation_count' | 'start_time' | 'end_time' | 'duration';
type SortOrder = 'asc' | 'desc';

// Color palette for agents
const agentColors: Record<string, { bg: string; text: string }> = {
  '101- Block 3 - Practice Session': {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-800 dark:text-blue-100'
  },
  '101 - Block 5 - Practice Session': {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-100'
  },
  '101 - Block 9 - Practice Session': {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-800 dark:text-purple-100'
  },
  '101 - Block 12 - Practice (Workplace Sim)': {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-800 dark:text-yellow-100'
  },
  '103- Block 3 - Practice Session': {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-100'
  },
  '103 - Block 5 - Practice Session': {
    bg: 'bg-indigo-100 dark:bg-indigo-900',
    text: 'text-indigo-800 dark:text-indigo-100'
  },
  '103 - Block 7 - Practice Session': {
    bg: 'bg-pink-100 dark:bg-pink-900',
    text: 'text-pink-800 dark:text-pink-100'
  },
  '103 - Block 10 - Practice (Workplace Sim)': {
    bg: 'bg-orange-100 dark:bg-orange-900',
    text: 'text-orange-800 dark:text-orange-100'
  },
  '103-workplace-sim-nondiscrimination-testing': {
    bg: 'bg-teal-100 dark:bg-teal-900',
    text: 'text-teal-800 dark:text-teal-100'
  }
};

// Default color for any agent not in the palette
const defaultColor = {
  bg: 'bg-gray-100 dark:bg-gray-800',
  text: 'text-gray-800 dark:text-gray-100'
};

const getAgentColor = (agent: string) => {
  return agentColors[agent] || defaultColor;
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<SessionMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        if (data.success) {
          setMetrics(data.data);
          const uniqueAgents = Array.from(new Set(data.data.map((item: SessionMetrics) => item.agent))) as string[];
          setAgents(uniqueAgents);
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

  const calculateDuration = (startTime: string, endTime: string) => {
    // Convert 12-hour format to 24-hour format for proper calculation
    const convertTo24Hour = (time: string) => {
      const [timePart, period] = time.split(' ');
      let [hours, minutes, seconds] = timePart.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return new Date(1970, 0, 1, hours, minutes, seconds);
    };

    const start = convertTo24Hour(startTime);
    const end = convertTo24Hour(endTime);
    
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    return `${diffHours}h ${remainingMins}m`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortMetrics = (metrics: SessionMetrics[]) => {
    return [...metrics].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'agent':
          comparison = a.agent.localeCompare(b.agent);
          break;
        case 'conversation_count':
          comparison = a.conversation_count - b.conversation_count;
          break;
        case 'start_time':
          comparison = new Date(`1970-01-01T${a.start_time}`).getTime() - new Date(`1970-01-01T${b.start_time}`).getTime();
          break;
        case 'end_time':
          comparison = new Date(`1970-01-01T${a.end_time}`).getTime() - new Date(`1970-01-01T${b.end_time}`).getTime();
          break;
        case 'duration':
          const durationA = new Date(`1970-01-01T${a.end_time}`).getTime() - new Date(`1970-01-01T${a.start_time}`).getTime();
          const durationB = new Date(`1970-01-01T${b.end_time}`).getTime() - new Date(`1970-01-01T${b.start_time}`).getTime();
          comparison = durationA - durationB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const downloadCSV = () => {
    const headers = [
      'Session ID',
      'Date',
      'Agent',
      'Conversations',
      'Start Time',
      'End Time',
      'Duration',
      'Coming Soon 1',
      'Coming Soon 2'
    ];

    const csvData = filteredMetrics.map(metric => [
      metric.session_id,
      metric.date,
      metric.agent,
      metric.conversation_count,
      metric.start_time,
      metric.end_time,
      calculateDuration(metric.start_time, metric.end_time),
      metric.coming_soon_1,
      metric.coming_soon_2
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `metrics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    const jsonData = filteredMetrics.map(metric => ({
      session_id: metric.session_id,
      date: metric.date,
      agent: metric.agent,
      conversation_count: metric.conversation_count,
      start_time: metric.start_time,
      end_time: metric.end_time,
      duration: calculateDuration(metric.start_time, metric.end_time),
      coming_soon_1: metric.coming_soon_1,
      coming_soon_2: metric.coming_soon_2
    }));

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `metrics_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter metrics based on selected agent
  const filteredMetrics = metrics.filter(metric => 
    selectedAgent === 'all' || metric.agent === selectedAgent
  );

  const sortedMetrics = sortMetrics(filteredMetrics);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-900">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Metrics</h1>
            
            <div className="flex items-center space-x-4">
              {/* Download Buttons */}
              <button
                onClick={downloadCSV}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center space-x-2"
              >
                <Download size={20} />
                <span>Download CSV</span>
              </button>
              <button
                onClick={downloadJSON}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-2"
              >
                <Download size={20} />
                <span>Download JSON</span>
              </button>

              {/* Agent Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
                >
                  <Filter size={16} />
                  <span>
                    {selectedAgent === 'all' ? `All Agents (${agents.length})` : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentColor(selectedAgent).bg} ${getAgentColor(selectedAgent).text}`}>
                        {selectedAgent}
                      </span>
                    )}
                  </span>
                  {showAgentDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {showAgentDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSelectedAgent('all');
                          setShowAgentDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100 ${
                          selectedAgent === 'all' ? 'bg-blue-100 font-medium dark:bg-blue-900' : ''
                        }`}
                      >
                        All Agents
                      </button>
                      
                      {agents.map((agent) => (
                        <button
                          key={agent}
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowAgentDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100 ${
                            selectedAgent === agent ? 'bg-blue-100 font-medium dark:bg-blue-900' : ''
                          }`}
                        >
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentColor(agent).bg} ${getAgentColor(agent).text}`}>
                            {agent}
                          </span>
                          {selectedAgent === agent && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">(Selected)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                      Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('agent')}>
                      Agent {sortField === 'agent' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('conversation_count')}>
                      Conversations {sortField === 'conversation_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('start_time')}>
                      Start Time {sortField === 'start_time' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('end_time')}>
                      End Time {sortField === 'end_time' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('duration')}>
                      Duration {sortField === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coming Soon 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coming Soon 2</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {sortedMetrics.map((metric) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentColor(metric.agent).bg} ${getAgentColor(metric.agent).text}`}>
                            {metric.agent}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.conversation_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.start_time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.end_time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {calculateDuration(metric.start_time, metric.end_time)}
                        </td>
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