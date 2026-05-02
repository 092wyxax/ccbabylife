'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCustomerSession } from '@/lib/customer-session'
import {
  createAddress,
  updateAddress,
  deleteAddress,
} from '@/server/services/AddressService'

export type AddressActionState = { error?: string; success?: string }

const addressSchema = z.object({
  label: z.string().min(1, '請填標籤（如：家、辦公室）'),
  recipientName: z.string().min(1, '請填收件人姓名'),
  phone: z.string().min(8, '請填正確電話'),
  zipcode: z.string().min(3, '請填郵遞區號'),
  city: z.string().min(1, '請填縣市'),
  street: z.string().min(5, '請填詳細地址'),
  notes: z.string().optional().or(z.literal('')),
  isDefault: z.coerce.boolean(),
})

function fields(formData: FormData) {
  return {
    label: formData.get('label'),
    recipientName: formData.get('recipientName'),
    phone: formData.get('phone'),
    zipcode: formData.get('zipcode'),
    city: formData.get('city'),
    street: formData.get('street'),
    notes: formData.get('notes') ?? '',
    isDefault: formData.get('isDefault') === 'on',
  }
}

export async function createAddressAction(
  _prev: AddressActionState,
  formData: FormData
): Promise<AddressActionState> {
  const session = await getCustomerSession()
  if (!session) return { error: '請先登入' }

  const parsed = addressSchema.safeParse(fields(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }

  await createAddress(session.customerId, {
    ...parsed.data,
    notes: parsed.data.notes || null,
  })

  revalidatePath('/account/addresses')
  redirect('/account/addresses')
}

export async function updateAddressAction(
  addressId: string,
  _prev: AddressActionState,
  formData: FormData
): Promise<AddressActionState> {
  const session = await getCustomerSession()
  if (!session) return { error: '請先登入' }

  const parsed = addressSchema.safeParse(fields(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '輸入錯誤' }

  await updateAddress(session.customerId, addressId, {
    ...parsed.data,
    notes: parsed.data.notes || null,
  })

  revalidatePath('/account/addresses')
  return { success: '已更新地址' }
}

export async function deleteAddressFormAction(formData: FormData): Promise<void> {
  const session = await getCustomerSession()
  if (!session) return
  const addressId = String(formData.get('addressId') ?? '')
  if (!addressId) return
  await deleteAddress(session.customerId, addressId)
  revalidatePath('/account/addresses')
}
