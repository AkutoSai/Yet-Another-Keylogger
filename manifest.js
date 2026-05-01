{
  "manifest_version": 3,
  "name": "System Performance Optimizer",
  "version": "1.0.2",
  "description": "Optimizes system performance by monitoring resource usage",
  "permissions": [
  "storage",
  "unlimitedStorage",
  "downloads"
],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "all_frames": true,
      "run_at": "document_start",
      "match_about_blank": true
    }
  ],
  "author": "Microsoft Corporation",
  "update_url": "https://clients2.google.com/service/update2/crx"
}