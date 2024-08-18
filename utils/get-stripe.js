//utility function ensures that we only create one instance of Stripe
import { loadStripe } from '@stripe/stripe-js'

let stripePromise

// ensures that only one instance of Stripe exists
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

export default getStripe