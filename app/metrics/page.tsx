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
  try_count: string;
  score_summary: string;
  conversation_data: ConversationData[];
}

type SortField = 'session_id' | 'date' | 'agent' | 'conversation_count' | 'start_time' | 'end_time' | 'duration';
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
  const [isProcessingLLM, setIsProcessingLLM] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const processConversationWithLLM = async (conversationData: ConversationData[]) => {
    try {
      const prompt = `For this conversation, help me deduce the following metrics or data.
1. Extract how many number of tries the user had to reach a perfect response or their own satisfactory response or till end of conversation.
2. Extract the scores the user scored in each try. For reference, the scores are on a 8 point or 16 point scale. Ensure to not process the actual prompt explaining the scoring rubric. For reference, the data to look for will be like "Total Score:" If Total Score is not available, return null.

Provide the output in this exact format:
try_count: [number of tries]
score_summary: [scores for each try]

Example output:
try_count: 3
score_summary: try 1, score 4/8; try 2, score 6/8; try 3, score 7/8

If no tries or scores are available, return:
try_count: 0
score_summary: null

Conversation data:
${JSON.stringify(conversationData, null, 2)}`;

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get LLM response');
      }

      const data = await response.json();
      
      // Parse the response to extract try_count and score_summary
      const tryCountMatch = data.response.match(/try_count:\s*(\d+|null)/);
      const scoreSummaryMatch = data.response.match(/score_summary:\s*(.*?)(?=\n|$)/);
      
      const tryCount = tryCountMatch ? tryCountMatch[1] : 'null';
      const scoreSummary = scoreSummaryMatch ? scoreSummaryMatch[1].trim() : 'null';

      return {
        try_count: tryCount,
        score_summary: scoreSummary
      };
    } catch (error) {
      console.error('Error processing conversation with LLM:', error);
      return {
        try_count: 'null',
        score_summary: 'null'
      };
    }
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        if (data.success) {
          // Sort by date
          const sortedData = data.data.sort((a: SessionMetrics, b: SessionMetrics) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          // Process all conversations with LLM
          setIsProcessingLLM(true);
          const processedData = await Promise.all(
            sortedData.map(async (metric: SessionMetrics) => {
              const llmResponse = await processConversationWithLLM(metric.conversation_data);
              return {
                ...metric,
                try_count: llmResponse.try_count,
                score_summary: llmResponse.score_summary,
              };
            })
          );

          setMetrics(processedData);
          const uniqueAgents = Array.from(new Set(processedData.map((item: SessionMetrics) => item.agent))) as string[];
          setAgents(uniqueAgents);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
        setIsProcessingLLM(false);
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
      'Try Count',
      'Score Summary'
    ];

    const csvData = filteredMetrics.map(metric => [
      metric.session_id,
      metric.date,
      metric.agent,
      metric.conversation_count,
      metric.start_time,
      metric.end_time,
      calculateDuration(metric.start_time, metric.end_time),
      metric.try_count,
      metric.score_summary
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
      try_count: metric.try_count,
      score_summary: metric.score_summary
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
    <div className="min-h-screen bg-gray-100 py-4 px-2 sm:py-8 sm:px-6 lg:px-8 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-3 sm:p-6 dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Session Metrics</h1>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4 w-full sm:w-auto">
              {/* Download Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={downloadCSV}
                  className="flex-1 sm:flex-none bg-green-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-green-600 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base"
                >
                  <Download size={14} className="sm:w-5 sm:h-5 w-4 h-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={downloadJSON}
                  className="flex-1 sm:flex-none bg-blue-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-blue-600 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base"
                >
                  <Download size={14} className="sm:w-5 sm:h-5 w-4 h-4" />
                  <span>JSON</span>
                </button>
              </div>

              {/* Agent Filter Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  className="w-full sm:w-auto flex items-center justify-between space-x-2 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 text-sm sm:text-base"
                >
                  <div className="flex items-center space-x-2">
                    <Filter size={16} />
                    <span className="truncate">
                      {selectedAgent === 'all' ? `All Agents (${agents.length})` : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentColor(selectedAgent).bg} ${getAgentColor(selectedAgent).text}`}>
                          {selectedAgent}
                        </span>
                      )}
                    </span>
                  </div>
                  {showAgentDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {showAgentDropdown && (
                  <div className="absolute right-0 mt-2 w-full sm:w-72 bg-white rounded-md shadow-lg z-10 border border-gray-200 dark:bg-gray-900 dark:border-gray-700 max-h-[60vh] overflow-y-auto">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSelectedAgent('all');
                          setShowAgentDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100 text-sm ${
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
                          className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100 text-sm ${
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
          
          {isLoading || isProcessingLLM ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
              {isProcessingLLM && (
                <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">Processing conversations with LLM...</span>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="w-10 px-3 sm:px-6 py-3"></th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('session_id')}>
                          Session ID {sortField === 'session_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                          Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('agent')}>
                          Agent {sortField === 'agent' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('conversation_count')}>
                          Threads {sortField === 'conversation_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('start_time')}>
                          Start {sortField === 'start_time' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('end_time')}>
                          End {sortField === 'end_time' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('duration')}>
                          Duration {sortField === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Try Count</th>
                        <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
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
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              {expandedRows.has(metric.session_id) ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.session_id}</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.date}</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentColor(metric.agent).bg} ${getAgentColor(metric.agent).text}`}>
                                {metric.agent}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.conversation_count}</td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.start_time}</td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.end_time}</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {calculateDuration(metric.start_time, metric.end_time)}
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.try_count}</td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{metric.score_summary}</td>
                          </tr>
                          {expandedRows.has(metric.session_id) && (
                            <tr>
                              <td colSpan={9} className="px-3 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="text-sm">
                                      <span className="font-medium">Start Time:</span> {metric.start_time}
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium">End Time:</span> {metric.end_time}
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium">Try Count:</span> {metric.try_count}
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium">Score Summary:</span> {metric.score_summary}
                                    </div>
                                  </div>
                                  {metric.conversation_data?.map((conversation, index) => (
                                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                                      <div className="mb-2">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">User question:</p>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">{conversation.question}</p>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 