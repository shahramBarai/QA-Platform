<script>
  import { userInfo } from "../stores/stores.js";

  let showUserInfo = false;

  const logOut = async () => {
    localStorage.removeItem("userUuid");
    location.href = "/";
  };
</script>

<nav class="relative px-4 py-3 mb-4 border-b flex justify-between items-center">
  <a href="/" class="text-2xl text-gray-700 flex gap-2 items-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-10"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
      />
    </svg>
    <span class="font-serif">Q&A</span>
  </a>
  <button
    class=""
    aria-label="Toggle user info"
    on:click={() => {
      showUserInfo = !showUserInfo;
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="size-10 hover:text-gray-500 hover:cursor-pointer"
    >
      <path
        fill-rule="evenodd"
        d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
  {#if showUserInfo}
    <div
      class="absolute right-3 top-14 z-50 w-fit bg-gray-100 border rounded-lg p-2 flex flex-col gap-2"
    >
      <div class="flex flex-col">
        You are logged in as
        <span class="font-semibold">{$userInfo.uuid}</span>
      </div>
      <button
        class="text-blue-600 cursor-pointer text-right"
        on:click={() => logOut()}
      >
        Log out
      </button>
    </div>
  {/if}
</nav>
{#if showUserInfo}
  <span class="absolute inset-0 bg-black/30 z-40" aria-hidden="true">
    <button
      class="absolute inset-0 w-full h-full cursor-default"
      aria-label="Close user info"
      on:click={() => {
        showUserInfo = false;
      }}
    ></button>
  </span>
{/if}
