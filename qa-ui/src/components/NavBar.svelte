<script>
  export let options = [{ name: "Home", href: "/" }];
</script>

<div class="pb-4 flex gap-4 items-center">
  {#each options as option}
    {#if option.href}
      <a href={option.href} class="text-blue-600 hover:text-blue-800"
        >{option.name}</a
      >
    {:else}
      <span>{option.name}</span>
    {/if}
    {#if option !== options[options.length - 1]}
      <span>{">"}</span>
    {/if}
  {/each}
</div>
