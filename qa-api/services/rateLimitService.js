import { Redis } from "../deps.js";

const redis = new Redis("redis://redis:6379/1");
redis.on("error", (err) => console.log("Redis Client Error", err));

// A simple 1-post-per-minute scheme (per user, per postType)
async function canPost(userUuid, postType, limitSeconds = 60) {
  // 1) Create a Redis key for this user + post type
  const rateLimitKey = `post-limit:${userUuid}:${postType}`;

  // 2) Check if key already exists
  const existing = await redis.get(rateLimitKey);

  if (existing) {
    // Means user is still in cooldown
    return {
      allowed: false,
      message: `You can post only one ${postType} per minute. Please wait a while before trying again.`,
    };
  }

  // 3) Otherwise, set the key with expiry
  const result = await redis.set(rateLimitKey, "1", "EX", 60);

  // 4) Indicate success
  return {
    allowed: true,
    message: "",
  };
}

export { canPost };
