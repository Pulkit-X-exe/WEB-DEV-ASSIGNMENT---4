const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const note = new Note({
      title: title,
      content: content,
      userId: req.user.id
    });

    const savedNote = await note.save();

    res.status(201).json({
      message: "Note created successfully",
      note: savedNote
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this note" });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
