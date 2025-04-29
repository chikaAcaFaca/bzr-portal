import { Router } from "express";
import { storage } from "../storage";
import { insertBlogPostSchema } from "@shared/schema";
import { generateSlug } from "../utils/slug-generator";

export const blogRouter = Router();

// Get all blog posts
blogRouter.get("/", async (req, res) => {
  try {
    const status = req.query.status as string;
    const category = req.query.category as string;
    
    let posts;
    
    if (status) {
      posts = await storage.getBlogPostsByStatus(status);
    } else if (category) {
      posts = await storage.getBlogPostsByCategory(category);
    } else {
      posts = await storage.getAllBlogPosts();
    }
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// Get published blog posts for public view
blogRouter.get("/published", async (req, res) => {
  try {
    const publishedPosts = await storage.getBlogPostsByStatus('published');
    res.json(publishedPosts);
  } catch (error) {
    console.error('Error fetching published blog posts:', error);
    res.status(500).json({ error: "Failed to fetch published blog posts" });
  }
});

// Get a specific blog post by ID
blogRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const post = await storage.getBlogPost(id);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// Get a blog post by slug (for SEO-friendly URLs)
blogRouter.get("/slug/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const post = await storage.getBlogPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    // Increment view count if the post is published
    if (post.status === 'published') {
      await storage.updateBlogPost(post.id, { 
        viewCount: post.viewCount + 1 
      });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// Create a new blog post
blogRouter.post("/", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    
    const parsedData = insertBlogPostSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ 
        error: "Invalid blog post data", 
        details: parsedData.error.format() 
      });
    }
    
    const postData = parsedData.data;
    
    // Generate a unique slug if not provided
    if (!postData.slug) {
      postData.slug = generateSlug(postData.title);
    }
    
    // Set author from authenticated user
    if (!postData.authorId && req.user) {
      postData.authorId = req.user.id;
    }
    
    const post = await storage.createBlogPost(postData);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

// Convert AI response to a draft blog post
blogRouter.post("/from-ai-response", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    
    const { question, answer, title, category, imageUrls } = req.body;
    
    if (!question || !answer || !title) {
      return res.status(400).json({ error: "Missing required fields: question, answer, and title" });
    }
    
    // Generate a slug from the title
    const slug = generateSlug(title);
    
    // Format the content with the question and answer
    const content = `
      <div class="blog-question">
        <h3>Pitanje:</h3>
        <p>${question}</p>
      </div>
      <div class="blog-answer">
        ${answer}
      </div>
      ${imageUrls && imageUrls.length > 0 ? `
        <div class="blog-images">
          ${imageUrls.map((url: string) => `<img src="${url}" alt="${title}" />`).join('')}
        </div>
      ` : ''}
      <div class="cta-section">
        <h3>Želite da naučite više o bezbednosti i zdravlju na radu?</h3>
        <p>Registrujte se za našu mejling listu da biste dobijali najnovije informacije i savete.</p>
        <a href="/subscribe" class="cta-button">Registrujte se</a>
      </div>
    `;
    
    const post = await storage.createBlogPost({
      title,
      slug,
      content,
      excerpt: answer.substring(0, 150) + '...',
      category: category || 'general',
      status: 'draft',
      authorId: req.user.id,
      imageUrls: imageUrls || [],
      tags: [],
      seoTitle: title,
      seoDescription: answer.substring(0, 160),
      seoKeywords: title.split(' ').join(', ')
    });
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Error converting AI response to blog post:', error);
    res.status(500).json({ error: "Failed to convert AI response to blog post" });
  }
});

// Update a blog post status (approve or reject)
blogRouter.patch("/:id/status", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const { status, adminComments } = req.body;
    if (!status || !['draft', 'pending_approval', 'approved', 'published', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const post = await storage.getBlogPost(id);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    const updatedPost = await storage.updateBlogPost(id, { 
      status, 
      adminComments: adminComments || post.adminComments
    });
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post status:', error);
    res.status(500).json({ error: "Failed to update blog post status" });
  }
});

// Update a blog post
blogRouter.put("/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.id !== req.body.authorId)) {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const parsedData = insertBlogPostSchema.partial().safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ 
        error: "Invalid blog post data", 
        details: parsedData.error.format() 
      });
    }
    
    const post = await storage.getBlogPost(id);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    const updatedPost = await storage.updateBlogPost(id, parsedData.data);
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

// Delete a blog post
blogRouter.delete("/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const post = await storage.getBlogPost(id);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    const success = await storage.deleteBlogPost(id);
    if (!success) {
      return res.status(500).json({ error: "Failed to delete blog post" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});