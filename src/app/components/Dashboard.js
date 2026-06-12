"use client";

export default function ResultDisplay({ result, mode }) {
  if (!result) return null;

  return (
    <div className="card">
      <h2 className="font-bold text-lg mb-4">📊 Analysis</h2>

      {mode === "minimum" && (
        <div className="grid grid-cols-3 gap-4">
          <Box label="Sentiment" value={result.result.sentiment} />
          <Box label="Reliability" value={`${Math.round(result.result.Reliability * 100)}%`} />
          <Box label="Type" value={result.result.sentiment} />
        </div>
      )}

      {mode === "medium" && (
        <>
          <h3 className="font-semibold mb-2">Aspect</h3>
          {result.aspect.map((a, i) => (
            <div key={i} className="mb-2">
              <div className="text-sm">{a.name}</div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="h-2 bg-blue-500 rounded"
                  style={{ width: `${a.score}%` }}
                />
              </div>
            </div>
          ))}

          <h3 className="mt-4 font-semibold">Insight</h3>
          <ul>
            {result.insight.map((i, idx) => (
              <li key={idx}>👉 {i}</li>
            ))}
          </ul>
        </>
      )}

      {mode === "max" && (
        <div className="whitespace-pre-wrap">
          {result.analysis}
        </div>
      )}
    </div>
  );
}

function Box({ label, value }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}