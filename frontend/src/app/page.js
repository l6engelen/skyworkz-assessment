"use client";

import { useEffect, useState } from "react";

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [nextKey, setNextKey] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [imageKey, setImageKey] = useState(null); // Store the uploaded file's S3 key

  const ITEMS_PER_PAGE = 20;

  // Fetch news items
  async function fetchNews(startKey = null) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: ITEMS_PER_PAGE });
      if (startKey) params.append("start_key", JSON.stringify(startKey));

      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch news items");
      }

      const data = await response.json();
      setNewsItems((prev) => [...prev, ...(data.news_items || [])]);
      setNextKey(data.next_key || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Upload the file to S3 using a pre-signed URL
  async function uploadFile(file) {
    setUploading(true);
    try {
      const response = await fetch(`/api/pre-signed-url?filename=${file.name}`);
      if (!response.ok) {
        throw new Error("Failed to get pre-signed URL");
      }

      const { url, fields, key } = await response.json();

      const formData = new FormData();
      Object.entries(fields).forEach(([field, value]) => {
        formData.append(field, value);
      });
      formData.append("file", file);

      await fetch(url, {
        method: "POST",
        body: formData,
      });

      setImageKey(key); // Store the uploaded file's S3 key
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  // Post a new news item
  async function postNews(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/newsitem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          thumbnail_key: imageKey, // Use the pre-uploaded file's S3 key
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post news item");
      }

      const data = await response.json();
      const postedItem = data.news_item;

      setNewsItems((prev) => [postedItem, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setImageKey(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Latest News</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && newsItems.length === 0 && <p>Loading news...</p>}
      {!loading && newsItems.length === 0 && <p>No news items found.</p>}

      <ul>
        {newsItems.map((item) => (
          <li key={item.id} className="news-item border p-4 mb-4 rounded">
            {item.thumbnail_key && (
              <img
                src={`thumbnails/${item.thumbnail_key}`}
                alt={item.title}
                className="w-32 h-32 object-cover mb-4"
              />
            )}
            <h2 className="news-title font-bold text-lg">{item.title}</h2>
            <p className="news-description">{item.description}</p>
            <small className="news-date text-gray-500">
              Posted on: {new Date(item.date).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>

      {nextKey && (
        <button
          onClick={() => fetchNews(nextKey)}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}

      {/* Post News Form */}
      <form onSubmit={postNews} className="form-container mt-8 p-4 border rounded">
        <h2 className="text-xl font-bold mb-4">Post a News Item</h2>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Title:
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="block w-full p-2 border border-gray-300 rounded mt-1"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Description:
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              required
              className="block w-full p-2 border border-gray-300 rounded mt-1"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Image:
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files[0]) uploadFile(e.target.files[0]);
              }}
              accept="image/*"
              className="block w-full p-2 border border-gray-300 rounded mt-1"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading || uploading || !imageKey}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          {loading || uploading ? "Posting..." : "Post News"}
        </button>
      </form>
    </div>
  );
}
