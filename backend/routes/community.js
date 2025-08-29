import express from "express";
import { Op } from "sequelize";
import Post from "../models/Post.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// Create a post (authenticated)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const postData = { ...req.body, postedBy: req.user.id };
    const post = await Post.create(postData);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to create post" });
  }
});

// Get posts with search and pagination
router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { rows: posts, count } = await Post.findAndCountAll({
      where,
      include: [{ model: User, attributes: ["id", "username"] }],
      offset,
      limit: Number(limit),
      order: [["createdAt", "DESC"]],
    });

    res.json({ posts, totalPages: Math.ceil(count / limit), currentPage: Number(page) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// Get single post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, attributes: ["id", "username"] }],
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// Update post (only owner)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.postedBy !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this post" });
    }

    Object.assign(post, req.body);
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to update post" });
  }
});

// Delete post (only owner)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.postedBy !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    await post.destroy();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post" });
  }
});

export default router;
