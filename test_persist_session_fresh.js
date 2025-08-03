// Test with a fresh UUID
const { v4: uuidv4 } = require("crypto");

const testPersistSessionFresh = async () => {
  // Generate a fresh UUID
  const freshUuid = crypto.randomUUID();

  const payload = {
    session_uuid: freshUuid,
    name: "Test User",
    // Note: email is missing
  };

  try {
    console.log("Testing with fresh UUID:", freshUuid);
    const response = await fetch(
      "http://localhost:5001/api/v1/persist_session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json; version=v1",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();
    console.log("Status:", response.status);
    console.log("Body:", responseText);
  } catch (error) {
    console.error("Network error:", error);
  }
};

testPersistSessionFresh();
