import { useState } from 'react'

export default function DropZone({ onDrop, className = '', children }) {
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const id = e.dataTransfer.getData('text/initiative-id')
        if (id) onDrop(id)
      }}
      className={`${className} ${
        isOver ? 'ring-2 ring-brand-400/70 bg-brand-500/5' : ''
      } transition-colors`}
    >
      {children}
    </div>
  )
}
