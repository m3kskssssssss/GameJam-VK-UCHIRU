'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { submitGrandparentPhoto } from '@/lib/grandparent-upload'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { GrandparentTask } from '@/server/content/grandparents'
import { ru } from '@/i18n/ru'

interface Props {
  task: GrandparentTask
  onSuccess: (reward: { coinsEarned: number; energyEarned: number }) => void
  onCancel: () => void
}

export function PhotoSubmission({ task, onSuccess, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const isMobile = useIsMobile()

  const t = ru.play.dialog.photo
  const hint = task.npc === 'grandma' ? t.hintGrandma : t.hintGrandpa

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setSelectedFile(file)
  }

  function handleRetake() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setSelectedFile(null)
    // Reset the input so the same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.click()
  }

  async function handleSubmit() {
    if (!selectedFile) return
    setIsBusy(true)
    try {
      const result = await submitGrandparentPhoto(task.key, selectedFile)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      onSuccess({
        coinsEarned: result.coinsEarned,
        energyEarned: result.energyEarned,
      })
    } catch {
      toast.error(t.errorUpload)
    } finally {
      setIsBusy(false)
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 120,
    background: 'rgba(15,23,42,0.55)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  }

  const cardStyle: React.CSSProperties = {
    width: 'calc(100% - 24px)',
    maxWidth: isMobile ? 200 : 520,
    maxHeight: isMobile ? '85vh' : 'none',
    overflowY: isMobile ? 'auto' : 'visible',
    background: 'rgba(255,255,255,0.98)',
    borderRadius: isMobile ? '10px 10px 0 0' : '20px 20px 0 0',
    padding: isMobile ? '8px 10px 12px' : '20px 22px 32px',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
  }

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.75rem' : '1.1rem',
    fontWeight: 800,
    color: '#1F2937',
    fontFamily: 'Nunito, sans-serif',
  }

  const hintStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.65rem' : '0.9rem',
    lineHeight: 1.3,
    color: '#6B7280',
    fontFamily: 'Nunito, sans-serif',
    marginBottom: isMobile ? 6 : 16,
  }

  const previewStyle: React.CSSProperties = {
    width: isMobile ? 80 : 240,
    height: isMobile ? 80 : 240,
    objectFit: 'cover',
    borderRadius: isMobile ? 6 : 12,
    display: 'block',
    margin: isMobile ? '0 auto 6px' : '0 auto 16px',
  }

  const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'block',
    width: '100%',
    padding: isMobile ? '5px 8px' : '13px 16px',
    borderRadius: isMobile ? 6 : 12,
    border: 'none',
    background: disabled ? '#D1D5DB' : '#4DA8DA',
    color: '#fff',
    fontWeight: 800,
    fontSize: isMobile ? '0.7rem' : '1rem',
    fontFamily: 'Nunito, sans-serif',
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: isMobile ? 2 : 8,
    transition: 'background 120ms ease',
  })

  const secondaryBtnStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: isMobile ? '4px 8px' : '12px 16px',
    borderRadius: isMobile ? 6 : 12,
    border: '1.5px solid #D1D5DB',
    background: 'transparent',
    color: '#374151',
    fontWeight: 700,
    fontSize: isMobile ? '0.7rem' : '1rem',
    fontFamily: 'Nunito, sans-serif',
    cursor: 'pointer',
    marginTop: isMobile ? 2 : 8,
  }

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    color: '#9CA3AF',
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={titleRowStyle}>
          <span style={titleStyle}>{task.title}</span>
          <button
            style={closeBtnStyle}
            onClick={onCancel}
            aria-label={t.btnCancel}
            disabled={isBusy}
          >
            <X size={22} />
          </button>
        </div>
        <p style={hintStyle}>{hint}</p>

        {/* Hidden native file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="preview" style={previewStyle} />
            <button
              style={primaryBtnStyle(isBusy)}
              disabled={isBusy}
              onClick={handleSubmit}
            >
              {isBusy ? t.sending : t.btnSend}
            </button>
            <button
              style={secondaryBtnStyle}
              disabled={isBusy}
              onClick={handleRetake}
            >
              {t.btnRetake}
            </button>
          </>
        ) : (
          <button
            style={primaryBtnStyle(false)}
            onClick={() => inputRef.current?.click()}
          >
            {t.btnOpenCamera}
          </button>
        )}
      </div>
    </div>
  )
}
