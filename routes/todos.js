const express = require("express");
const Todo = require("../models/Todo");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: "할 일 목록을 불러오지 못했습니다." });
  }
});

router.post("/", async (req, res) => {
  try {
    const text = req.body.text?.trim();

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const todo = await Todo.create({ text });
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: "할 일을 저장하지 못했습니다." });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const update = {};

    if (typeof req.body.text === "string") {
      const text = req.body.text.trim();

      if (!text) {
        return res.status(400).json({ error: "text cannot be empty" });
      }

      update.text = text;
    }

    if (typeof req.body.done === "boolean") {
      update.done = req.body.done;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "nothing to update" });
    }

    const todo = await Todo.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!todo) {
      return res.status(404).json({ error: "todo not found" });
    }

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: "할 일을 수정하지 못했습니다." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({ error: "todo not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "할 일을 삭제하지 못했습니다." });
  }
});

module.exports = router;
