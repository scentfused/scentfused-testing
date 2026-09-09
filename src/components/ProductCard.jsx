import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import Icon from './Icon.jsx'

export default function ProductCard({ product, badge }) {
  const { addToCart, setQuickViewProduct } = useCart()

  function handleAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    const variants = product.variants || []
    addToCart(product, variants[0] || null, 1)
  }

  function handleQuickView(e) {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewProduct(product)
  }

  return (
    <div className="card">
      {badge && <span className="badge">{badge}</span>}
      <Link to={`/product/${product.id}`} className="card-link">
        <div className="tile">
          {product.image
            ? <img src={product.image} alt={product.name} />
            : <Icon category={product.category} />}

          <div className="tile-hover">
            <button className="tile-hover-btn" onClick={handleQuickView}>
              Quick view
            </button>
            <button className="tile-hover-btn tile-hover-btn-solid" onClick={handleAdd}>
              Add to bag
            </button>
          </div>
        </div>
        <h3>{product.name}</h3>
        <p className="note">{product.note}</p>
      </Link>
      <div className="row">
        <span className="price">
          {product.sale_price ? (
            <>
              <span className="price-was">Rs. {Number(product.price).toLocaleString()}</span>
              <span className="price-sale">Rs. {Number(product.sale_price).toLocaleString()}</span>
            </>
          ) : (
            <>Rs. {Number(product.price).toLocaleString()}</>
          )}
        </span>
        <button className="add" onClick={handleAdd}>Add</button>
      </div>
    </div>
  )
}
