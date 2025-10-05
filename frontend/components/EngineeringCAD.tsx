'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PYTHON_TEMPLATE, SYSTEM_PROMPT_ANALYSIS, SYSTEM_PROMPT_CODE_GEN } from '@/lib/constants';

// Dynamically import Monaco Editor and DXF Viewer (client-side only)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const DXFViewer = dynamic(() => import('./DXFViewer'), { ssr: false });

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Status {
  stage: 'idle' | 'analyzing' | 'generating' | 'executing' | 'fixing' | 'success' | 'error';
  message: string;
}

interface Stats {
  entities: number;
  layers: number;
  bounds?: {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
  };
}

export default function EngineeringCAD() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<Status>({ stage: 'idle', message: 'Ready' });
  const [pythonCode, setPythonCode] = useState(PYTHON_TEMPLATE);
  const [dxf, setDxf] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const callClaude = async (
    userMessage: string,
    systemPrompt: string,
    isCodeGen: boolean = false,
    errorContext: string | null = null
  ): Promise<string> => {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage,
        systemPrompt,
        isCodeGen,
        conversationHistory,
        errorContext
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to call Claude API');
    }

    const data = await response.json();
    
    // Update conversation history
    setConversationHistory(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: data.content }
    ]);

    return data.content;
  };

  const executeDXFCode = async (fullCode: string, attempt: number = 1, maxAttempts: number = 3): Promise<any> => {
    setStatus({ stage: 'executing', message: `Executing DXF code (attempt ${attempt}/${maxAttempts})...` });
    setExecutionLog(prev => [...prev, `Attempt ${attempt}/${maxAttempts}: Executing code...`]);
    
    try {
      const response = await fetch('/api/execute-dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode, max_retries: 1 })
      });

      const result = await response.json();
      
      if (result.success) {
        setDxf(result.dxf);
        setStats(result.stats);
        setError('');
        setExecutionLog(prev => [...prev, `✓ Success: Generated ${result.stats.entities} entities in ${result.stats.layers} layers`]);
        setStatus({ stage: 'success', message: 'DXF generated successfully!' });
        return { success: true, result };
      } else {
        setExecutionLog(prev => [...prev, `✗ Error: ${result.error}`]);
        
        // If we have retries left, try to fix the code
        if (attempt < maxAttempts) {
          setStatus({ stage: 'fixing', message: 'Code error detected, fixing...' });
          setExecutionLog(prev => [...prev, `Asking Claude to fix the error...`]);
          
          // Ask Claude to fix the error
          const fixedCode = await callClaude(
            fullCode,  // Send the full code context for fixing
            SYSTEM_PROMPT_CODE_GEN,
            true,
            result.error
          );
          
          // Extract code from response
          const codeMatch = fixedCode.match(/```python\n([\s\S]*?)```/) || fixedCode.match(/```\n([\s\S]*?)```/);
          const extractedCode = codeMatch ? codeMatch[1] : fixedCode;
          
          const fixedFullCode = PYTHON_TEMPLATE + '\n' + extractedCode;
          setPythonCode(fixedFullCode);
          
          // Retry execution
          return await executeDXFCode(fixedFullCode, attempt + 1, maxAttempts);
        }
        
        setError(result.error);
        setStatus({ stage: 'error', message: 'Failed to generate DXF after all retries' });
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      setExecutionLog(prev => [...prev, `✗ Exception: ${err.message}`]);
      setError(err.message);
      setStatus({ stage: 'error', message: 'Failed to connect to backend' });
      return { success: false, error: err.message };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsProcessing(true);
    setExecutionLog([]);
    setError('');

    try {
      // Step 1: Analyze the engineering problem
      setStatus({ stage: 'analyzing', message: 'Analyzing engineering requirements...' });
      const analysisResponse = await callClaude(userMessage, SYSTEM_PROMPT_ANALYSIS, false);
      addMessage('assistant', analysisResponse);

      // Check if Claude is asking for more information
      if (analysisResponse.toLowerCase().includes('could you') || 
          analysisResponse.toLowerCase().includes('please provide') ||
          analysisResponse.toLowerCase().includes('what is') ||
          analysisResponse.toLowerCase().includes('clarify')) {
        setStatus({ stage: 'idle', message: 'Waiting for more information...' });
        setIsProcessing(false);
        return;
      }

      // Step 2: Generate Python code
      setStatus({ stage: 'generating', message: 'Generating Python code...' });
      const codePrompt = `Based on this engineering analysis, generate Python code using ezdxf to create the CAD drawing.

Analysis:
${analysisResponse}

Requirements:
- Add code ONLY after the "# ========== DRAWING SECTION - EDIT BELOW ==========" line
- Use DRAWING_AREA constants for positioning
- Include all dimensions
- Add proper annotations and labels
- Use appropriate layers
- Generate complete, production-ready code

Return ONLY the Python code to add after the drawing section marker, wrapped in \`\`\`python blocks.`;

      const codeResponse = await callClaude(codePrompt, SYSTEM_PROMPT_CODE_GEN, true);

      // Extract Python code from response
      const codeMatch = codeResponse.match(/```python\n([\s\S]*?)```/) || codeResponse.match(/```\n([\s\S]*?)```/);
      const extractedCode = codeMatch ? codeMatch[1] : codeResponse;

      const fullCode = PYTHON_TEMPLATE + '\n' + extractedCode;
      setPythonCode(fullCode);

      // Step 3: Execute the code with retry logic
      await executeDXFCode(fullCode);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
      setStatus({ stage: 'error', message: err.message });
      addMessage('assistant', `Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setPythonCode(value);
    }
  };

  const handleRegenerate = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setExecutionLog([]);
    setError('');

    try {
      // Use the full code from Monaco editor (user may have edited it)
      await executeDXFCode(pythonCode);
    } catch (err: any) {
      setError(err.message);
      setStatus({ stage: 'error', message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadDXF = () => {
    if (!dxf) return;
    
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engineering-cad-${Date.now()}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = () => {
    switch (status.stage) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'idle': return 'bg-gray-500';
      default: return 'bg-blue-500 status-pulse';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Engineering CAD AI</h1>
            <p className="text-sm text-gray-400">Production-grade engineering analysis and DXF generation</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
              <span className="text-sm text-gray-300">{status.message}</span>
            </div>
            {stats && (
              <div className="text-sm text-gray-400">
                {stats.entities} entities | {stats.layers} layers
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Chat */}
        <div className="w-1/3 flex flex-col border-r border-gray-700 bg-gray-850">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <h2 className="text-xl font-semibold mb-2">Welcome to Engineering CAD AI</h2>
                <p className="text-sm">Describe your engineering problem and I'll generate a CAD drawing for you.</p>
                <div className="mt-6 text-left max-w-md mx-auto space-y-2 text-xs">
                  <p className="font-semibold text-gray-400">Example prompts:</p>
                  <p className="text-gray-500">• Design a simply supported beam 5 meters long with a 10kN point load at center</p>
                  <p className="text-gray-500">• Create a rectangular steel plate 200mm x 150mm with 4 mounting holes</p>
                  <p className="text-gray-500">• Draw a cantilever beam with dimensions and load diagram</p>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="text-left">
                <div className="inline-block p-3 rounded-lg bg-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="spinner"></div>
                    <span className="text-sm text-gray-300">{status.message}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Execution Log */}
          {executionLog.length > 0 && (
            <div className="border-t border-gray-700 p-3 bg-gray-800 max-h-32 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-400 mb-1">Execution Log:</p>
              {executionLog.map((log, idx) => (
                <p key={idx} className="text-xs text-gray-500 font-mono">{log}</p>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="border-t border-gray-700 p-4 bg-gray-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your engineering problem..."
                disabled={isProcessing}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isProcessing || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Middle Panel: Code Editor */}
        <div className="w-1/3 flex flex-col bg-gray-900">
          <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-gray-300">Python Code (ezdxf)</h2>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isProcessing || !pythonCode}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Regenerate DXF'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language="python"
              theme="vs-dark"
              value={pythonCode}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
              }}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
            />
          </div>
        </div>

        {/* Right Panel: DXF Viewer */}
        <div className="w-1/3 flex flex-col bg-gray-850">
          <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-gray-300">DXF Preview</h2>
            <button
              onClick={downloadDXF}
              disabled={!dxf}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50"
            >
              Download DXF
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-red-300 mb-2">Error:</p>
                <pre className="text-xs text-red-200 whitespace-pre-wrap font-mono">{error}</pre>
              </div>
            )}
            {dxf ? (
              <DXFViewer dxfContent={dxf} stats={stats || undefined} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">No DXF generated yet</p>
                  <p className="text-xs mt-2">Describe an engineering problem to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

