"use client";

import React from "react";

// ─── ProductImageCarousel ─────────────────────────────────────────────────────

interface ProductImageCarouselProps {
    images: string[];
    productCode: string;
    activeIndex: number;
    onDotClick: (i: number) => void;
}

export function ProductImageCarousel({ images, productCode, activeIndex, onDotClick }: ProductImageCarouselProps) {
    const n = images.length;
    const slidePct = n > 0 ? 100 / n : 100;
    const safeIndex = n > 0 ? Math.min(Math.max(0, activeIndex), n - 1) : 0;

    const placeholder = (
        <div className="flex flex-col items-center justify-center py-12 px-8 text-center w-full">
            <div className="text-gray-300 text-8xl mb-2">📇</div>
            <p className="text-gray-500 text-sm font-medium">{productCode}</p>
            <p className="text-gray-400 text-xs mt-1">Image Coming Soon</p>
        </div>
    );

    if (n === 0) {
        return (
            <div className="relative w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center" style={{ minHeight: 260 }}>
                {placeholder}
            </div>
        );
    }

    return (
        <div className="relative w-full rounded-xl overflow-hidden bg-gray-100" style={{ minHeight: 260 }}>
            <div
                className="relative flex"
                style={{
                    width: `${n * 100}%`,
                    transform: `translateX(-${slidePct * safeIndex}%)`,
                    transition: "transform 0.5s ease-in-out",
                }}
            >
                {images.map((src, i) => (
                    <div
                        key={`${src}-${i}`}
                        className="flex items-center justify-center box-border px-2 py-4"
                        style={{ flex: `0 0 ${slidePct}%`, minHeight: 260 }}
                    >
                        {src ? (
                            <img
                                src={src}
                                alt={`${productCode} — image ${i + 1}`}
                                className="object-contain rounded-lg max-h-[300px] w-auto max-w-full shadow-md"
                                style={{ background: "#f9f9f9" }}
                            />
                        ) : (
                            placeholder
                        )}
                    </div>
                ))}
            </div>

            {n > 1 && (
                <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onDotClick(i)}
                            className="w-3 h-3 rounded-full border-2 border-white transition-all shadow-sm"
                            style={{ background: i === activeIndex ? "gray" : "white", opacity: i === activeIndex ? 1 : 0.8 }}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
