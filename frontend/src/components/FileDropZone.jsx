import { useEffect, useRef, useState } from "react";
import { CloudUpload, X } from "lucide-react";

const acceptedExtensions = [".pdf", ".docx", ".txt"];

function truncateName(name) {
  return name.length > 24 ? `${name.slice(0, 24)}...` : name;
}

export function FileDropZone({ accept = ".pdf,.docx,.txt", onFilesChange, multiple = true, initialFiles = [] }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState(initialFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const commitFiles = (incomingFiles) => {
    const nextFiles = Array.from(incomingFiles || []);
    const invalidFile = nextFiles.find(
      (file) => !acceptedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension)),
    );

    if (invalidFile) {
      setError("Only PDF, DOCX, and TXT files are supported.");
      return;
    }

    setError("");
    setFiles(nextFiles);
    onFilesChange?.(nextFiles);
  };

  const removeFile = (fileName) => {
    const nextFiles = files.filter((file) => file.name !== fileName);
    setFiles(nextFiles);
    onFilesChange?.(nextFiles);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          commitFiles(event.dataTransfer.files);
        }}
        className={`w-full cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors duration-200 ${
          isDragging
            ? "border-[var(--primary)] bg-[var(--primary-muted)]"
            : "border-[var(--border)] bg-white hover:border-[var(--primary)]"
        }`}
      >
        <CloudUpload className="mx-auto h-8 w-8 text-[#B0A89A]" />
        <p className="mt-3 text-sm font-medium text-[var(--text-muted)]">
          Drop files <span className="text-[var(--text-muted)]">or</span>{" "}
          <span className="font-semibold text-[var(--primary)]">browse</span>
        </p>
        {!files.length && !isDragging ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">No files selected</p>
        ) : null}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => commitFiles(event.target.files)}
      />

      {error ? <p className="mt-2 text-[13px] font-medium text-[var(--danger)]">{error}</p> : null}

      {files.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file) => (
            <span
              key={`${file.name}-${file.size}`}
              className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--primary-muted)] px-3 py-1 text-[13px] font-semibold text-[var(--primary)]"
              title={file.name}
            >
              <span className="truncate">{truncateName(file.name)}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeFile(file.name);
                }}
                className="rounded-full text-[var(--primary)] hover:text-[var(--danger)]"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
