<script>
  import { userInfo, addToast } from "../stores/stores.js";
  import NavBar from "./NavBar.svelte";
  import LikeButton from "./LikeButton.svelte";
  import Toasts from "./Toasts.svelte";

  export let questionId;
  let offset = 0;
  let loading = false;
  let allAnswersLoaded = false;
  let answers = [];

  const getQuestionInfo = async () => {
    const response = await fetch(`/api/questions/${questionId}`);
    return await response.json();
  };

  const getAnswers = async (offset = 0) => {
    const response = await fetch(
      `/api/questions/${questionId}/answers?offset=${offset}&limit=20`
    );
    return await response.json();
  };

  const loadMoreAnswers = async () => {
    if (loading || allAnswersLoaded) return;

    loading = true;
    try {
      const newAnswers = await getAnswers(offset);
      if (newAnswers.length < 20) {
        allAnswersLoaded = true;
      }
      answers = [...answers, ...newAnswers];
      offset += newAnswers.length;
    } catch (error) {
      console.error("Failed to load answers:", error);
    } finally {
      loading = false;
    }
  };

  const handleScroll = async (event) => {
    const target = event.target;
    const bottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 50;

    if (bottom && !loading && !allAnswersLoaded) {
      loading = true;
      setTimeout(async () => {
        loading = false;
        await loadMoreAnswers();
      }, 1000);
    }
  };

  let questionPromise = getQuestionInfo();

  let input = "";
  const addAnswer = async () => {
    if (input.length === 0) {
      return;
    }

    const response = await fetch(`/api/questions/${questionId}/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answer: input, userUuid: $userInfo.uuid }),
    });

    if (response.ok) {
      input = "";
      offset = 0;
      allAnswersLoaded = false;
      answers = [];
      loadMoreAnswers();
      addToast({
        message: "Answer created successfully",
        type: "success",
        timeout: 2000,
      });
    } else if (response.status === 429) {
      addToast({
        message:
          "You can post only one answer per minute. Please wait a while before trying again.",
        type: "info",
        timeout: 5000,
      });
    } else {
      addToast({
        message: "Failed to create answer",
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
  loadMoreAnswers();
</script>

<Toasts />

<div class="h-full">
  {#await questionPromise}
    <p>Loading...</p>
  {:then question}
    <!-- Navigation bar -->
    <NavBar
      options={[
        { name: "Courses", href: "/" },
        { name: question.courseName, href: `/courses/${question.courseId}` },
        { name: "Questions" },
      ]}
    />
    <!-- Question -->
    <h1 class="text-2xl font-bold pb-4">{question.question}</h1>
    <!-- Form for creating new question -->
    <div class="pb-4">
      <h2 class="text-xl font-bold pb-2">Create a new answer</h2>
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
          on:click={addAnswer}
        >
          Create
        </button>
      </div>
    </div>
    <!-- List of answers -->
    <h2 class="text-xl font-bold pb-2">Answers</h2>
    <div
      class="h-[500px] pb-4 flex flex-col overflow-y-auto snap-y pr-1"
      on:scroll={handleScroll}
    >
      {#if answers.length === 0}
        <p>No answers available</p>
      {:else}
        {#each answers as answer}
          <div class="flex gap-2 snap-start">
            <div class="text-gray-500 text-nowrap pt-1">
              ({formatDate(answer.created_at)})
            </div>
            <div class="flex w-full justify-between pt-1">
              <span>{answer.answer}</span>
              <LikeButton type="answers" id={answer.id} />
            </div>
          </div>
        {/each}

        {#if loading}
          <p class="text-center mt-4">Loading...</p>
        {/if}

        {#if allAnswersLoaded}
          <p class="text-center mt-4 text-gray-500">All answers loaded</p>
        {/if}
      {/if}
    </div>
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>
