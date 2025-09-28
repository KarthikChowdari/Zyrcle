"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"

export function ExplainBubble() {
    const [isOpen, setIsOpen] = useState(false)

    // Mock data for top 3 drivers
    const topDrivers = [
        {
            factor: "Recycled Content",
            impact: "40% of circularity score",
            recommendation: "Increase to 60%+ for optimal performance",
        },
        {
            factor: "Grid Energy Mix",
            impact: "35% of GWP emissions",
            recommendation: "Switch to renewable energy sources",
        },
        {
            factor: "End-of-Life Recovery",
            impact: "30% of circularity score",
            recommendation: "Improve collection and sorting systems",
        },
    ]

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Info className="w-4 h-4 text-slate-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm text-slate-900 mb-2">Top 3 Impact Drivers</h4>
                        <p className="text-xs text-slate-600 mb-3">
                            Key factors influencing environmental performance and circularity
                        </p>
                    </div>

                    <div className="space-y-3">
                        {topDrivers.map((driver, index) => (
                            <div key={index} className="border-l-2 border-blue-200 pl-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-blue-600">#{index + 1}</span>
                                    <span className="text-sm font-medium text-slate-900">{driver.factor}</span>
                                </div>
                                <p className="text-xs text-slate-600 mb-1">{driver.impact}</p>
                                <p className="text-xs text-green-700 font-medium">{driver.recommendation}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t">
                        <p className="text-xs text-slate-500">Analysis based on ISO 14040/14044 LCA methodology</p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
