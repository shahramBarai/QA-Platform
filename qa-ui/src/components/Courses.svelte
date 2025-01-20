<script>
  const getCourses = async () => {
    const response = await fetch("/api/courses");
    return await response.json();
  };

  let coursesPromise = getCourses();
</script>

<div>
  <h1 class="text-2xl font-bold pb-4">Courses</h1>
  {#await coursesPromise}
    <p>Loading...</p>
  {:then courses}
    {#if courses.length === 0}
      <p>No courses available</p>
    {:else}
      <div class="flex flex-col gap-1">
        {#each courses as course}
          <div
            class="relative py-2 px-3 w-full flex flex-col border rounded-lg hover:bg-gray-100"
          >
            <a class="hover:text-blue-600 truncate" href="/courses/{course.id}">
              {course.name}
              <span class="absolute inset-0" aria-hidden="true" />
            </a>
          </div>
        {/each}
      </div>
    {/if}
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>
