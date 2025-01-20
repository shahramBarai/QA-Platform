<script>
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import SuccessIcon from "./icons/SuccessIcon.svelte";
  import ErrorIcon from "./icons/ErrorIcon.svelte";
  import InfoIcon from "./icons/InfoIcon.svelte";
  import CloseIcon from "./icons/CloseIcon.svelte";

  const dispatch = createEventDispatcher();

  export let type = "error";
  export let dismissible = true;
</script>

<article
  class={`text-white py-3 px-6 rounded-md flex items-center mt-0 mb-2 mx-auto w-96 ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-blue-500"
  }`}
  role="alert"
  transition:fade
>
  <div>
    {#if type === "success"}
      <SuccessIcon width="20px" />
    {:else if type === "error"}
      <ErrorIcon width="20px" />
    {:else}
      <InfoIcon width="20px" />
    {/if}
  </div>

  <div class="ml-4">
    <slot />
  </div>

  {#if dismissible}
    <button
      class="text-white bg-transparent border-0 p-0 m-0 ml-auto text-base"
      on:click={() => dispatch("dismiss")}
    >
      <CloseIcon width="0.8em" />
    </button>
  {/if}
</article>
