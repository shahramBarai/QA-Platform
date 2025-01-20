<script>
  export let type; // "questions" or "answers"
  export let id;

  import { userInfo } from "../stores/stores.js";

  const getQuestionLikes = async () => {
    const response = await fetch(`/api/${type}/${id}/likes/${$userInfo.id}`);
    return await response.json();
  };

  let questionLikesPromise = getQuestionLikes();

  const addLike = async (id) => {
    const response = await fetch(`/api/${type}/${id}/likes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ personId: $userInfo.id }),
    });
    questionLikesPromise = getQuestionLikes();
  };

  const removeLike = async (id) => {
    const response = await fetch(`/api/${type}/${id}/likes`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ personId: $userInfo.id }),
    });
    questionLikesPromise = getQuestionLikes();
  };
</script>

<div class="p-1 text-gray-500 w-16 flex justify-end h-min">
  {#await questionLikesPromise}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-6"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  {:then result}
    <button
      class={`flex items-center gap-1 ${result.likedByUser ? "text-gray-700 hover:text-gray-500" : "hover:text-red-500"}`}
      on:click={() => {
        if (result.likedByUser) {
          return removeLike(id);
        }
        return addLike(id);
      }}
      >{result.likes > 100 ? "99+" : result.likes}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class={`size-6 ${result.likedByUser ? "fill-current" : ""}`}
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    </button>
  {:catch error}
    <div class="flex items-center gap-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="size-6"
      >
        <path
          fill-rule="evenodd"
          d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  {/await}
</div>
