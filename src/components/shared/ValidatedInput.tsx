'use client'

import { useState, type ComponentProps } from 'react'

interface ValidatedInputProps
  extends Omit<ComponentProps<'input'>, 'onBlur' | 'onChange'> {
  label?: string
  hint?: string
  /** Validate on blur. Return null if valid, or error message string. */
  validate?: (value: string) => string | null
  /** External error from server action — overrides local */
  serverError?: string
  onValueChange?: (v: string) => void
  onValueBlur?: (v: string) => void
}

/**
 * Inline-validated input. Shows error on blur, clears on focus, success ✓ when
 * value passes validation. Pairs with brand red focus ring from globals.css.
 */
export function ValidatedInput({
  label,
  hint,
  validate,
  serverError,
  onValueChange,
  onValueBlur,
  className = '',
  required,
  ...rest
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [hasValue, setHasValue] = useState(
    typeof rest.defaultValue === 'string' ? rest.defaultValue.length > 0 : false
  )
  const error = serverError ?? localError

  const showSuccess = touched && !error && hasValue && validate

  return (
    <div>
      {label && (
        <label
          htmlFor={rest.id ?? rest.name}
          className="block text-sm mb-1.5"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          {...rest}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${rest.name}-err` : hint ? `${rest.name}-hint` : undefined
          }
          onChange={(e) => {
            setHasValue(e.target.value.length > 0)
            // Clear local error on edit
            if (localError) setLocalError(null)
            onValueChange?.(e.target.value)
          }}
          onBlur={(e) => {
            setTouched(true)
            const msg = validate?.(e.target.value) ?? null
            setLocalError(msg)
            onValueBlur?.(e.target.value)
          }}
          className={
            'w-full border rounded-md px-3 py-2 pr-9 focus:outline-none transition-colors ' +
            (error
              ? 'border-danger animate-[shake_280ms_ease]'
              : showSuccess
                ? 'border-sage'
                : 'border-line focus:border-ink') +
            (className ? ` ${className}` : '')
          }
        />
        {showSuccess && (
          <span
            aria-hidden
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sage text-sm"
          >
            ✓
          </span>
        )}
      </div>
      {error ? (
        <p id={`${rest.name}-err`} className="text-xs text-danger mt-1">
          {error}
        </p>
      ) : hint ? (
        <p id={`${rest.name}-hint`} className="text-xs text-ink-soft mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Common validators */
export const validators = {
  email: (v: string): string | null => {
    if (!v) return '請填 Email'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email 格式錯誤'
    return null
  },
  phoneTw: (v: string): string | null => {
    if (!v) return '請填電話'
    const digits = v.replace(/[^\d]/g, '')
    if (digits.length < 8) return '電話太短'
    return null
  },
  required:
    (label: string) =>
    (v: string): string | null =>
      v.trim().length === 0 ? `${label} 必填` : null,
  minLength:
    (n: number, label?: string) =>
    (v: string): string | null =>
      v.length < n ? `${label ?? ''}至少 ${n} 字`.trim() : null,
}
