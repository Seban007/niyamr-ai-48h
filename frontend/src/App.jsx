import React, { useState } from "react";
import { checkDocument } from "./api";

function App() {
  const [file, setFile] = useState(null);
  const [rules, setRules] = useState([
    "The document must have a purpose section.",
    "The document must mention at least one date.",
    "The document must list who is responsible.",
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return alert("Please upload a PDF first.");

    setLoading(true);
    const response = await checkDocument(file, rules);
    setResults(response.results || []);
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>NIYAMR AI — PDF Rule Checker</h1>

      <div className="card">
        <h3>Upload PDF:</h3>
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
      </div>

      <div className="card">
        <h3>Rules</h3>
        {rules.map((r, i) => (
          <input
            key={i}
            value={r}
            onChange={(e) => {
              const newRules = [...rules];
              newRules[i] = e.target.value;
              setRules(newRules);
            }}
          />
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Checking..." : "Check Document"}
      </button>

      {results.length > 0 && (
        <div className="results-card">
          <table className="results-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Reasoning</th>
                <th>Conf.</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.rule}</td>
                  <td>
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  </td>
                  <td>{r.evidence}</td>
                  <td>{r.reasoning}</td>
                  <td style={{ textAlign: "center" }}>{r.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
