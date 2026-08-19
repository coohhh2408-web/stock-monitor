interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0 ${
        checked ? 'bg-[#34C759]' : 'bg-neutral-200'
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform duration-200 ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  if (!label) return <Switch checked={checked} onChange={onChange} />

  return (
    <label className="flex items-center justify-between w-full cursor-pointer">
      <span className="text-sm text-neutral-900">{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </label>
  )
}
