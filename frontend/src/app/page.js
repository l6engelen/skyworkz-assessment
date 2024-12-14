"use client";

import { useEffect, useState } from "react";

// import MockNewsPage from "./mockpage";

// export default function Page() {
//   return <MockNewsPage />;
// }
// function NewsPage() {

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
      {/* <h1 className="text-2xl font-bold mb-4">Latest News</h1> */}
      <h1 className="text-3xl font-bold mb-4 text-yellow-500">Latest News 🚀</h1>

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

      {/* {nextKey && ( //TODO check this
        <button
          onClick={() => fetchNews(nextKey)}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )} */}
      </div>


      {/* Post News Form */}
      <div className="form-container">
        <form onSubmit={postNews} className="form">
        <h2 className="text-xl font-bold mb-4">Post News Item</h2>

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
