<script lang="ts">
  import { getSystemContext } from "$lib/stores/System.svelte";
  import { getRequirementData } from "$lib/utils/tauri";
  import { Button } from "$lib/components/ui/button";
  import { CornerDownRight, ListRestart } from "@lucide/svelte";
  import { wait } from "$lib/utils/functions";
  import { goto } from "$app/navigation";

  type RequirementKeys = keyof Pick<
    NonNullable<typeof system.requirements>,
    "architecture" | "operating_system" | "steam"
  >;
  type RequirementType = NonNullable<typeof system.requirements>[
    | "architecture"
    | "operating_system"];
  type PathType = keyof Pick<
    NonNullable<typeof system.requirements>,
    | "mw3_path"
    | "bo2_path"
    | "bo2_mp_path"
    | "bo1_path"
    | "bo1_mp_path"
    | "waw_path"
  >;

  const GAME_LABELS = {
    mw3_path: "Modern Warfare 3",
    bo2_path: "Black Ops 2",
    bo2_mp_path: "Black Ops 2 Multiplayer",
    bo1_path: "Black Ops",
    bo1_mp_path: "Black Ops Multiplayer",
    waw_path: "World at War",
  } as const;

  const system = $derived(getSystemContext());
  const disabled = $derived.by(() => !(system.requirements?.all_met ?? false));

  $effect(() => {
    if (system.requirements?.all_met) {
      goto("/dashboard", { replaceState: true });
    }
  });
</script>

{#snippet requirement(tag: RequirementKeys, data: RequirementType)}
  {@const { ok, key, message } = getRequirementData(tag, data)}
  <li>
    {ok ? "✅" : "🚨"}
    <span class={ok ? "font-normal" : "font-bold"}>
      {#if tag === "steam"}
        {ok ? "Steam installed." : ""}
      {:else}
        {ok ? `${key}.` : `${key}:`}
      {/if}
    </span>

    {#if message}
      {@html message}
    {/if}
  </li>
{/snippet}

{#snippet optional(key: PathType, path: string | null)}
  <li>
    {path ? "✅" : "⚠️"}
    <span class={path ? "font-bold" : "font-normal"}>
      {path
        ? `${GAME_LABELS[key]} installed:`
        : `${GAME_LABELS[key]} not installed (requires Steam). `}
    </span>
    {#if path}
      <span class="font-mono">{path}</span>
    {/if}
  </li>
{/snippet}

<main
  class="align-middle items-center justify-center content-center h-full w-full"
>
  <div class="prose dark:prose-invert mx-auto">
    <h2>Uranium Launcher</h2>
    <p>Native Linux Plutonium manager, for launching older CoD titles.</p>

    <div>
      <p>Requirements:</p>

      {#if system.requirements}
        <ul>
          {#each Object.entries(system.requirements) as entries (entries[0])}
            {#if typeof entries[1] === "boolean"}{:else if entries[1] as RequirementType}
              {@render requirement(
                entries[0] as RequirementKeys,
                entries[1] as RequirementType,
              )}
            {:else if entries[0] as PathType}
              {@render optional(entries[0] as PathType, entries[1] as PathType)}
            {/if}
          {/each}
        </ul>
      {:else}
        <p class="text-center w-full italic">Loading...</p>
      {/if}
    </div>

    <span class="flex">
      <Button
        tabindex={0}
        class="mr-auto cursor-pointer disabled:cursor-default"
        {disabled}
      >
        <CornerDownRight class="w-[1em] h-[1em]" />
        Continue
      </Button>
      <Button
        tabindex={1}
        variant="outline"
        onclick={async () => {
          system.requirements = undefined;
          await wait(500);

          system.refresh();
        }}
        class="cursor-pointer"
      >
        <ListRestart class="w-[1em] h-[1em]" />
        Re-check
      </Button>
    </span>
  </div>
</main>
