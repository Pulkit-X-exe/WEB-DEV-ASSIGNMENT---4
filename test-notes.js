async function testNotes() {
  const email = "pulkit_notes_" + Date.now() + "@example.com";

  await fetch("http://localhost:5001/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Pulkit Notes",
      email: email,
      password: "password123"
    })
  });

  const loginResponse = await fetch("http://localhost:5001/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      password: "password123"
    })
  });
  const loginData = await loginResponse.json();
  const token = loginData.token;

  const noTokenResponse = await fetch("http://localhost:5001/notes");
  console.log("No token:", noTokenResponse.status);

  const createResponse = await fetch("http://localhost:5001/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      title: "My Lab Note",
      content: "This is a note"
    })
  });
  const createData = await createResponse.json();
  console.log("Create note:", createResponse.status, createData);

  const noteId = createData.note._id;

  const getAllResponse = await fetch("http://localhost:5001/notes", {
    headers: { "Authorization": "Bearer " + token }
  });
  const allNotes = await getAllResponse.json();
  console.log("Get all notes:", getAllResponse.status, allNotes.length);

  const getOneResponse = await fetch("http://localhost:5001/notes/" + noteId, {
    headers: { "Authorization": "Bearer " + token }
  });
  const oneNote = await getOneResponse.json();
  console.log("Get note by id:", getOneResponse.status, oneNote.title);

  const updateResponse = await fetch("http://localhost:5001/notes/" + noteId, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      title: "Updated Lab Note",
      content: "Updated content"
    })
  });
  const updateData = await updateResponse.json();
  console.log("Update note:", updateResponse.status, updateData.message);

  const deleteResponse = await fetch("http://localhost:5001/notes/" + noteId, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });
  const deleteData = await deleteResponse.json();
  console.log("Delete note:", deleteResponse.status, deleteData.message);
}

testNotes();
