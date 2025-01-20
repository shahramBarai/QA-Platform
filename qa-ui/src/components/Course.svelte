<script>
  import { userInfo, addToast } from "../stores/stores.js";
  import Toasts from "./Toasts.svelte";
  import LikeButton from "./LikeButton.svelte";
  import NavBar from "./NavBar.svelte";

  export let courseId;
  let offset = 0;
  let loading = false;
  let allQuestionsLoaded = false;
  let questions = [];

  const getCourse = async () => {
    const response = await fetch(`/api/courses/${courseId}`);
    return await response.json();
  };

  const getQuestions = async (offset = 0) => {
    const response = await fetch(
      `/api/courses/${courseId}/questions?offset=${offset}&limit=20`
    );
    return await response.json();
  };

  const loadMoreQuestions = async () => {
    if (loading || allQuestionsLoaded) return;

    loading = true;
    try {
      const newQuestions = await getQuestions(offset);
      if (newQuestions.length < 20) {
        allQuestionsLoaded = true;
      }
      questions = [...questions, ...newQuestions];
      offset += newQuestions.length;
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      loading = false;
    }
  };

  const handleScroll = async (event) => {
    const target = event.target;
    const bottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 50;

    if (bottom && !loading && !allQuestionsLoaded) {
      loading = true;
      setTimeout(async () => {
        loading = false;
        await loadMoreQuestions();
      }, 1000);
    }
  };

  let coursePromise = getCourse();

  let input = "";
  const addQuestion = async () => {
    if (input.length === 0) {
      return;
    }

    const response = await fetch(`/api/courses/${courseId}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: input, userUuid: $userInfo.uuid }),
    });

    if (response.ok) {
      input = "";
      offset = 0;
      allQuestionsLoaded = false;
      questions = [];
      loadMoreQuestions();
      addToast({
        message: "Question created successfully",
        type: "success",
        timeout: 2000,
      });
    } else if (response.status === 429) {
      addToast({
        message:
          "You can post only one question per minute. Please wait a while before trying again.",
        type: "info",
        timeout: 5000,
      });
    } else {
      addToast({
        message: "Failed to create question",
        type: "error",
        timeout: 2000,
      });
    }
  };

  const formatDate = (date) => {
    const localeDate = new Date(date).toLocaleString();
    return localeDate.toLocaleString();
  };

  // Initial load
  loadMoreQuestions();
</script>

<Toasts />

<div class="h-full">
  {#await coursePromise}
    <p>Loading...</p>
  {:then courseInfo}
    <!-- Navigation bar -->
    <NavBar
      options={[{ name: "Courses", href: "/" }, { name: courseInfo.name }]}
    />
    <!-- Course name -->
    <h1 class="text-2xl font-bold pb-4">
      {courseInfo.name}
    </h1>
    <!-- Form for creating new question -->
    <div class="pb-4">
      <h2 class="text-xl font-bold pb-2">Create a new question</h2>
      <div class="flex gap-2 items-center">
        <input
          type="text"
          bind:value={input}
          class="border border-gray-300 rounded p-1"
        />
        <button
          type="submit"
          class={`text-white rounded py-1 px-2 ${
            input.length === 0 ? "bg-blue-300" : "bg-blue-600"
          }`}
          disabled={input.length === 0}
          on:click={addQuestion}
        >
          Create
        </button>
      </div>
    </div>
    <!-- List of questions -->
    <h2 class="text-xl font-bold pb-2">Questions</h2>
    <div class="pb-4 h-[500px] overflow-y-auto snap-y" on:scroll={handleScroll}>
      {#if questions.length === 0}
        <p>No questions available</p>
      {:else}
        <div class="flex flex-col gap-1">
          {#each questions as question}
            <div
              class="relative py-2 px-3 w-full flex flex-col border rounded-lg hover:bg-gray-100 snap-start"
            >
              <a
                class="hover:text-blue-600 truncate"
                href="/questions/{question.id}"
              >
                {question.question}
                <span class="absolute inset-0" aria-hidden="true"></span>
              </a>
              <div class="z-10 flex justify-between items-center">
                <span class="text-sm text-gray-500">
                  Created at: {formatDate(question.created_at)}
                </span>
                <LikeButton type="questions" id={question.id} />
              </div>
            </div>
          {/each}
        </div>

        {#if loading}
          <p class="text-center mt-4">Loading more questions...</p>
        {/if}

        {#if allQuestionsLoaded}
          <p class="text-center mt-4 text-gray-500">
            No more questions to load
          </p>
        {/if}
      {/if}
    </div>
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>
