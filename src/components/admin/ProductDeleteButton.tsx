'use client'

import { useActionState } from 'react'
import {
  deleteProductAction,
  type DeleteProductState,
} from '@/server/actions/products'

const initial: DeleteProductState = {}

interface Props {
  productId: string
  productName: string
}

export function ProductDeleteButton({ productId, productName }: Props) {
  const action = deleteProductAction.bind(null, productId)
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `確定永久刪除「${productName}」嗎？\n\n此操作無法復原。如果商品有歷史訂單或進貨紀錄，刪除會被拒絕，請改用「封存」。`
          )
        ) {
          e.preventDefault()
        }
      }}
      className="inline"
    >
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-danger hover:underline disabled:opacity-50"
      >
        {pending ? '刪除中⋯' : '永久刪除'}
      </button>
      {state.error && (
        <p className="text-xs text-danger mt-1 max-w-xs">{state.error}</p>
      )}
    </form>
  )
}
