<script lang="ts">
  import Toast from "./Toast.svelte";

  import { dismissToast, toasts } from "../stores/stores.js";
</script>

{#if $toasts}
  <section
    class="fixed top-0 left-0 right-0 w-full flex mt-4 justify-center flex-col z-40"
  >
    {#each $toasts as toast (toast.id)}
      <Toast
        type={toast.type}
        dismissible={toast.dismissible}
        on:dismiss={() => dismissToast(toast.id)}>{toast.message}</Toast
      >
    {/each}
  </section>
{/if}
