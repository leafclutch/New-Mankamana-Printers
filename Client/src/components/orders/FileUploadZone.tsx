"use client";

import React, { useRef, useState, useCallback } from "react";

// ─── FileUploadZone ───────────────────────────────────────────────────────────

interface FileUploadZoneProps {
    file: File | null;
    onFile: (f: File | null) => void;
}

export function FileUploadZone({ file, onFile }: FileUploadZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) onFile(dropped);
        },
        [onFile]
    );

    return (
        <div className="mt-3">
            {/* Instruction banners */}
            <div className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-t-lg">
                PDF, CDR, PSD, JPEG and PNG file formats are accepted!
            </div>
            <div className="bg-green-50 border border-green-300 text-green-900 text-sm px-4 py-2 rounded-b-lg mb-3">
                Please keep cutting margin, CMYK color and other given instructions in mind while making the file, so that there is no error in printing!
            </div>

            {/* Drop zone */}
            <div
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-8 px-4 cursor-pointer transition-colors select-none ${
                    dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <div className="text-4xl text-blue-500 mb-2">☁️</div>
                <p className="font-bold text-gray-800 text-sm">Drag &amp; Drop file here</p>
                <p className="text-gray-500 text-xs mt-1">or Click to Browse</p>
                <p className="text-gray-500 text-xs mt-1">
                    Supports PDF, CDR, PSD, JPG, PNG{" "}
                    <span className="text-red-500 font-semibold">(Max 100MB)</span>
                </p>
                {file && (
                    <div className="mt-3 flex items-center gap-2 bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full">
                        <span>📎</span>
                        <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onFile(null); }}
                            className="ml-1 text-blue-600 hover:text-red-500"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.cdr,.psd,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}
