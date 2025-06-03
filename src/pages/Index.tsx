
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
public class HelloWorld {
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
console.log("Fibonacci sequence:", fibSequence.join(" "));

// Async example
setTimeout(() => {
    console.log("Async operation completed!");
}, 1000);`,

  mysql: `-- Welcome to MySQL!
-- Create a sample database and table
CREATE DATABASE IF NOT EXISTS sample_db;
USE sample_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
('Alice Johnson', 'alice@example.com'),
('Bob Smith', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com');

-- Query examples
SELECT * FROM users;
SELECT name, email FROM users WHERE id > 1;
SELECT COUNT(*) as total_users FROM users;

-- Update and aggregate
UPDATE users SET name = 'Alice Williams' WHERE id = 1;
SELECT * FROM users ORDER BY created_at DESC;`
};

const LANGUAGE_CONFIGS = {
  python: { monaco: 'python', extension: '.py' },
  java: { monaco: 'java', extension: '.java' },
  c: { monaco: 'c', extension: '.c' },
  cpp: { monaco: 'cpp', extension: '.cpp' },
  javascript: { monaco: 'javascript', extension: '.js' },
  mysql: { monaco: 'sql', extension: '.sql' }
};

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
          setOutput('Error: Failed to load Python environment. Please refresh the page.\n');
        }
      };

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      script.onload = loadPyodide;
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else {
      setPyodideReady(false);
      setOutput(`${language.toUpperCase()} code editor ready. Note: Only Python can be executed in the browser.\n`);
    }
  }, [language]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(LANGUAGE_EXAMPLES[newLanguage as keyof typeof LANGUAGE_EXAMPLES]);
    setOutput('');
  };

  const runCode = async () => {
    if (language !== 'python') {
      toast({
        title: "Execution Not Available",
        description: `${language.toUpperCase()} execution is not supported in the browser. Only Python can be executed.`,
        variant: "destructive"
      });
      return;
    }

    if (!pyodideReady || !pyodideRef.current) {
      toast({
        title: "Python Not Ready",
        description: "Please wait for Python environment to load.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setOutput('Running...\n');

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
      
      setOutput(result || 'Code executed successfully (no output)');

      pyodideRef.current.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `);

    } catch (error) {
      setOutput(`Error: ${error}`);
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
    if (language === 'python') {
      return pyodideReady ? 'bg-green-400' : 'bg-yellow-400';
    }
    return 'bg-blue-400';
  };

  const getStatusText = () => {
    if (language === 'python') {
      return pyodideReady ? 'Ready' : 'Loading Python...';
    }
    return 'Editor Ready';
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
                  disabled={language !== 'python' || (language === 'python' && (!pyodideReady || isRunning))}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-1" />
                  {isRunning ? 'Running...' : language === 'python' ? 'Run' : 'Run (Python Only)'}
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
                {output || `${language.toUpperCase()} code editor loaded.\n${language === 'python' ? 'Click Run to execute your Python code!' : 'Note: Only Python execution is supported in the browser.'}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 p-4 text-center text-gray-400 text-sm">
        <p>Multi-Language Code Editor - Python execution powered by Pyodide</p>
      </footer>
    </div>
  );
};

export default Index;
