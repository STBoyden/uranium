import { invoke } from "@tauri-apps/api/core";
import { Data, Effect, pipe, Schema } from "effect";
import { capitalised } from "./functions";

const requirementsFieldSchema = Schema.Union(
  Schema.Literal("Met"),
  Schema.Struct({ NotMet: Schema.Struct({ message: Schema.String }) }),
);

export const getRequirementData = (
  key: string,
  state: (typeof requirementsFieldSchema)["Type"],
) => {
  let stateMessage = null;
  if (state !== "Met") {
    stateMessage = state.NotMet.message;
  }

  return {
    ok: stateMessage === null,
    key: capitalised(key.replaceAll("_", " ")),
    message: stateMessage,
  };
};

export const InvokeMap = {
  get_operating_system_type: {
    args: Schema.Void,
    returns: Schema.Literal("Linux", "MacOS", "Windows"),
  },
  get_requirements: {
    args: Schema.Void,
    returns: Schema.Struct({
      all_met: Schema.Boolean,
      operating_system: requirementsFieldSchema,
      architecture: requirementsFieldSchema,
      steam: requirementsFieldSchema,
      mw3_path: Schema.NullOr(Schema.String),
      bo2_path: Schema.NullOr(Schema.String),
      bo2_mp_path: Schema.NullOr(Schema.String),
      bo1_path: Schema.NullOr(Schema.String),
      bo1_mp_path: Schema.NullOr(Schema.String),
      waw_path: Schema.NullOr(Schema.String),
    }),
  },
  is_setup: { args: Schema.Void, returns: Schema.Boolean },
} as const;

type InvokeMapType = typeof InvokeMap;
type InvokeMapKeys = keyof InvokeMapType;

type InvokeArgs<K extends InvokeMapKeys> =
  InvokeMapType[K]["args"]["Type"] extends Record<string, any>
    ? InvokeMapType[K]["args"]["Type"]
    : never;
export type InvokeReturnType<K extends InvokeMapKeys> =
  InvokeMapType[K]["returns"]["Type"];

type InvokeMapKeysWithArgs<Fn extends InvokeMapKeys> =
  InvokeMapType[Fn]["args"]["Type"] extends void ? false : true;
type InvokeMapKeysWithNoArgs<Fn extends InvokeMapKeys> =
  InvokeMapType[Fn]["args"]["Type"] extends void ? true : false;

type AllWithNoArgs = {
  [K in InvokeMapKeys]: InvokeMapKeysWithNoArgs<K> extends true ? K : never;
}[InvokeMapKeys];

type AllWithArgs = {
  [K in InvokeMapKeys]: InvokeMapKeysWithArgs<K> extends true ? K : never;
}[InvokeMapKeys];

export async function safeInvoke<
  Fn extends AllWithNoArgs,
  R extends InvokeReturnType<Fn>,
>(fn: Fn): Promise<R>;

export async function safeInvoke<
  Fn extends AllWithArgs,
  Args extends InvokeArgs<Fn>,
  R extends InvokeReturnType<Fn>,
>(fn: Fn, args: Args): Promise<R>;

export async function safeInvoke<
  Fn extends InvokeMapKeys,
  Args extends InvokeArgs<Fn>,
  R extends InvokeReturnType<Fn>,
>(fn: Fn, args?: Args) {
  if (args) {
    return (await invoke(fn, { ...(args as Record<string, any>) })) as R;
  } else {
    return (await invoke(fn)) as R;
  }
}

class InvokeError extends Data.TaggedError("InvokeError")<{
  function: InvokeMapKeys;
  error: unknown;
}> {}

export function effectfulInvoke<
  Fn extends AllWithNoArgs,
  R extends InvokeReturnType<Fn>,
>(fn: Fn): Effect.Effect<R, InvokeError>;

export function effectfulInvoke<
  Fn extends AllWithArgs,
  Args extends InvokeArgs<Fn>,
  R extends InvokeReturnType<Fn>,
>(fn: Fn, args: Args): Effect.Effect<R, InvokeError>;

export function effectfulInvoke<
  Fn extends InvokeMapKeys,
  Args extends InvokeArgs<Fn>,
  R extends InvokeReturnType<Fn>,
>(fn: Fn, args?: Args) {
  return Effect.gen(function* () {
    const effect = args
      ? Effect.tryPromise(
          () => invoke(fn, { ...(args as Record<string, any>) }) as Promise<R>,
        )
      : Effect.tryPromise(() => invoke(fn) as Promise<R>);

    return yield* pipe(
      effect,
      Effect.mapError((error) => new InvokeError({ function: fn, error })),
    );
  });
}
