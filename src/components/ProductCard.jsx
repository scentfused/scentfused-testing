import { useCart } from '../context/CartContext.jsx'
import Icon from './Icon.jsx'

export default function ProductCard({ product, badge }) {
  const { addToCart, setQuickViewProduct } = useCart()

  function handleAdd(e) {
    e.stopPropagation()
    const variants = product.variants || []
    addToCart(product, variants[0] || null, 1)
  }

  return (
    <div className="card">
      {badge && <span className="badge">{badge}</span>}
      <div className="tile">
        {product.image
          ? <img src={product.image} alt={product.name} />
          : <Icon category={product.category} />}

        <div className="tile-hover">
          <button className="tile-hover-btn" onClick={() => setQuickViewProduct(product)}>
            Quick view
          </button>
          <button className="tile-hover-btn tile-hover-btn-solid" onClick={handleAdd}>
            Add to bag
          </button>
        </div>
      </div>
      <h3>{product.name}</h3>
      <p className="note">{product.note}</p>
      <div className="row">
        <span className="price">Rs. {Number(product.price).toLocaleString()}</span>
        <button className="add" onClick={handleAdd}>Add</button>
      </div>
    </div>
  )
}
/*import Icon from './Icon.jsx'

export default function ProductCard({ product, badge }) {
  return (
    <div className="card">
      {badge && <span className="badge">{badge}</span>}
      <div className="tile">
        {product.image
          ? <img src={product.image} alt={product.name} />
          : <Icon category={product.category} />}
      </div>
      <h3>{product.name}</h3>
      <p className="note">{product.note}</p>
      <div className="row">
        <span className="price">Rs. {Number(product.price).toLocaleString()}</span>
        <button className="add">Add</button>
      </div>
    </div>
  )
}
*/
