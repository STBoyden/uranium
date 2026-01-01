import { safeInvoke, type InvokeReturnType } from "$lib/utils/tauri";
import { createContext } from "svelte";

export class System {
  private _type: InvokeReturnType<"get_operating_system_type"> | "Unknown" =
    $state("Unknown");
  readonly type = $derived(this._type);

  requirements: InvokeReturnType<"get_requirements"> | undefined =
    $state(undefined);

  gamepads: Gamepad[] = $state([]);
  readonly gamepadConnected = $derived(this.gamepads.length > 0);

  private _isSetup: boolean | undefined = $state(undefined);
  readonly isSetup = $derived(this._isSetup);

  readonly supported = $derived.by(() => this.type === "Linux");

  constructor() {
    this.refresh();
  }

  async refresh() {
    this._type = await safeInvoke("get_operating_system_type");
    this.requirements = await safeInvoke("get_requirements");
    this._isSetup = await safeInvoke("is_setup");
  }
}

export const [getSystemContext, setSystemContext] = createContext<System>();

export function initialiseSystemContext() {
  return setSystemContext(new System());
}
