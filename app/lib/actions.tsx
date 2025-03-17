'use server';
import z, { custom } from 'zod';
import { Invoice } from './definitions';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const InvoiceSchema = z.object({
  id: z.string(),
  date: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid'])
});

const InvoiceFormSchema = InvoiceSchema.omit({ 
  id: true,
  date: true
});

export async function createInvoice(formData: FormData) {

  const formRawData = Object.fromEntries(formData.entries());
  const { customerId, amount, status }  = InvoiceFormSchema.parse({
    customerId: formRawData.customerId,
    amount: formRawData.amount,
    status: formRawData.status
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await postgres(process.env.POSTGRES_URL!, { ssl: false }).begin(async (sql) => {
    await sql`
      INSERT INTO invoices (date, customer_id, amount, status)
      VALUES (${date}, ${customerId}, ${amountInCents}, ${status})
    `;
  });

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
  
}


export async function updateInvoice(id: string, formData: FormData) {

  const formRawData = Object.fromEntries(formData.entries());
  const { customerId, amount, status }  = InvoiceFormSchema.parse({
    customerId: formRawData.customerId,
    amount: formRawData.amount,
    status: formRawData.status
  });

  const amountInCents = amount * 100;

  await postgres(process.env.POSTGRES_URL!, { ssl: false }).begin(async (sql) => {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  });

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


export async function deleteInvoice(invoice_id: string) {
  throw new Error('Failed to Delete Invoice');
  await postgres(process.env.POSTGRES_URL!, { ssl: false }).begin(async (sql) => {
    await sql`
      DELETE FROM invoices
      WHERE id = ${invoice_id}
    `;
  });

  revalidatePath('/dashboard/invoices');
}