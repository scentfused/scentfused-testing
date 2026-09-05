import Icon from './Icon.jsx'

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
