export async function checkDocument(file, rules) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("rule1", rules[0]);
  formData.append("rule2", rules[1]);
  formData.append("rule3", rules[2]);

  const response = await fetch("http://127.0.0.1:8000/check", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}
