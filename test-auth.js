async function testAuth() {
  const email = "pulkit_test_" + Date.now() + "@example.com";

  const signupResponse = await fetch("http://localhost:5001/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Pulkit",
      email: email,
      password: "password123"
    })
  });
  const signupData = await signupResponse.json();
  console.log("Signup:", signupResponse.status, signupData);

  const loginResponse = await fetch("http://localhost:5001/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      password: "password123"
    })
  });
  const loginData = await loginResponse.json();
  console.log("Login:", loginResponse.status, loginData);
}

testAuth();
