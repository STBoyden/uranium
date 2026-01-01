<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import "../app.css";
  import {
    getSystemContext,
    initialiseSystemContext,
  } from "$lib/stores/System.svelte";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import "tauri-plugin-gamepad-api";

  const { children } = $props();

  initialiseSystemContext();

  const system = getSystemContext();
  let loading = $state(false);

  $effect(() => {
    if (system.isSetup !== undefined && !system.isSetup) {
      loading = false;
      goto("/first-time-setup", { replaceState: true });
    } else if (system.isSetup) {
      loading = false;
      goto("/dashboard", { replaceState: true });
    } else {
      loading = true;
    }
  });

  onMount(() => {
    function updateGamepads() {
      system.gamepads = navigator.getGamepads().filter((g) => g !== null);
    }

    setInterval(updateGamepads, 100);

    window.ongamepadconnected = updateGamepads;
    window.ongamepaddisconnected = updateGamepads;
  });
</script>

<div class="w-full h-full select-none">
  <ModeWatcher />

  {#if loading}
    <div
      class="prose w-full h-full align-middle items-center justify-center content-center"
    >
      <h1 class="mx-auto w-full text-center">Loading...</h1>
    </div>
  {:else}
    <div class="p-4 h-full w-full">
      {@render children()}
    </div>
  {/if}
</div>
