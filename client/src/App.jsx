import { useState } from "react";
import { Database, MessageCircle, Sparkles, LogOut, Send } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AI = import.meta.env.VITE_AI_URL || "http://localhost:8000";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("nexaai_token") || "");
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("sql");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function authenticate(e) {
    e.preventDefault(); setError("");
    try {
      const res = await fetch(`${API}/api/auth/${authMode}`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({name,email,password})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Auth failed");
      localStorage.setItem("nexaai_token", data.token); setToken(data.token);
    } catch (err) { setError(err.message); }
  }

  async function submit(e) {
    e.preventDefault();
    const prompt = question.trim(); if (!prompt) return;
    setBusy(true); setError(""); setResult(null); setQuestion("");
    try {
      let url, body;
      if (tab === "sql") {
        url = `${AI}/sql/ask`; body = {question: prompt};
      } else {
        url = `${AI}/support/chat`; body = {question: prompt, history};
      }
      const res = await fetch(url, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Request failed");
      setResult(data);
      if (tab === "support") setHistory(prev => [...prev, {role:"user",content:prompt},{role:"assistant",content:data.answer}]);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("nexaai_token"); setToken(""); setResult(null); setHistory([]);
  }

  if (!token) return <main className="auth-wrap"><section className="auth-card">
    <div className="brand dark"><Sparkles/> NexaAI</div><h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>
    <p className="muted">Your intelligent workspace for data and customer care.</p>
    <form onSubmit={authenticate} className="auth-form">
      {authMode === "register" && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" required/>}
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" required/>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (8+ characters)" minLength="8" required/>
      {error && <p className="error">{error}</p>}<button className="primary">{authMode === "login" ? "Sign in" : "Create account"}</button>
    </form>
    <button className="text-btn" onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setError("");}}>
      {authMode === "login" ? "New user? Create account" : "Already registered? Sign in"}
    </button>
  </section></main>;

  return <div className="shell">
    <aside className="sidebar"><div className="brand"><Sparkles/> NexaAI</div><div className="section-label">AI WORKSPACE</div>
      <button className={`nav ${tab==="sql"?"active":""}`} onClick={()=>{setTab("sql");setResult(null);}}><Database size={18}/> SQL Assistant</button>
      <button className={`nav ${tab==="support"?"active":""}`} onClick={()=>{setTab("support");setResult(null);}}><MessageCircle size={18}/> Customer Support</button>
      <div className="side-bottom"><button className="nav" onClick={logout}><LogOut size={18}/> Sign out</button></div>
    </aside>
    <main className="main"><header><div><div className="crumb">WORKSPACE / {tab==="sql"?"DATA":"SUPPORT"}</div><h1>{tab==="sql"?"AI SQL Assistant":"AI Customer Support"}</h1></div><span className="status">● AI service</span></header>
      <section className="intro"><div className="hero-icon">{tab==="sql"?<Database/>:<MessageCircle/>}</div>
        <h2>{tab==="sql"?"Ask your data anything.":"How can we help you today?"}</h2>
        <p>{tab==="sql"?"Describe your data question in plain English.":"Ask about shipping, returns, refunds, or account support."}</p>
        <div className="chips">{(tab==="sql"?["Show top 5 students by marks","List shipped orders","Students scoring above 80"]:["What is your return policy?","How long does shipping take?","I need a human agent"]).map(s=><button key={s} onClick={()=>setQuestion(s)}>{s}</button>)}</div>
      </section>
      <form className="composer" onSubmit={submit}><textarea rows="3" value={question} onChange={e=>setQuestion(e.target.value)} placeholder={tab==="sql"?"Ask a question about your database...":"Type your support question..."}/>
        <button className="primary send" disabled={busy}><Send size={16}/>{busy?"Working...":"Send"}</button></form>
      {error && <p className="error response-error">{error}</p>}
      {result && <section className="result">
        {tab==="sql"?<><h3>Generated SQL</h3><pre>{result.sql}</pre><h3>Query Results</h3>
          {result.rows?.length?<div className="table-scroll"><table><thead><tr>{result.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{result.rows.map((r,i)=><tr key={i}>{result.columns.map(c=><td key={c}>{String(r[c]??"")}</td>)}</tr>)}</tbody></table></div>:<p>No rows returned.</p>}
          {result.truncated&&<p className="muted">Showing the first 100 rows.</p>}</>
        :<><h3>AI Support Response</h3><p className="answer">{result.answer}</p>{result.escalate&&<p className="notice">Please contact a human agent at support@example.com.</p>}
          <div className="history">{history.map((m,i)=><div className={`message ${m.role}`} key={i}><b>{m.role==="user"?"You":"AI Support"}</b><p>{m.content}</p></div>)}</div></>}
      </section>}
      <footer>Demo workspace · Do not enter sensitive or private information.</footer>
    </main>
  </div>;
}
