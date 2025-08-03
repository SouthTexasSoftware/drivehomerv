import { FirebaseStore } from "$lib/types";
import { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  created?: Timestamp;
  phone: string;
  email: string;
  address?: null;
  payment_method?: null;
  terms_at_checkout?: boolean;
  bookings?: string[];
  age_over_25?: boolean;
  stripe_id?: string;
  preferred_contact_method?: {
    text?: boolean;
    call?: boolean;
    email?: boolean;
  };
  contact_form_completed?: boolean;
  paymentIntent?: string;
}

export interface CustomerStore {
  customers: Customer[];
  getCustomer(
    customerId: string,
    fbStore: FirebaseStore
  ): Promise<Customer | undefined>;
  isPopulated: boolean;
  queryOptions: CustomerQueryOptions;
}

export interface CustomerQueryOptions {
  limit: number;
  loadAll: boolean;
  paginationCursor: QueryDocumentSnapshot | null;
}
