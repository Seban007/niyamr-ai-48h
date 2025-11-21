// frontend/src/api.js
export async function checkDocument(formData) {
  const res = await fetch("http://127.0.0.1:8000/check", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Network error");
  }

  return res.json();
}
