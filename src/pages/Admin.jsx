import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, emptyDraft } from '../data/catalog.js'
import { CATEGORY_FIELDS } from '../data/categoryFields.js'
import { FONT_OPTIONS } from '../data/settings.js'
import { supabase } from '../lib/supabaseClient.js'
import { uploadImageToCloudinary } from '../lib/cloudinary.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB, Cloudinary handles storage/optimization now

export default function Admin({ products, setProducts, settings, setSettings }) {
  const [draft, setDraft] = useState(emptyDraft())
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroImageError, setHeroImageError] = useState('')
  const [saving, setSaving] = useState(false)

  const stats = useMemo(() => {
    const total = products.length
    const value = products.reduce((sum, p) => sum + Number(p.price || 0), 0)
    const byCategory = CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      count: products.filter((p) => p.category === c.key).length
    }))
    return { total, value, byCategory }
  }, [products])

  const visible = filter === 'all' ? products : products.filter((p) => p.category === filter)

  function resetForm() {
    setDraft(emptyDraft())
    setEditingId(null)
    setImageError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!draft.name.trim() || !draft.price) return

    setSaving(true)
    setImageError('')

    const cleanVariants = (draft.variants || [])
      .filter((v) => v.label.trim() && v.price !== '')
      .map((v) => ({ label: v.label.trim(), price: Number(v.price) }))

    const cleanFeatures = (draft.features || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const payload = {
      name: draft.name,
      category: draft.category,
      note: draft.note,
      price: Number(draft.price),
      image: draft.image || null,
      variants: cleanVariants,
      description: draft.description || null,
      features: cleanFeatures,
      usage: draft.usage || null,
      attributes: draft.attributes || {}
    }

    if (editingId) {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()

      if (error) {
        console.error('Failed to update product:', error)
        setImageError('Could not save changes — please try again.')
      } else {
        setProducts((prev) => prev.map((p) => (p.id === editingId ? data : p)))
        resetForm()
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single()

      if (error) {
        console.error('Failed to add product:', error)
        setImageError('Could not add product — please try again.')
      } else {
        setProducts((prev) => [...prev, data])
        resetForm()
      }
    }

    setSaving(false)
  }

  function handleEdit(product) {
    setEditingId(product.id)
    setImageError('')
    setDraft({
      name: product.name,
      category: product.category,
      note: product.note,
      price: String(product.price),
      image: product.image || '',
      variants: (product.variants || []).map((v) => ({ label: v.label, price: String(v.price) })),
      description: product.description || '',
      features: (product.features || []).join('\n'),
      usage: product.usage || '',
      attributes: product.attributes || {}
    })
  }

  async function handleDelete(id) {
    if (editingId === id) resetForm()

    const previous = products
    setProducts((prev) => prev.filter((p) => p.id !== id)) // optimistic UI update

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete product:', error)
      setProducts(previous) // roll back if the delete didn't actually happen
    }
  }

  async function handleHeroImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setHeroImageError('')

    if (!file.type.startsWith('image/')) {
      setHeroImageError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setHeroImageError('Image is too large — please use a file under 5MB, or paste a URL instead.')
      return
    }

    setHeroUploading(true)
    try {
      const url = await uploadImageToCloudinary(file)
      setSettings({ ...settings, heroImage: url })
    } catch (err) {
      console.error('Hero image upload failed:', err)
      setHeroImageError('Upload failed — please try again, or paste a URL instead.')
    } finally {
      setHeroUploading(false)
    }
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError('')

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image is too large — please use a file under 5MB, or paste a URL instead.')
      return
    }

    setUploading(true)
    try {
      const url = await uploadImageToCloudinary(file)
      setDraft((d) => ({ ...d, image: url }))
    } catch (err) {
      console.error('Image upload failed:', err)
      setImageError('Upload failed — please try again, or paste a URL instead.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin">
      <header className="admin-topbar">
        <span className="brand">scentfused <em>admin</em></span>
        <Link className="admin-btn" to="/">View site</Link>
      </header>

      <div className="wrap admin-wrap">
        <section className="admin-stats">
          <div className="stat-card">
            <span className="stat-label">Total products</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Catalog value</span>
            <span className="stat-value">Rs. {stats.value.toLocaleString()}</span>
          </div>
          {stats.byCategory.map((c) => (
            <div className="stat-card" key={c.key}>
              <span className="stat-label">{c.label}</span>
              <span className="stat-value">{c.count}</span>
            </div>
          ))}
        </section>

        {/* ---------- Site settings ---------- */}
        <section className="admin-form-card">
          <h2>Site settings</h2>

          <div className="settings-grid">
            <div className="settings-group">
              <h3 className="settings-group-title">Branding</h3>

              <label className="settings-row">
                Brand font
                <select
                  value={settings.brandFont}
                  onChange={(e) => setSettings({ ...settings, brandFont: e.target.value })}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </label>
              <span className="brand-preview" style={{ fontFamily: `'${settings.brandFont}', sans-serif` }}>
                SCENTFUSED
              </span>

              <label className="settings-row">
                Accent color
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                />
              </label>
            </div>

            <div className="settings-group">
              <h3 className="settings-group-title">Homepage</h3>

              <label className="admin-form-wide">
                Hero background photo
                <input type="file" accept="image/*" onChange={handleHeroImageFile} disabled={heroUploading} />
              </label>
              {heroUploading && <p className="admin-form-wide muted">Uploading image…</p>}
              {heroImageError && <p className="admin-form-error admin-form-wide">{heroImageError}</p>}

              <label className="settings-row">
                Or paste an image URL
                <input
                  type="text"
                  value={settings.heroImage || ''}
                  onChange={(e) => setSettings({ ...settings, heroImage: e.target.value })}
                  placeholder="https://..."
                />
              </label>

              {settings.heroImage && (
                <div className="hero-preview">
                  <img src={settings.heroImage} alt="Hero background preview" />
                  <button type="button" className="btn btn-line" onClick={() => setSettings({ ...settings, heroImage: '' })}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="settings-group">
              <h3 className="settings-group-title">Display</h3>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={settings.showNewBadge}
                  onChange={(e) => setSettings({ ...settings, showNewBadge: e.target.checked })}
                />
                Show "New" badge on latest arrivals
              </label>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={settings.carouselAutoplay}
                  onChange={(e) => setSettings({ ...settings, carouselAutoplay: e.target.checked })}
                />
                Auto-scroll the latest arrivals carousel
              </label>
            </div>
          </div>
        </section>

        {/* ---------- Add / edit product ---------- */}
        <section className="admin-form-card">
          <h2>{editingId ? 'Edit product' : 'Add a product'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Name
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Noir Oud"
                required
              />
            </label>

            <label>
              Category
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value, attributes: {} })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </label>

            {(CATEGORY_FIELDS[draft.category] || []).map((field) => (
              <label key={field.key} className={field.type === 'multiselect' ? 'admin-form-wide' : ''}>
                {field.label}

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={draft.attributes?.[field.key] || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, attributes: { ...draft.attributes, [field.key]: e.target.value } })
                    }
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={draft.attributes?.[field.key] || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, attributes: { ...draft.attributes, [field.key]: e.target.value } })
                    }
                  >
                    <option value="">Select…</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === 'multiselect' && (
                  <div className="attribute-checkboxes">
                    {field.options.map((opt) => {
                      const current = draft.attributes?.[field.key] || []
                      const checked = current.includes(opt)
                      return (
                        <label key={opt} className="attribute-checkbox">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...current, opt]
                                : current.filter((v) => v !== opt)
                              setDraft({ ...draft, attributes: { ...draft.attributes, [field.key]: next } })
                            }}
                          />
                          {opt}
                        </label>
                      )
                    })}
                  </div>
                )}
              </label>
            ))}

            <label>
              Note (short blurb shown on product cards)
              <input
                type="text"
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="e.g. Smoked oud, dark amber, leather"
              />
            </label>

            <label>
              Price (Rs.)
              <input
                type="number"
                min="0"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                placeholder="e.g. 6500"
                required
              />
            </label>

            <label className="admin-form-wide">
              Description (shown on the product's own page)
              <textarea
                rows="4"
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="A longer description of the product — story, inspiration, what makes it special..."
              />
            </label>

            <label className="admin-form-wide">
              Features (one per line)
              <textarea
                rows="4"
                value={draft.features || ''}
                onChange={(e) => setDraft({ ...draft, features: e.target.value })}
                placeholder={'Long-lasting 8+ hour wear\nAlcohol-free formula\nHandcrafted in small batches'}
              />
            </label>

            <label className="admin-form-wide">
              Usage / how to use
              <textarea
                rows="3"
                value={draft.usage || ''}
                onChange={(e) => setDraft({ ...draft, usage: e.target.value })}
                placeholder="e.g. Apply to pulse points after showering for best longevity."
              />
            </label>

            <div className="admin-form-wide">
              <span className="variants-label">Variants (optional — e.g. different sizes)</span>
              {(draft.variants || []).map((v, i) => (
                <div className="variant-row" key={i}>
                  <input
                    type="text"
                    placeholder="Label, e.g. 30ml"
                    value={v.label}
                    onChange={(e) => {
                      const next = [...draft.variants]
                      next[i] = { ...next[i], label: e.target.value }
                      setDraft({ ...draft, variants: next })
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Price, e.g. 3800"
                    value={v.price}
                    onChange={(e) => {
                      const next = [...draft.variants]
                      next[i] = { ...next[i], price: e.target.value }
                      setDraft({ ...draft, variants: next })
                    }}
                  />
                  <button
                    type="button"
                    className="variant-remove"
                    onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-line"
                onClick={() => setDraft({ ...draft, variants: [...(draft.variants || []), { label: '', price: '' }] })}
              >
                + Add variant
              </button>
            </div>

            <label className="admin-form-wide">
              Image URL
              <input
                type="url"
                value={draft.image.startsWith('data:') ? '' : draft.image}
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                placeholder="https://example.com/photo.jpg"
              />
            </label>

            <label className="admin-form-wide">
              Or upload an image
              <input type="file" accept="image/*" onChange={handleImageFile} disabled={uploading} />
            </label>

            {uploading && <p className="admin-form-wide muted">Uploading image…</p>}
            {imageError && <p className="admin-form-error admin-form-wide">{imageError}</p>}

            {draft.image && (
              <div className="admin-form-wide image-preview">
                <img src={draft.image} alt="Preview" />
                <button type="button" onClick={() => setDraft({ ...draft, image: '' })}>
                  Remove image
                </button>
              </div>
            )}

            <div className="admin-form-actions">
              <button type="submit" className="btn btn-solid" disabled={saving || uploading}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-line" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ---------- Product table ---------- */}
        <section className="admin-table-card">
          <div className="admin-table-head">
            <h2>Products</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Category</th>
                <th>Note</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-thumb">
                      {p.image
                        ? <img src={p.image} alt={p.name} />
                        : <span className="admin-thumb-empty">—</span>}
                    </div>
                  </td>
                  <td>{p.name}</td>
                  <td>{CATEGORIES.find((c) => c.key === p.category)?.label}</td>
                  <td className="muted">{p.note}</td>
                  <td>Rs. {Number(p.price).toLocaleString()}</td>
                  <td className="admin-row-actions">
                    <button onClick={() => handleEdit(p)}>Edit</button>
                    <button onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted">No products in this category yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
