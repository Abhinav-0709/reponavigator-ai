"use client";

import { Button } from "./ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

interface DownloadSummaryButtonProps {
    targetId: string;
    filename?: string;
}

export function DownloadSummaryButton({ targetId, filename = "repo-summary.pdf" }: DownloadSummaryButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        const element = document.getElementById(targetId);
        if (!element) return;

        setIsGenerating(true);
        try {
            const dataUrl = await toPng(element, {
                pixelRatio: 2, // High resolution
                backgroundColor: "#000000" // Match theme background
            });

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [element.offsetWidth * 2, element.offsetHeight * 2] // Approximate size based on pixelRatio
            });

            pdf.addImage(dataUrl, "PNG", 0, 0, element.offsetWidth * 2, element.offsetHeight * 2);
            pdf.save(filename);
        } catch (error) {
            console.error("PDF generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isGenerating}
            className="gap-2 border-white/70 hover:bg-white/70 text-slate-700"
        >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isGenerating ? "Exporting..." : "Export PDF"}
        </Button>
    );
}
