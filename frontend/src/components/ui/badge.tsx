interface BadgeProps {
  classes?: string;
  text: string;
}

export function Badge({ classes, text }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
        classes || "bg-gray-100 text-gray-800"
      }`}
    >
      {text}
    </span>
  );
}