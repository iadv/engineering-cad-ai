'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PYTHON_TEMPLATE, SYSTEM_PROMPT_ANALYSIS, SYSTEM_PROMPT_CODE_GEN, SYSTEM_PROMPT_DESIGN_SUMMARY } from '@/lib/constants';
import DesignSummary from './DesignSummary';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Loader2, Send, Download, ChevronRight, Code2, RefreshCw, Sparkles, Ruler, FileCode } from 'lucide-react';
import IllustrationViewer from './IllustrationViewer';

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
  const [showPythonCode, setShowPythonCode] = useState(false);
  const [designSummary, setDesignSummary] = useState<any>(null);
  const [illustrations, setIllustrations] = useState<Array<{ viewType: string; image: string; label: string }>>([]);
  const [isGeneratingIllustrations, setIsGeneratingIllustrations] = useState(false);
  
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

  const generateDesignSummary = async (analysisText: string, userPrompt: string) => {
    try {
      const summaryPrompt = `Based on the following engineering analysis and user request, create a professional design summary.

User Request: ${userPrompt}

Engineering Analysis:
${analysisText}

Return a JSON object with the design summary.`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: summaryPrompt,
          systemPrompt: SYSTEM_PROMPT_DESIGN_SUMMARY,
          isCodeGen: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate design summary');
      }

      const data = await response.json();
      const jsonMatch = data.content.match(/```json\n([\s\S]*?)```/) || data.content.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const summary = JSON.parse(jsonStr);
        setDesignSummary(summary);
      }
    } catch (error) {
      console.error('Design summary generation failed:', error);
      // Don't block the main flow if summary fails
    }
  };

  const generateIllustrations = async (analysisText: string) => {
    setIsGeneratingIllustrations(true);
    setIllustrations([]); // Clear previous illustrations

    const viewTypes = [
      { type: 'isometric', label: 'Isometric 3D' },
      { type: 'sketch', label: 'Engineering Sketch' },
      { type: 'front', label: 'Front View' },
      { type: 'top', label: 'Top View' },
      { type: 'render', label: '3D Rendering' }
    ];

    // Generate all 5 illustrations in parallel
    const promises = viewTypes.map(async ({ type, label }) => {
      try {
        const response = await fetch('/api/generate-illustration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: analysisText,
            viewType: type
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate ${label}`);
        }

        const data = await response.json();
        
        if (data.success && data.image) {
          // Add illustration as soon as it's ready (don't wait for all 5)
          setIllustrations(prev => [...prev, {
            viewType: type,
            image: data.image,
            label: label
          }]);
        }
      } catch (error) {
        console.error(`Error generating ${label}:`, error);
        // Continue with other illustrations even if one fails
      }
    });

    // Wait for all to complete, but illustrations populate as they arrive
    await Promise.allSettled(promises);
    setIsGeneratingIllustrations(false);
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

      // Generate design summary in parallel (don't await - let it run in background)
      generateDesignSummary(analysisResponse, userMessage);

      // Generate AI illustrations in parallel (don't await - populate as they arrive)
      generateIllustrations(analysisResponse);

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
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
      case 'idle': return 'bg-muted-foreground';
      default: return 'bg-primary animate-pulse';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600">
              <Ruler className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Engineering CAD AI</h1>
              <p className="text-sm text-muted-foreground">AI-powered design generation</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-sm text-muted-foreground">{status.message}</span>
            </div>
            {stats && (
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="gap-1.5">
                  <FileCode className="w-3 h-3" />
                  {stats.entities} entities
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Ruler className="w-3 h-3" />
                  {stats.layers} layers
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat (40%) */}
        <div className="w-2/5 border-r flex flex-col">
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 && (
              <div className="text-center mt-12">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-3">Start a new design</h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                  Describe your engineering problem and I'll generate a professional CAD drawing.
                </p>
                <div className="text-left max-w-md mx-auto space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Example prompts
                  </p>
                  {[
                    'Design a simply supported beam 5m long with 10kN point load at center',
                    'Create a rectangular steel plate 200×150mm with 4 mounting holes',
                    'Draw a cantilever beam with dimensions and load diagram'
                  ].map((example, idx) => (
                    <Card
                      key={idx}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setInputValue(example)}
                    >
                      <CardContent className="p-3 text-sm">
                        {example}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <Card className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start mb-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">{status.message}</span>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={chatEndRef} />
          </ScrollArea>

          {/* Error Log */}
          {executionLog.length > 0 && error && (
            <div className="border-t p-4 bg-muted/50 max-h-24 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">Execution Log</p>
              {executionLog.slice(-3).map((log, idx) => (
                <p key={idx} className="text-xs text-muted-foreground font-mono">{log}</p>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your engineering problem..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button type="submit" disabled={isProcessing || !inputValue.trim()} className="gap-2">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isProcessing ? 'Processing' : 'Generate'}
              </Button>
            </form>
          </div>
        </div>

        {/* Right: DXF Viewer + Design Summary + Code (60%) */}
        <div className="w-3/5 flex flex-col">
          {/* Top: DXF + Summary */}
          <div className="flex-1 flex overflow-hidden">
            {/* DXF Viewer + Illustrations (60%) */}
            <div className="w-3/5 border-r flex flex-col">
              {/* DXF Viewer (top half) */}
              <div className="flex-1 flex flex-col border-b">
                <div className="border-b p-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">CAD Drawing</h2>
                  <Button onClick={downloadDXF} disabled={!dxf} size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download DXF
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  {error && (
                    <Card className="mb-4 border-destructive/50 bg-destructive/10">
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold text-destructive mb-1">Error</p>
                        <pre className="text-xs text-destructive/90 whitespace-pre-wrap font-mono">{error}</pre>
                      </CardContent>
                    </Card>
                  )}
                  {dxf ? (
                    <DXFViewer dxfContent={dxf} stats={stats || undefined} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                          <FileCode className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">No drawing generated yet</p>
                        <p className="text-xs text-muted-foreground/70">Start by describing your engineering problem</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Illustrations (bottom half) */}
              <div className="flex-1 overflow-auto p-6">
                <IllustrationViewer 
                  illustrations={illustrations} 
                  isLoading={isGeneratingIllustrations} 
                />
              </div>
            </div>

            {/* Design Summary (40%) */}
            <div className="w-2/5 bg-muted/30">
              <ScrollArea className="h-full p-6">
                <DesignSummary summary={designSummary} />
              </ScrollArea>
            </div>
          </div>

          {/* Bottom: Collapsible Python Code */}
          <Collapsible open={showPythonCode} onOpenChange={setShowPythonCode}>
            <div className="border-t">
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showPythonCode ? 'rotate-90' : ''}`} />
                  <Code2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Python Code</span>
                  <Badge variant="secondary" className="text-xs">Advanced</Badge>
                </div>
                {showPythonCode && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegenerate();
                    }}
                    disabled={isProcessing || !pythonCode}
                    size="sm"
                    variant="default"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {isProcessing ? 'Processing...' : 'Redraw'}
                  </Button>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="h-80 bg-[#1e1e1e]">
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
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
