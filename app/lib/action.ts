"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

//FORM Schema
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: "Please select a Customer" }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than INR 0" }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status",
  }),
  date: z.string(),
});

// Defining the "State" type
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// ADDING AN INVOICE
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  // FORM VALIDATION USING ZOD
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  console.log(validatedFields);

  // ERROR HANDLING DURING FORM VALIDATION FAILURE
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice",
    };
  }

  // PREPARING DATA FOR INSERTION INTO DATABASE
  const { customerId, amount, status } = validatedFields.data;
  const date = new Date().toISOString().split("T")[0];

  //DATA INSERTION & ERROR MESSAGE
  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amount}, ${status}, ${date})`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Create Invoice.",
      error,
    };
  }

  // CACHE REVALIDATION AND RE-DIRECTION
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

// UPDATING AN INVOICE
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to Update Invoice'
    }
  }

  const { customerId, amount, status } = validatedFields.data;

  try {
    await sql`UPDATE invoices SET customer_id= ${customerId}, amount=${amount}, status=${status}
    WHERE id= ${id}`;
  } catch (error) {
    return { message:'Database Error: Failed to update Invoice.', error};
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

// DELETING AN INVOICE
export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}
