"use client";

import { useState } from "react";

export default function MockNewsPage() {
  const [newsItems, setNewsItems] = useState([
    {
      id: 1,
      title: "Mock News 1",
      description: "This is the description for mock news 1.",
      date: "2024-01-01T00:00:00Z",
      thumbnail_key: "console.png",
    },
    {
      id: 2,
      title: "Mock News 2",
      description: "This is the description for mock news 2.",
      date: "2024-01-02T00:00:00Z",
      thumbnail_key: "s3bucket.png",
    },
    {
        id: 3,
        title: "Mock News dfsjkdsjfsd",
        description: "This is the description for mock news 1.",
        date: "2024-01-03T00:00:00Z",
        thumbnail_key: "console.png",
      },
      {
        id: 4,
        title: "Mock News FFGDFGDF",
        description: "This is the description for mock news 2. This is the description for mock news 2.",
        date: "2024-01-04T00:00:00Z",
        thumbnail_key: "s3bucket.png",
      },
      {
        id: 5,
        title: "Mock News dfsjkdsjfsd",
        description: "This is the description for mock news 1. This is the description for mock news 2. This is the description for mock news 2.",
        date: "2024-01-03T00:00:00Z",
        thumbnail_key: "console.png",
      },
      {
        id: 6,
        title: "Latest",
        description: "This is the description for mock news 2. This is the description for mock news 2.",
        date: "2024-01-10T00:00:00Z",
      },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [imageKey, setImageKey] = useState(null);

  // Simulate file upload
  async function uploadFile(file) {
    setUploading(true);
    try {
      console.log("Simulated file upload:", file.name);
      setImageKey("mock-image-uploaded-key");
    } catch (err) {
      setError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  // Simulate posting a new news item
  async function postNews(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const newItem = {
        id: Date.now(),
        title: newTitle,
        description: newDescription,
        date: new Date().toISOString(),
        thumbnail_key: imageKey,
      };

      setNewsItems((prev) => [newItem, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setImageKey(null);
    } catch (err) {
      setError("Failed to post news item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Latest News (Mock)</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && newsItems.length === 0 && <p>Loading news...</p>}
      {!loading && newsItems.length === 0 && <p>No news items found.</p>}

      <div className="main-container">
        {/* News Items */}
                <div className="news-grid">
        {newsItems
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by most recent date
            .map((item) => (
            <div key={item.id} className="news-item">
                <div className="news-item-header">
                {item.thumbnail_key && (
                    <img
                    src={`/thumbnails/${item.thumbnail_key}`}
                    alt={item.title}
                    className="news-thumbnail"
                    />
                )}
                <h2 className="news-title">{item.title}</h2>
                </div>
                <p className="news-description">{item.description}</p>
                <small className="news-date">
                {new Date(item.date).toLocaleString("en-US", {
                    dateStyle: "long",
                    timeStyle: "short",
                })}
                </small>
            </div>
            ))}
        </div>
        </div>

        {/* Post News Form */}
        <div className="form-container">
        <form onSubmit={postNews} className="form">
          <h2 className="text-xl font-bold mb-4">Post a News Item</h2>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">
              Title:
              <input
                type="text"
                value={newTitle}
                onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (e.target.value.length > 100) {
                      setError("Title must not exceed 100 characters.");
                    } else {
                      setError(null);
                    }
                  }}
                required
                maxLength={100}
                className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
            </label>
            <small className="text-gray-500">{newTitle.length}/100 characters</small>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">
              Description:
              <textarea
                value={newDescription}
                onChange={(e) => {
                    setNewDescription(e.target.value);
                    if (e.target.value.length > 300) {
                      setError("Description must not exceed 300 characters.");
                    } else {
                      setError(null);
                    }
                  }}
                required
                maxLength={300}
                className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
            </label>
            <small className="text-gray-500">{newDescription.length}/300 characters</small>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">
              Image:
              <input
                type="file"
                onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                        setError("Image size must not exceed 5MB.");

                      if (file.size > 5 * 1024 * 1024) {
                        setError("Image size must not exceed 5MB.");
                      } else {
                        setError(null);
                        uploadFile(file);
                      }
                    }
                  }}
                accept="image/*"
                className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
            </label>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>

          {/* Submit Button */}
          <button
              type="submit"
              disabled={loading || uploading || !newTitle || !newDescription}
              className={`${
                loading || uploading || !newTitle || !newDescription
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              } text-white px-4 py-2 rounded`}
            >
              {loading || uploading ? "Posting..." : "Post News"}
            </button>
        </form>
        </div>
    </div>
  );
}
