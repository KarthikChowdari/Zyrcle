interface ImputedBadgeProps {
  confidence: number
}

export function ImputedBadge({ confidence }: ImputedBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
      Confidence: {confidence}%
    </span>
  )
}
