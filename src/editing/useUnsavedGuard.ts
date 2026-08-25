import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

export function useUnsavedGuard(dirty: boolean) {
  const blocker = useBlocker(dirty)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const leave = window.confirm(
        'You have unsaved changes to this list.\n\nLeave without saving?',
      )
      if (leave) blocker.proceed()
      else blocker.reset()
    }
  }, [blocker])

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
}
