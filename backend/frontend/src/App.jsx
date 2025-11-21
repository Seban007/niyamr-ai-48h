import React, { useState } from "react";
import { checkDocument } from "./api";
import "./styles.css";

export default function App() {
  const [file, setFile] = useState(null);
  const [rules, setRules] = useState([
    "The document must have a purpose section.",
    "The document must mention at least one date.",
    "The document must list who is responsible."
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const onFile = (e) => setFile(e.target.files[0]);

  const onChangeRule = (i, val) => {
    const r = [...rules];
    r[i] = val;
    setRules(r);
  };

  const onCheck = async () => {
    if (!file) return alert("Please upload a PDF.");
    setLoading(true);
    setResults([]);

    const form = new FormData();
    form.append("file", file);
    form.append("rule1", rules[0]);
    form.append("rule2", rules[1]);
    form.append("rule3", rules[2]);

    try {
      const res = await checkDocument(form);
      setResults(res.results || []);
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <main className="card">
        <header className="card-header">
          <h1>NIYAMR AI</h1>
          <p className="subtitle">PDF Rule Checker — Upload, define 3 rules, and check.</p>
        </header>

        <section className="controls">
          <div className="row">
            <label className="filebox">
              <input type="file" accept="application/pdf" onChange={onFile} />
              <span className="filebtn">Choose PDF</span>
            </label>
            <div className="filename">
              {file ? file.name : "No file chosen"}
            </div>
          </div>

          <div className="rules">
            <label>Rule 1</label>
            <input value={rules[0]} onChange={(e) => onChangeRule(0, e.target.value)} />

            <label>Rule 2</label>
            <input value={rules[1]} onChange={(e) => onChangeRule(1, e.target.value)} />

            <label>Rule 3</label>
            <input value={rules[2]} onChange={(e) => onChangeRule(2, e.target.value)} />
          </div>

          <div className="row action-row">
            <button className="primary" onClick={onCheck} disabled={loading}>
              {loading ? <span className="spinner" /> : "Check Document"}
            </button>
            <button
              className="ghost"
              onClick={() => {
                setFile(null);
                setResults([]);
              }}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </section>

        <section className="results">
          {results.length === 0 && !loading && (
            <div className="empty">No results yet — upload a PDF and click “Check Document”.</div>
          )}

          {results.length > 0 && (
            <div className="results-card">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Status</th>
                    <th>Evidence</th>
                    <th>Reasoning</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td className="rule-cell">{r.rule}</td>
                      <td>
                        <span className={`badge ${r.status}`}>{r.status}</span>
                      </td>
                      <td className="evidence">{r.evidence}</td>
                      <td>{r.reasoning}</td>
                      <td style={{ textAlign: "center" }}>{r.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="card-footer">
          <small>Built with FastAPI + React • Heuristic mode active</small>
        </footer>
      </main>
    </div>
  );
}
