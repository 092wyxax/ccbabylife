import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * ECPay's store map POSTs back here with CVSStoreID/CVSStoreName/CVSAddress.
 * We stash them in a short-lived cookie so the checkout form can read on next
 * render, then redirect back to /checkout.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const storeId = (formData.get('CVSStoreID') as string) ?? ''
  const storeName = (formData.get('CVSStoreName') as string) ?? ''
  const storeAddress = (formData.get('CVSAddress') as string) ?? ''
  const cvsType = (formData.get('LogisticsSubType') as string) ?? ''

  if (storeId) {
    const store = await cookies()
    const value = JSON.stringify({ storeId, storeName, storeAddress, cvsType })
    store.set('pending_cvs_store', value, {
      maxAge: 60 * 30, // 30 minutes to finish checkout
      httpOnly: false, // client can read to display
      sameSite: 'lax',
      path: '/',
    })
  }

  return NextResponse.redirect(new URL('/checkout', req.url))
}

// Some ECPay flows GET this URL after picking
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/checkout', req.url))
}
