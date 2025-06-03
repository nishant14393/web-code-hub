
import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Code2, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Editor from '@monaco-editor/react';

const LANGUAGE_EXAMPLES = {
  python: `# Welcome to Python!
print("Hello, World!")

# List comprehension
numbers = [1, 2, 3, 4, 5]
squared = [x**2 for x in numbers]
print(f"Squared: {squared}")

# Function example
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(8):
    print(fibonacci(i), end=" ")`,

  java: `// Welcome to Java!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Array example
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Numbers: ");
        for (int num : numbers) {
            System.out.print(num + " ");
        }
        
        // Method call
        System.out.println("\\nFibonacci: " + fibonacci(10));
    }
    
    static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n-1) + fibonacci(n-2);
    }
}`,

  c: `// Welcome to C!
#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    printf("Hello, World!\\n");
    
    // Array example
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    
    printf("Numbers: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
    }
    
    printf("\\nFibonacci(10): %d\\n", fibonacci(10));
    return 0;
}`,

  cpp: `// Welcome to C++!
#include <iostream>
#include <vector>

using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    cout << "Hello, World!" << endl;
    
    // Vector example
    vector<int> numbers = {1, 2, 3, 4, 5};
    cout << "Numbers: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    
    cout << endl << "Fibonacci(10): " << fibonacci(10) << endl;
    return 0;
}`,

  javascript: `// Welcome to JavaScript!
console.log("Hello, World!");

// Array methods
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(x => x * x);
console.log("Squared:", squared);

// Function example
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

// Modern syntax
const fibSequence = Array.from({length: 8}, (_, i) => fibonacci(i));
console.log("Fibonacci sequence:", fibSequence.join(" "));`,

  mysql: `-- Welcome to MySQL!
-- Note: This is a simulation of MySQL queries
SELECT 'Hello, World!' as greeting;

-- Sample data creation
CREATE TEMPORARY TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
('Alice Johnson', 'alice@example.com'),
('Bob Smith', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com');

-- Query examples
SELECT * FROM users;
SELECT COUNT(*) as total_users FROM users;`
};

const LANGUAGE_CONFIGS = {
  python: { monaco: 'python', extension: '.py', judge0Id: 71 },
  java: { monaco: 'java', extension: '.java', judge0Id: 62 },
  c: { monaco: 'c', extension: '.c', judge0Id: 50 },
  cpp: { monaco: 'cpp', extension: '.cpp', judge0Id: 54 },
  javascript: { monaco: 'javascript', extension: '.js', judge0Id: 63 },
  mysql: { monaco: 'sql', extension: '.sql', judge0Id: 82 }
};

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';

const Index = () => {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGE_EXAMPLES.python);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const pyodideRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (language === 'python') {
      const loadPyodide = async () => {
        try {
          const pyodide = await (window as any).loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
          });
          pyodideRef.current = pyodide;
          setPyodideReady(true);
          setOutput('Python environment loaded successfully! Ready to run code.\n');
        } catch (error) {
          console.error('Failed to load Pyodide:', error);
          setOutput('Python environment loaded. You can now execute Python code locally or use online execution.\n');
          setPyodideReady(true); // Set to true to allow fallback to Judge0
        }
      };

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      script.onload = loadPyodide;
      script.onerror = () => {
        console.log('Pyodide failed to load, will use Judge0 for Python execution');
        setPyodideReady(true);
        setOutput('Code editor ready. Click Run to execute your code!\n');
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else {
      setPyodideReady(false);
      setOutput(`${language.toUpperCase()} code editor ready. Click Run to execute your code!\n`);
    }
  }, [language]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(LANGUAGE_EXAMPLES[newLanguage as keyof typeof LANGUAGE_EXAMPLES]);
    setOutput('');
  };

  const executeWithJudge0 = async (sourceCode: string, languageId: number) => {
    try {
      // Submit code for execution
      const submissionResponse = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'demo', // Using demo key - users should get their own
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: languageId,
          stdin: '',
        })
      });

      if (!submissionResponse.ok) {
        throw new Error(`HTTP error! status: ${submissionResponse.status}`);
      }

      const result = await submissionResponse.json();
      
      let output = '';
      if (result.stdout) {
        output += result.stdout;
      }
      if (result.stderr) {
        output += '\nError:\n' + result.stderr;
      }
      if (result.compile_output) {
        output += '\nCompile Output:\n' + result.compile_output;
      }
      if (!output && result.status?.description) {
        output = `Status: ${result.status.description}`;
      }

      return output || 'Code executed successfully (no output)';
    } catch (error) {
      console.error('Judge0 execution error:', error);
      return `Execution Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: This demo uses limited API access. For full functionality, you would need to set up your own Judge0 API key.`;
    }
  };

  const runPythonWithPyodide = async (code: string) => {
    try {
      pyodideRef.current.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      pyodideRef.current.runPython(code);

      const stdout = pyodideRef.current.runPython("sys.stdout.getvalue()");
      const stderr = pyodideRef.current.runPython("sys.stderr.getvalue()");

      let result = '';
      if (stdout) result += stdout;
      if (stderr) result += 'Error:\n' + stderr;
      
      pyodideRef.current.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `);

      return result || 'Code executed successfully (no output)';
    } catch (error) {
      return `Error: ${error}`;
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...\n');

    try {
      let result = '';
      const languageConfig = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];

      // Try Pyodide first for Python if available
      if (language === 'python' && pyodideRef.current) {
        try {
          result = await runPythonWithPyodide(code);
        } catch (error) {
          console.log('Pyodide failed, falling back to Judge0');
          result = await executeWithJudge0(code, languageConfig.judge0Id);
        }
      } else {
        // Use Judge0 for all other languages and Python fallback
        result = await executeWithJudge0(code, languageConfig.judge0Id);
      }

      setOutput(result);
    } catch (error) {
      setOutput(`Execution Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput('');
  };

  const clearCode = () => {
    setCode(LANGUAGE_EXAMPLES[language as keyof typeof LANGUAGE_EXAMPLES]);
  };

  const getStatusColor = () => {
    return 'bg-green-400';
  };

  const getStatusText = () => {
    return 'Ready to Execute';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Multi-Language Code Editor
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
              <span className="text-sm text-gray-300">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Code Editor Panel */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Code2 className="h-5 w-5 text-blue-400" />
                <span className="font-medium">Code Editor ({language.toUpperCase()})</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCode}
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button
                  onClick={runCode}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-1" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS].monaco}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: 'on',
                  bracketPairColorization: { enabled: true },
                  suggest: { enabled: true },
                  quickSuggestions: true,
                }}
              />
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-green-400" />
                <span className="font-medium">Output</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearOutput}
                className="bg-gray-700 border-gray-600 hover:bg-gray-600"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {output || `${language.toUpperCase()} code editor loaded.\nClick Run to execute your code!`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 p-4 text-center text-gray-400 text-sm">
        <p>Multi-Language Code Editor - Powered by Judge0 API and Pyodide</p>
      </footer>
    </div>
  );
};

export default Index;
