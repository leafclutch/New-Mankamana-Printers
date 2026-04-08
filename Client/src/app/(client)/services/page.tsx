"use client";

import Link from "next/link";
import { SERVICES } from "@/constants";
import Image from "next/image";

export default function ServicesPage() {
    return (
        <div className="py-10 px-10">
            <div className="mb-8 flex flex-col items-center">
                <h2 className="text-4xl font-bold">Printing Services</h2>
                <div className="divider mt-2 h-[4px] rounded-full w-32 bg-blue-500 my-4" />
                <p className="max-w-[50%] text-center text-[#64748b] text-[0.875rem] mt-1">
                    Choose from our range of premium printing services. All prices are wholesale B2B rates.
                </p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                {SERVICES.map((service) => (
                    <div key={service.id} className="card cursor-pointer">
                        {/* Preview image / icon area */}
                        <div className="h-[160px] relative overflow-hidden">
                            {service.image ? (
                                <Image src={service.image} alt={service.name} fill className="" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center text-[3.5rem]">📄</div>
                            )}
                            <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-mid)] text-white rounded-[50px] px-2.5 py-[3px] text-[0.6rem] font-bold tracking-[0.06em]">
                                B2B
                            </span>
                        </div>

                        <div className="p-5">
                            <h3 className="font-bold text-base mb-1.5">{service.name}</h3>

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-[0.65rem] text-[#94a3b8] font-semibold tracking-[0.08em] uppercase">Minimum Quantity</div>
                                    <div className="font-bold text-[#0f172a] text-[0.9rem]">{service.minimumQuantity.toLocaleString()} pcs</div>
                                </div>
                            </div>

                            <Link
                                href={`/orders/create?service=${encodeURIComponent(service.name)}`}
                                className="btn-primary w-full text-center block p-2.5"
                            >
                                Create Order
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
