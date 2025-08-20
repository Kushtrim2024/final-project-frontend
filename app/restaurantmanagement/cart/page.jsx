"use client";
import Link from "next/link";
import { useCart } from "../../contexte/CartContext";

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  if (cart.length === 0)
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Your cart is empty</h1>
        <Link href="/" className="text-orange-500 underline">
          Browse restaurants
        </Link>
      </div>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <ul className="space-y-4 mb-6">
        {cart.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center border-b pb-2"
          >
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-600">
                Quantity: {item.qty} × ${item.price.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center font-bold text-xl mb-6">
        Total: ${totalPrice.toFixed(2)}
      </div>

      <Link
        href="/order"
        className="bg-orange-500 text-white px-5 py-2 rounded hover:bg-orange-600 transition"
      >
        Proceed to Checkout
      </Link>

      <button
        onClick={clearCart}
        className="mt-6 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
      >
        Clear Cart
      </button>
    </div>
  );
}
