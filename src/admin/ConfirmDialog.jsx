import { useEffect } from 'react'


export default function ConfirmDialog({
    title,
    message,
    confirmLabel = 'Confirmar',
    busy = false,
    error = '',
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && !busy) onCancel()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [busy, onCancel])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !busy) onCancel()
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
                <h2 id="confirm-title" className="text-lg font-semibold text-neutral-900">
                    {title}
                </h2>
                <p className="mt-2 text-sm text-neutral-600">{message}</p>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {busy ? 'Eliminando…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
