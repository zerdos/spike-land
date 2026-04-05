// Constants for validation
const MAX_MESSAGE_LENGTH = 100000; // 100KB per message
const MAX_MESSAGES_COUNT = 100;
const VALID_ROLES = ["user", "assistant", "system"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

export { MAX_MESSAGE_LENGTH, MAX_MESSAGES_COUNT, VALID_ROLES };
export type { ValidRole };

/** A validated message object with known structure. */
interface MessageObject {
  role: unknown;
  content?: unknown;
  parts?: unknown;
  [key: string]: unknown;
}

/** Narrows an unknown array element to a typed message object after a null/object check. */
function isMessageObject(msg: unknown): msg is MessageObject {
  return msg !== null && typeof msg === "object" && !Array.isArray(msg);
}

/** Narrows an array element to a typed content-part object after an Array.isArray check. */
function isContentPart(part: unknown): part is { type: unknown; [key: string]: unknown } {
  return (
    part !== null && typeof part === "object" && !Array.isArray(part) && "type" in (part as object)
  );
}

/**
 * Pure validation function for messages array.
 * Returns null if valid, or an error string describing the issue.
 */
export function validateMessages(messages: unknown): string | null {
  if (!messages || !Array.isArray(messages)) {
    return "Messages must be an array";
  }

  if (messages.length === 0) {
    return "Messages array cannot be empty";
  }

  if (messages.length > MAX_MESSAGES_COUNT) {
    return `Too many messages. Maximum allowed: ${MAX_MESSAGES_COUNT}`;
  }

  for (let i = 0; i < messages.length; i++) {
    const msg: unknown = messages[i];

    if (!isMessageObject(msg)) {
      return `Message at index ${i} must be an object`;
    }

    if (typeof msg.role !== "string" || !VALID_ROLES.includes(msg.role as ValidRole)) {
      return `Message at index ${i} must have a valid role (${VALID_ROLES.join(", ")})`;
    }

    // Support both 'content' and 'parts' fields
    const hasContent = msg.content !== undefined;
    const hasParts = msg.parts !== undefined;

    if (!hasContent && !hasParts) {
      return `Message at index ${i} must have either 'content' or 'parts'`;
    }

    // Check message size
    const messageSize = JSON.stringify(msg).length;
    if (messageSize > MAX_MESSAGE_LENGTH) {
      return `Message at index ${i} exceeds maximum size limit`;
    }

    // Validate content structure if present
    if (hasContent) {
      if (typeof msg.content !== "string" && !Array.isArray(msg.content)) {
        return `Message at index ${i} content must be a string or array`;
      }

      if (Array.isArray(msg.content)) {
        for (let j = 0; j < msg.content.length; j++) {
          if (!isContentPart(msg.content[j])) {
            return `Message at index ${i}, content part ${j} must have a type`;
          }
        }
      }
    }

    // Validate parts structure if present
    if (hasParts) {
      if (!Array.isArray(msg.parts)) {
        return `Message at index ${i} parts must be an array`;
      }
      for (let j = 0; j < msg.parts.length; j++) {
        if (!isContentPart(msg.parts[j])) {
          return `Message at index ${i}, part ${j} must have a type`;
        }
      }
    }
  }

  return null;
}
