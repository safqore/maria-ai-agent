// Simple test to reproduce the persist_session 400 error
const testPersistSession = async () => {
  const payload = {
    session_uuid: "123e4567-e89b-42d3-a456-426614174000",
    name: "Test User",
    // Note: email is missing - testing if this causes the 400 error
  };

  try {
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
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    console.log("Body:", responseText);

    if (!response.ok) {
      console.error("Request failed with status:", response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.error("Error details:", errorData);
      } catch (e) {
        console.error("Could not parse error response as JSON");
      }
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};

// Test with missing email field
console.log("Testing persist_session with missing email field...");
testPersistSession();
