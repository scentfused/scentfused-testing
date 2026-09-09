import { useCart } from "../context/CartContext";

const QuickView = ({ product, onClose }) => {
  if (!product) {
    return null;
  }

  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="quick-view">
      <div className="quick-view-content">
        <button onClick={onClose} className="quick-view-close">
          ×
        </button>

        {product.image && (
          <img
            src={product.image}
            alt={product.name || "Product"}
          />
        )}

        <h2>{product.name || "Product"}</h2>

        {product.price && <p>{product.price}</p>}

        {product.description && (
          <p>{product.description}</p>
        )}

        <button onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default QuickView;
