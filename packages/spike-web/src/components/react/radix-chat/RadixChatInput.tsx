import { useState, useRef, useCallback } from "react";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  accent?: string;
  placeholder?: string;
}

// Check if Web Speech API is available
const HAS_SPEECH =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export function RadixChatInput({
  onSend,
  disabled,
  accent = "#0d9488",
  placeholder = "Message...",
}: Props) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    navigator.vibrate?.(10);
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = value;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
        } else {
          interim = transcript;
        }
      }
      setValue(finalTranscript + (interim ? " " + interim : ""));
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      // Auto-send if we have text and recognition ended naturally (silence timeout)
      if (finalTranscript.trim()) {
        setValue(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setIsListening(true);
    navigator.vibrate?.(20);
  }, [isListening, value]);

  const isActive = !disabled && value.trim().length > 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "0.5rem",
        padding: "0.75rem",
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        background: "#fff",
      }}
    >
      {/* Mic button */}
      {HAS_SPEECH && (
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          style={{
            minWidth: "44px",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "none",
            background: isListening ? "#ef4444" : "rgba(0,0,0,0.06)",
            color: isListening ? "#fff" : "rgba(0,0,0,0.5)",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "background 0.15s, color 0.15s, transform 0.15s",
            transform: isListening ? "scale(1.1)" : "scale(1)",
            animation: isListening ? "pulse 1.5s ease-in-out infinite" : "none",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : placeholder}
        disabled={disabled}
        enterKeyHint="send"
        rows={1}
        style={{
          flex: 1,
          minHeight: "44px",
          maxHeight: "120px",
          padding: "0.625rem 0.875rem",
          fontSize: "max(16px, 1em)",
          lineHeight: "1.45",
          border: `1px solid ${isListening ? accent : "rgba(0,0,0,0.12)"}`,
          borderRadius: "1.25rem",
          background: isListening ? `${accent}08` : "rgba(0,0,0,0.03)",
          color: "inherit",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.15s, background 0.15s",
        }}
      />

      {/* Send button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isActive}
        aria-label="Send message"
        style={{
          minWidth: "44px",
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "none",
          background: isActive ? accent : "rgba(0,0,0,0.12)",
          color: isActive ? "#fff" : "rgba(0,0,0,0.3)",
          cursor: isActive ? "pointer" : "not-allowed",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-9-9-4z" />
        </svg>
      </button>

      {/* Pulse animation for mic */}
      {isListening && (
        <style>{`
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          }
        `}</style>
      )}
    </div>
  );
}
