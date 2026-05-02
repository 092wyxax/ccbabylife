export interface CartItem {
  productId: string
  slug: string
  nameZh: string
  priceTwd: number
  weightG: number
  imagePath: string | null
  stockType: 'preorder' | 'in_stock'
  quantity: number
}

export interface CartTotals {
  subtotal: number
  itemCount: number
  totalWeightG: number
}
