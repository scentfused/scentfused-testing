import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { CATEGORY_FIELDS } from '../data/categoryFields.js'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import Icon from '../components/Icon.jsx'

export default function ProductPage({ products }) {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const product = products.find((p) => String(p.id) === String(id))

  if (!product) {
    return (
      <>
        <Nav />
        <div className="product-not-found">
          <h2>Product not found</h2>
          <p>This product may have been removed or the link is incorrect.</p>
          <Link to="/" className="btn btn-line">Back to shop</Link>
        </div>
        <Footer />
      </>
    )
  }

  const variants = product.variants || []
  const activeVariant = selectedVariant || variants[0] || null
  const displayPrice = activeVariant ? activeVariant.price : product.price

  function handleAdd() {
    addToCart(product, activeVariant, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
      <Nav />
      <div className="product-page">
        <div className="product-page-image">
          {product.image ? <img src={product.image} alt={product.name} /> : <Icon category={product.category} />}
        </div>

        <div className="product-page-info">
          <p className="product-page-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="note">{product.note}</p>
          <p className="product-page-price">Rs. {Number(displayPrice).toLocaleString()}</p>

          {variants.length > 0 && (
            <div className="quickview-variants">
              <span className="quickview-variants-label">Size</span>
              <div className="quickview-variant-options">
                {variants.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    className={`variant-chip ${activeVariant?.label === v.label ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="quickview-qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>&minus;</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>

          <button className="btn btn-solid product-page-add" onClick={handleAdd}>
            {added ? 'Added ✓' : 'Add to bag'}
          </button>

          {product.description && (
            <div className="product-page-section">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {(CATEGORY_FIELDS[product.category] || []).some(
            (field) => {
              const v = product.attributes?.[field.key]
              return Array.isArray(v) ? v.length > 0 : Boolean(v)
            }
          ) && (
            <div className="product-page-section">
              <h3>Details</h3>
              <dl className="product-page-attributes">
                {(CATEGORY_FIELDS[product.category] || []).map((field) => {
                  const value = product.attributes?.[field.key]
                  const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value)
                  if (!hasValue) return null
                  const display = Array.isArray(value) ? value.join(', ') : value
                  return (
                    <div className="product-page-attribute-row" key={field.key}>
                      <dt>{field.label}</dt>
                      <dd>{display}</dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div className="product-page-section">
              <h3>Features</h3>
              <ul className="product-page-features">
                {product.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {product.usage && (
            <div className="product-page-section">
              <h3>How to use</h3>
              <p>{product.usage}</p>
            </div>
          )}

          <Link to="/" className="product-page-back">&larr; Back to shop</Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
