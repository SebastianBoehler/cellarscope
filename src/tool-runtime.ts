export function readOnlyAnnotations() {
  return {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
    idempotentHint: true,
  };
}

export function textJson<T extends object>(structuredContent: T) {
  return [{ type: "text" as const, text: JSON.stringify(structuredContent) }];
}

export function errorResponse(message: string) {
  const structuredContent = { error: message };
  return {
    structuredContent,
    content: textJson(structuredContent),
    _meta: { error: message },
  };
}

export async function runTool<T>(loader: () => Promise<T>) {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse("Unknown CellarScope tool error.");
  }
}
