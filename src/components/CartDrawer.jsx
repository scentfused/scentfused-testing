import { useCart } from "../context/CartContext";

const CartDrawer = () => {
  const { cart, removeFromCart, clearCart } = useCart();

  return (
    <div className="cart-drawer">
      <div className="cart-drawer-header">
        <h2>Your Cart</h2>

        {cart.length > 0 && (
          <button onClick={clearCart}>
            Clear Cart
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-items">
          {cart.map((item, index) => (
            <div className="cart-item" key={item.id || index}>
              <div>
                <h3>{item.name || "Product"}</h3>

                {item.price && <p>Price: {item.price}</p>}

                {item.quantity && <p>Quantity: {item.quantity}</p>}
              </div>

              {item.id && (
                <button onClick={() => removeFromCart(item.id)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CartDrawer;
