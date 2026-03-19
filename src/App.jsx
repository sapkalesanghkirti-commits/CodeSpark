// App.js
import { useState, useEffect } from "react";
import Editor from "./components/Editor";
import FileTabs from "./components/FileExplorer";
import Toolbar from "./components/Toolbar";
import Preview from "./components/Preview";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function App() {
  const [loadingAI, setLoadingAI] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

const [chatHistory, setChatHistory] = useState([]);
  const [html, setHtml] = useState("<h1>Hello Sanghkirti</h1>");
  const [css, setCss] = useState("h1{color:purple}");
  const [js, setJs] = useState("console.log('Working');");

  const [active, setActive] = useState("html");
  const [srcDoc, setSrcDoc] = useState("");
  const [result, setResult] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [live, setLive] = useState(false);
  const [notify, setNotify] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [template, setTemplate] = useState("Custom");
  const [lintErrors, setLintErrors] = useState({ html: [], css: [], js: [] });

  useEffect(() => {
    setDirty(true);
    setShowReport(false);
    if (live) updateLivePreview();
    runLint();
  }, [html, css, js, live]);

  const updateLivePreview = () => {
    const source = `
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>
            try { ${js} } catch(error) {
              document.body.innerHTML += "<pre style='color:red'>" + error.message + "</pre>";
            }
          </script>
        </body>
      </html>
    `;
    setSrcDoc(source);
  };

  const runCode = () => updateLivePreview();

  const getCode = () => (active === "html" ? html : active === "css" ? css : js);
  const setCode = (value) => {
    if (active === "html") setHtml(value);
    if (active === "css") setCss(value);
    if (active === "js") setJs(value);
  };

  // ================== 🔥 UPDATED LINT ==================
  const runLint = () => {
    const jsIssues = [];
    const cssIssues = [];
    const htmlIssues = [];

    // JS REAL ERROR
    try {
      new Function(js);
    } catch (err) {
      jsIssues.push({ line: "Unknown", msg: err.message });
    }

    const jsLines = js.split("\n");
    jsLines.forEach((line, idx) => {
      const t = line.trim();

      if (line.includes("console.log"))
        jsIssues.push({ line: idx + 1, msg: "console.log detected" });

      if (line.includes("var"))
        jsIssues.push({ line: idx + 1, msg: "Use let/const instead of var" });

      if (line.includes("eval("))
        jsIssues.push({ line: idx + 1, msg: "Avoid eval()" });

      if (t && !t.endsWith(";") && !t.endsWith("{") && !t.endsWith("}") && !t.startsWith("//"))
        jsIssues.push({ line: idx + 1, msg: "Missing semicolon" });

      if (line.includes("=="))
        jsIssues.push({ line: idx + 1, msg: "Use === instead of ==" });

      if (line.includes("undefined"))
        jsIssues.push({ line: idx + 1, msg: "Possible undefined usage" });

      if (line.includes("NaN"))
        jsIssues.push({ line: idx + 1, msg: "Check NaN handling" });

      if (line.includes("setTimeout(") && !line.includes(","))
        jsIssues.push({ line: idx + 1, msg: "setTimeout missing delay" });
    });

    // CSS
    if ((css.match(/{/g) || []).length !== (css.match(/}/g) || []).length) {
      cssIssues.push({ line: "Unknown", msg: "Unmatched { } brackets" });
    }

    css.split("\n").forEach((line, idx) => {
      if (line.includes("!important"))
        cssIssues.push({ line: idx + 1, msg: "!important used" });

      if (line.includes("px"))
        cssIssues.push({ line: idx + 1, msg: "px unit detected, use rem/em" });

      if (line.includes(";;"))
        cssIssues.push({ line: idx + 1, msg: "Extra semicolon" });

      if (line.includes(": ;"))
        cssIssues.push({ line: idx + 1, msg: "Empty CSS value" });
    });

    // HTML
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      if (doc.querySelector("parsererror")) {
        htmlIssues.push({ line: "Unknown", msg: "Invalid HTML structure" });
      }
    } catch {
      htmlIssues.push({ line: "Unknown", msg: "HTML parsing failed" });
    }

    html.split("\n").forEach((line, idx) => {
      if (line.includes("<script>"))
        htmlIssues.push({ line: idx + 1, msg: "Inline script detected" });

      if (line.includes("<font"))
        htmlIssues.push({ line: idx + 1, msg: "Deprecated <font>" });

      if (line.includes("<img") && !line.includes("alt="))
        htmlIssues.push({ line: idx + 1, msg: "Image missing alt" });

      if (line.includes("<a") && !line.includes("href"))
        htmlIssues.push({ line: idx + 1, msg: "Anchor missing href" });

      if (line.includes("<input") && !line.includes("type"))
        htmlIssues.push({ line: idx + 1, msg: "Input missing type" });
    });

    if ((html.match(/</g) || []).length !== (html.match(/>/g) || []).length) {
      htmlIssues.push({ line: "Unknown", msg: "Unbalanced HTML tags" });
    }

    setLintErrors({ js: jsIssues, css: cssIssues, html: htmlIssues });
  };
const scanCode = async () => {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/scan/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, css, js,lintErrors })// sending lintErrors from frontend
    });
    const data = await res.json();

    setResult({
      score: data.score,
      issues: data.issues,
      fixes: data.fixes,
      types: data.issues.map(() => "AI")
    });
    setShowReport(true);
    setDirty(false);
    setChatHistory(prev=>[
      ...prev,
      {
        timestamp:new Date().toLocaleDateString(),
        result:data,
        html,css,js
      }
    ]);
    setNotify(true);
    setTimeout(() => setNotify(false),1000);
  } catch (err) {
    console.error(err);
  }
  setLoadingAI(false);

};
  const exportCode = async () => {
    const zip = new JSZip();
    zip.file("index.html", html);
    zip.file("style.css", css);
    zip.file("script.js", js);
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "code.zip");
  };

  
  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: darkMode ? "#1e1e2f" : "#f5f5f5", color: darkMode ? "#fff" : "#000" }}>
      
      {/* Notification */}
      {notify && <div style={{ position:"fixed", top:"10px", left:"50%", transform:"translateX(-50%)", zIndex:999, backgroundColor:"#2563eb", color:"#fff", padding:"10px 20px", borderRadius:"8px", fontWeight:"600" }}>✅ AI Report Generated! Check Below For Details</div>}

      <Toolbar runCode={runCode} />

      {/* Tabs and Buttons */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", backgroundColor: darkMode ? "#1e1e1e" : "#ddd" }}>
        <FileTabs active={active} setActive={setActive} />
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={runCode} style={{background:"#3b82f6", color:"#fff", padding:"6px 12px", borderRadius:"6px", border:"none"}}>▶ Run</button>
          <button onClick={() => setLive(!live)} style={{background: live?"#10b981":"#3b82f6", color:"#fff", padding:"6px 12px", borderRadius:"6px", border:"none"}}>🌐 Live Preview</button>
          <button onClick={scanCode} disabled={!dirty} style={{background:dirty?"#6366f1":"#777", color:"#fff", padding:"6px 12px", borderRadius:"6px", border:"none"}}>🤖 AI Scan</button>
          <button onClick={exportCode} style={{background:"#0073de", color:"#fff", padding:"6px 12px", borderRadius:"6px", border:"none"}}>💾 Export ZIP</button>
          <button onClick={() => setDarkMode(!darkMode)} style={{background: darkMode?"#40005697":"#f3f4f6", color: darkMode?"#fff":"#000", padding:"6px 12px", borderRadius:"6px", border:"none"}}>{darkMode?"🌙 Dark":"☀️ Light"}</button>
          
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{ display:"flex", width:"100%", minHeight:"500px" }}>
        <div style={{ width:"50%", backgroundColor: darkMode?"#1e1e1e":"#f5f5f5", color:darkMode?"#fff":"#000", borderRight: darkMode?"2px solid #333":"2px solid #ccc", padding:"10px", boxSizing:"border-box" }}>
          <Editor language={active} code={getCode()} setCode={setCode} lintErrors={lintErrors[active]} />
        </div>
        <div style={{ width:"50%", backgroundColor:"#fff", borderLeft:"2px solid #ddd", padding:"10px", boxSizing:"border-box" }}>
          <Preview srcDoc={srcDoc} />
        </div>
      </div>

   {/* AI Report */}
{showReport && result && (
 
  <div style={{
    width: "100%",
    padding: "20px",
    backgroundColor: darkMode ? "#0f172a" : "#f1f5f9",
    color: darkMode ? "#e2e8f0" : "#000",
    marginTop: "20px",
    borderRadius: "10px"
  }}>

    <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
      🤖 AI Code Review
    </h2>
    

{/*Show/Hide History Button */}
<div style={{ textAlign: "left", marginBottom: "10px" }}>
  <button 
    onClick={() => setShowHistory(!showHistory)}
    style={{ 
      background: "#6366f1", 
      color: "#fff",
      padding: "6px 12px", 
      borderRadius: "6px", 
      border: "none",
      cursor: "pointer",
      textAlign:"left"
    }}
  >
    {showHistory ? "Hide History" : "Show History"}
  </button>
</div>

{/* 📝 History Panel */}
{showHistory && chatHistory.length > 0 && (
  <div style={{
    width: "100%",
    padding: "15px",
    backgroundColor: darkMode ? "#111827" : "#f0f0f0",
    color: darkMode ? "#e5e7eb" : "#111",
    marginTop: "10px",
    borderRadius: "10px",
    maxHeight: "200px",
    overflowY: "auto",
    textAlign:"left"
  }}>
    <h3 style={{ marginBottom: "10px", textAlign:"left" }}>🕘 Scanned History</h3>
    <p style={{ paddingLeft: "20px" }}>
      {chatHistory.map((item, idx) => (
        <p key={idx} style={{ marginBottom: "10px" }}>
          <strong>{item.timestamp}</strong>: Score {item.result.score}/100
          <br />
          Issues: {item.result.issues.join(", ")}
          <br />
          Fixes: {item.result.fixes.join(", ")}
        </p>
      ))}
    </p>
  </div>
)}

    {/* Score */}
    <div style={{
      textAlign: "left",
      fontSize: "18px",
      marginBottom: "20px",
      fontWeight: "bold",
      color: "#38bdf8"
    }}>
      Score: {result.score}/100
    </div>

    {/* Issues */}
    <div style={{ marginBottom: "15px" }}>
      <h3 style={{ color: "#ef4444" }}>❌ Issues</h3>
      {result.issues.length > 0 ? (
        <ul>
          {result.issues.map((item, i) => (
            <li key={i} style={{ marginBottom: "6px" }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p>No issues found 🎉</p>
      )}
    </div>

    {/* Fixes */}
    <div>
      <h3 style={{ color: "#22c55e" }}>✅ Fix Suggestions</h3>
      {result.fixes.length > 0 ? (
        <ul>
          {result.fixes.map((item, i) => (
            <li key={i} style={{ marginBottom: "6px" }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p>No fixes needed 👍</p>
      )}
    </div>

  </div>
   
)}

    </div>
    
  );
}

export default App;