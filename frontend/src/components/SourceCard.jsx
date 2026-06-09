import { useRef, useState } from "react";
import { CloudUpload, Check, X } from "lucide-react";

export function SourceCard({ icon: Icon, title, subtitle, files = [], onFilesChange }) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const simulateUpload = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      return [".pdf", ".docx", ".txt"].includes(ext);
    });

    validFiles.forEach((file) => {
      const fileId = file.name + "-" + Math.random();
      setUploadingFiles((prev) => [...prev, { id: fileId, name: file.name, progress: 0 }]);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadingFiles((prev) =>
          prev.map((item) => (item.id === fileId ? { ...item, progress: Math.min(100, progress) } : item))
        );

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((item) => item.id !== fileId));
            onFilesChange((existing) => {
              if (existing.some((f) => f.name === file.name)) return existing;
              return [...existing, { name: file.name, size: file.size }];
            });
          }, 200);
        }
      }, 150); // 1.5 seconds total
    });
  };

  const handleDrag = (event) => {
    event.preventDefault();
    if (event.type === "dragover") {
      setIsDragActive(true);
    } else if (event.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      simulateUpload(event.dataTransfer.files);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      simulateUpload(event.target.files);
    }
  };

  const removeFile = (fileName) => {
    onFilesChange((existing) => existing.filter((f) => f.name !== fileName));
  };

  return (
    <article className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-[#E2E8F0]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold text-[#111827] truncate text-sm">{title}</h3>
          <p className="text-xs text-[#6B7280] truncate">{subtitle}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed p-4 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-[#2563EB] bg-[#EFF6FF]"
            : "border-[#93C5FD] bg-[#F8FAFF] hover:border-[#2563EB]"
        }`}
      >
        <CloudUpload className="h-6 w-6 text-[#9CA3AF] mb-1.5" />
        <p className="text-xs text-[#6B7280]">
          Drop files or <span className="font-bold text-[#2563EB] hover:underline">browse</span>
        </p>
        <p className="text-[10px] text-[#9CA3AF] mt-1">No files selected</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Uploading Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-1.5 mt-1">
          {uploadingFiles.map((file) => (
            <div key={file.id} className="text-xs">
              <div className="flex justify-between text-[11px] font-semibold text-[#6B7280] truncate mb-0.5">
                <span>{file.name}</span>
                <span>{file.progress}%</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#2563EB] h-full rounded-full transition-all duration-150"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-1.5 mt-1">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between gap-2 bg-[#EFF6FF] rounded-lg px-2.5 py-1 text-xs text-[#2563EB] font-medium"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Check className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.name);
                }}
                className="text-[#6B7280] hover:text-[#DC2626]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
