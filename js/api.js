async function post(data) {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify(data)
  });

  const text = await res.text();

  console.log("POST:", data);
  console.log("HTTP:", res.status);
  console.log("Response:", text);

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Response bukan JSON:", text);

    throw new Error(
      `Server tidak mengembalikan JSON. HTTP ${res.status}`
    );
  }
}