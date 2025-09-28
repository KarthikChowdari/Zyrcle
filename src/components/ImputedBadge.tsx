import { Badge } from "@/components/ui/badge";

interface ImputedBadgeProps {
  confidence: number
}

export function ImputedBadge({ confidence }: ImputedBadgeProps) {
  const getVariant = (confidence: number) => {
    if (confidence >= 80) return "default";
    if (confidence >= 60) return "secondary";
    return "destructive";
  };

  return (
    <Badge variant={getVariant(confidence)} className="inline-flex items-center gap-1">
      <div className="w-1.5 h-1.5 bg-current rounded-full opacity-75"></div>
      Confidence: {confidence}%
    </Badge>
  )
}
