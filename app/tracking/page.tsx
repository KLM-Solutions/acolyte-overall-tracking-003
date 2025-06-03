'use client';
import { useState, useEffect } from 'react';
import { Loader, Clock, Hash, Search, ChevronDown, ChevronUp, Download, ChevronRight, Maximize2, X, Filter } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Conversation {
  id: number;
  session_id: string;
  conversation_data: Array<{
    question: string;
    response: string;
    timestamp: string;
  }>;
  timestamp: string;
  agent: string; // Added agent field
}

interface SessionModalProps {
  conversation: Conversation;
  onClose: () => void;
}

const SessionModal: React.FC<SessionModalProps> = ({ conversation, onClose }) => {
  const formatModalTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-95">
      <div className="bg-white rounded-lg w-11/12 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col dark:bg-gray-900">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            Session Details 
            <span className={`ml-3 px-2 py-1 text-sm rounded ${getAgentBadgeColor(conversation.agent)}`}>
              {conversation.agent}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 dark:bg-gray-900">
          {conversation.conversation_data.map((message, index) => (
            <div key={index}>
              <div className="border-l-4 border-blue-500 pl-4 dark:bg-gray-900">
                <div className="mb-2">
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">User question:</p>
                  <p className="text-gray-700 dark:text-gray-300">{message.question}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Generated response:</p>
                  <article className="prose prose-slate prose-lg max-w-none dark:prose-invert">
                    <ReactMarkdown>{message.response}</ReactMarkdown>
                  </article>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formatModalTimestamp(message.timestamp)}
                </p>
              </div>
              {index < conversation.conversation_data.length - 1 && (
                <div className="my-3 border-b border-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Function to get agent badge color based on agent name
const getAgentBadgeColor = (agentName: string) => {
  const colorMap: Record<string, string> = {
    '101 - Block 3 - Practice Session': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    '101 - Block 5 - Practice Session': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    '101 - Block 9 - Practice Session': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    '101 - Block 12 - Practice (Workplace Sim)': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    '103 - Block 3 - Practice Session': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    '103 - Block 5 - Practice Session': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
    '103 - Block 7 - Practice Session': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
    '103 - Block 10 - Practice (Workplace Sim)': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    '103-workplace-sim-nondiscrimination-testing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  };
  
  return colorMap[agentName] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'timestamp' | 'id'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [popoutSession, setPopoutSession] = useState<Conversation | null>(null);
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tracking?sortBy=${sortBy}&order=${sortOrder}&agent=${selectedAgent}`);
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
        if (data.agents) {
          setAgents(data.agents);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchConversations();
  }, [sortBy, sortOrder, selectedAgent]);
  
  const toggleSort = (field: 'timestamp' | 'id') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };
  
  const toggleSession = (sessionId: string) => {
    const newExpandedSessions = new Set(expandedSessions);
    if (expandedSessions.has(sessionId)) {
      newExpandedSessions.delete(sessionId);
    } else {
      newExpandedSessions.add(sessionId);
    }
    setExpandedSessions(newExpandedSessions);
  };
  
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    // Search in session ID
    if (conv.session_id.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    
    // Search in conversation data
    return conv.conversation_data.some(msg => 
      msg.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.response.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatSessionName = (timestamp: string) => {
    const date = new Date(timestamp);
    return `Session ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    })}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };

  const downloadCSV = () => {
    try {
      // Create CSV headers - include both UTC and Local time and agent info
      const headers = [
        'Session Date (Local)',
        'Session Date (UTC)',
        'Session ID',
        'Agent',
        'Question',
        'Response',
        'Timestamp (Local)',
        'Timestamp (UTC)'
      ];
      
      // Format data for CSV with both UTC and local timestamps
      const csvData = conversations.flatMap(conversation => 
        conversation.conversation_data.map(message => {
          const sessionDate = new Date(conversation.timestamp);
          const messageDate = new Date(message.timestamp);
          
          return [
            sessionDate.toLocaleString(),
            conversation.timestamp,
            conversation.session_id,
            conversation.agent || 'Unknown',
            message.question.replace(/"/g, '""'),
            message.response.replace(/"/g, '""'),
            messageDate.toLocaleString(),
            message.timestamp
          ];
        })
      );
      
      // Combine headers and data
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and trigger download with UTC date in filename
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const utcDate = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `conversation_data_UTC_${utcDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const downloadJSON = () => {
    try {
      // Format data for JSON export
      const jsonData = conversations.map(conversation => ({
        session_id: conversation.session_id,
        timestamp: conversation.timestamp,
        agent: conversation.agent || 'Unknown',
        conversation_data: conversation.conversation_data.map(message => ({
          question: message.question,
          response: message.response,
          timestamp: message.timestamp
        }))
      }));

      // Create and trigger download with UTC date in filename
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const utcDate = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `conversation_data_UTC_${utcDate}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading JSON:', error);
    }
  };

  // Calculate total agent count for dropdown display
  const agentCount = agents.length;

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-2 sm:py-8 sm:px-6 lg:px-8 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-3 sm:p-6 dark:bg-gray-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Tracking user Conversation</h1>
            <div className="flex flex-wrap gap-2 sm:gap-4">
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
              <Link
                href="/metrics"
                className="flex-1 sm:flex-none bg-purple-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-purple-600 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base"
              >
                <Hash size={14} className="sm:w-5 sm:h-5 w-4 h-4" />
                <span>Metrics</span>
              </Link>
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Agent Filter Dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  className="w-full sm:w-auto flex items-center justify-between space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <Filter size={14} className="sm:w-4 sm:h-4 w-3 h-3" />
                    <span className="truncate">
                      {selectedAgent === 'all' ? `Agents (${agentCount})` : selectedAgent}
                    </span>
                  </div>
                  {showAgentDropdown ? <ChevronUp size={14} className="sm:w-4 sm:h-4 w-3 h-3" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4 w-3 h-3" />}
                </button>
                
                {showAgentDropdown && (
                  <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200 dark:bg-gray-900 dark:border-gray-700 max-h-[60vh] overflow-y-auto">
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
                          <span className="truncate block">{agent}</span>
                          {selectedAgent === agent && <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">(Selected)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sort controls */}
              <button
                onClick={() => toggleSort('timestamp')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm ${
                  sortBy === 'timestamp' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
                }`}
              >
                <Clock size={14} className="sm:w-4 sm:h-4 w-3 h-3" />
                <span>Time</span>
                {sortBy === 'timestamp' && (
                  sortOrder === 'ASC' ? <ChevronUp size={14} className="sm:w-4 sm:h-4 w-3 h-3" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4 w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => toggleSort('id')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm ${
                  sortBy === 'id' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
                }`}
              >
                <Hash size={14} className="sm:w-4 sm:h-4 w-3 h-3" />
                <span>Sequence</span>
                {sortBy === 'id' && (
                  sortOrder === 'ASC' ? <ChevronUp size={14} className="sm:w-4 sm:h-4 w-3 h-3" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4 w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Conversations List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.session_id}
                  className={`border border-gray-200 rounded-lg p-3 sm:p-4 transition-all duration-200 dark:border-gray-700 ${
                    expandedSessions.has(conversation.session_id) 
                      ? 'ring-2 ring-blue-500 shadow-lg dark:ring-blue-400 dark:bg-gray-800' 
                      : 'hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0"
                  >
                    <div 
                      className="flex items-start sm:items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => toggleSession(conversation.session_id)}
                    >
                      <ChevronRight 
                        className={`transform transition-transform duration-200 mt-1 sm:mt-0 ${
                          expandedSessions.has(conversation.session_id) 
                            ? 'rotate-90 text-blue-500' 
                            : 'text-gray-400'
                        }`}
                        size={16}
                      />
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 flex flex-wrap items-center gap-2 dark:text-gray-100">
                          {formatSessionName(conversation.timestamp)}
                          <span className={`px-2 py-1 text-xs rounded ${getAgentBadgeColor(conversation.agent)}`}>
                            {conversation.agent}
                          </span>
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                          Session ID: {conversation.session_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-7 sm:ml-0">
                      <span className="text-xs sm:text-sm text-gray-500">
                        {conversation.conversation_data.length} messages
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopoutSession(conversation);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Open in popup"
                      >
                        <Maximize2 size={16} className="text-gray-500 hover:text-blue-500" />
                      </button>
                    </div>
                  </div>

                  {expandedSessions.has(conversation.session_id) && (
                    <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700 dark:bg-gray-900 p-2 rounded-lg">
                      {conversation.conversation_data.map((message, index) => (
                        <div key={index}>
                          <div className="border-l-4 border-blue-500 pl-4 dark:bg-gray-900">
                            <div className="mb-2">
                              <p className="font-bold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">User question:</p>
                              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{message.question}</p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">Generated response:</p>
                              <article className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{message.response}</ReactMarkdown>
                              </article>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {formatTimestamp(message.timestamp)}
                            </p>
                          </div>
                          {index < conversation.conversation_data.length - 1 && (
                            <div className="my-3 border-b border-gray-200" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popup Modal */}
      {popoutSession && (
        <SessionModal conversation={popoutSession} onClose={() => setPopoutSession(null)} />
      )}
    </div>
  );
}
