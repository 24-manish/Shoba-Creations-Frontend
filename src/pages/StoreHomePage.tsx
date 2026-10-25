import { Link } from 'react-router-dom'
import { DbImage } from '../components/DbImage'
import { Ornament } from '../components/Ornament'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { Rating } from '../components/Rating'
import { useCategories, useFeaturedProducts } from '../hooks/useCatalog'
import { useHomepageContent } from '../hooks/useEditorial'

export function StoreHomePage() {
  // The homepage is entirely database-driven now: the featured rail, the category
  // tiles, the journal and the testimonials all come from the API.
  const { data: featured, isLoading: featuredLoading } = useFeaturedProducts()
  const { data: categoryData, isLoading: categoriesLoading } = useCategories()
  const { data: content, isLoading: contentLoading } = useHomepageContent()

  const featuredProducts = featured?.products ?? []
  const categories = categoryData?.categories ?? []
  const stories = content?.stories ?? []
  const testimonials = content?.testimonials ?? []
  const images = content?.images

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-section__image-wrap">
          <DbImage image={images?.hero} fallbackName="Shoba Creations" className="hero-section__image" loading="eager" />
          <div className="hero-section__wash" />
        </div>
        <div className="hero-section__content">
          <p className="eyebrow eyebrow--gold">The house of Shoba</p>
          <h1>Wear the <em>story.</em></h1>
          <p className="hero-section__copy">A considered collection of Indian craft, heirloom colour, and modern ease. Made for the moments you keep.</p>
          <div className="hero-section__actions"><Link to="/store/shop" className="button button--gold">Explore the collection <span>↗</span></Link><Link to="/store#story" className="button button--text button--text--light">Our point of view <span>↓</span></Link></div>
        </div>
        <div className="hero-section__side-note"><span>Since</span><strong>2018</strong><i /></div>
        <div className="hero-section__scroll"><span>Scroll to discover</span><i /></div>
      </section>

      <section className="service-strip"><div><span className="service-strip__icon">✦</span><span><strong>Thoughtfully sourced</strong><small>Small-batch Indian craft</small></span></div><div><span className="service-strip__icon">⌁</span><span><strong>Complimentary shipping</strong><small>On orders above ₹9,999</small></span></div><div><span className="service-strip__icon">♡</span><span><strong>Care, always</strong><small>Human support, 9am–7pm IST</small></span></div><div><span className="service-strip__icon">↺</span><span><strong>Easy returns</strong><small>14 days, no questions asked</small></span></div></section>

      <section className="home-section home-section--categories">
        <Reveal><SectionHeading eyebrow="Begin somewhere" title="A world of detail" copy="From the first drape to the last glint, discover the pieces that make an occasion feel unmistakably yours." align="center" /></Reveal>
        <div className="category-grid">
          {categories.map((category, index) => (
            <Reveal key={category.id} delay={index * 70}>
              <Link to={`/store/shop?category=${encodeURIComponent(category.slug)}`} className={`category-card category-card--${(index % 6) + 1}`}>
                {/* A category may have no hero image yet, in which case the tile falls back to a generated visual. */}
                <DbImage image={category.heroImageUrl ? { id: category.id, key: category.slug, url: category.heroImageUrl, alt: category.name, width: null, height: null, createdAt: '', updatedAt: '' } : null} fallbackName={category.name} className="category-card__image" />
                <span className="category-card__veil" />
                <span className="category-card__number">0{(index % 6) + 1}</span>
                <span className="category-card__body">
                  <small>{category.tagline ?? `${category.productCount} pieces`}</small>
                  <strong>{category.name}</strong>
                  <em>Explore ↗</em>
                </span>
              </Link>
            </Reveal>
          ))}
          {categoriesLoading ? <p className="home-section__loading">Gathering the collections…</p> : null}
        </div>
      </section>

      <section className="home-section home-section--featured">
        <div className="home-section__heading-row"><Reveal><SectionHeading eyebrow="The current edit" title="Pieces with presence" copy="A rotation of the pieces our community is reaching for now." /></Reveal><Link to="/store/shop" className="arrow-link">View all pieces <span>↗</span></Link></div>
        {featuredProducts.length > 0 ? (
          <div className="product-grid product-grid--four">{featuredProducts.slice(0, 8).map((product, index) => <Reveal key={product.id} delay={(index % 4) * 70}><ProductCard product={product} /></Reveal>)}</div>
        ) : (
          <p className="home-section__loading">{featuredLoading ? 'Gathering the current edit…' : 'The current edit is being prepared. Please visit again shortly.'}</p>
        )}
      </section>

      <section className="manifesto-section" id="story">
        <div className="manifesto-section__image"><DbImage image={images?.palace} fallbackName="The house of Shoba" loading="lazy" /><span className="manifesto-section__caption">Jaipur · Rajasthan</span></div>
        <div className="manifesto-section__content"><p className="eyebrow">Our point of view</p><h2>Beauty is not loud.<br /><em>It is lasting.</em></h2><Ornament /><p>We work with a small constellation of makers across India to bring you pieces with a sense of place. Every handloom border, every kundan setting, every fragrance note is chosen for the way it makes a ritual feel.</p><Link to="/store/shop" className="button button--outline">Discover the house <span>↗</span></Link><div className="manifesto-section__signature"><span>Shoba</span><small>Est. 2018</small></div></div>
      </section>

      <section className="home-section editorial-section" id="journal">
        <div className="home-section__heading-row"><Reveal><SectionHeading eyebrow="From the journal" title="Notes on a life well lived" /></Reveal><Link to="/store#journal" className="arrow-link">Read the journal <span>↗</span></Link></div>
        {stories.length > 0 ? (
          <div className="editorial-grid">
            {stories.map((story, index) => (
              <Reveal key={story.id} delay={index * 80}>
                <article className="editorial-card">
                  <Link to={`/store/journal/${story.slug}`} className="editorial-card__image">
                    <DbImage image={{ id: story.id, key: story.slug, url: story.imageUrl, alt: story.imageAlt, width: null, height: null, createdAt: '', updatedAt: '' }} fallbackName={story.title} />
                    <span>↗</span>
                  </Link>
                  <div className="editorial-card__body">
                    <span>{story.readTime ?? 'Journal'}</span>
                    <h3>{story.title}</h3>
                    <p>{story.excerpt}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="home-section__loading">{contentLoading ? 'Gathering the journal…' : 'The journal is being written. Please visit again shortly.'}</p>
        )}
      </section>

      {testimonials[0] ? (
        <section className="quote-section">
          <div className="quote-section__mark">“</div>
          <Reveal><blockquote>{testimonials[0].quote}</blockquote><cite>— {testimonials[0].name}{testimonials[0].city ? `, ${testimonials[0].city}` : ''}</cite></Reveal>
          <div className="quote-section__seal">SC<br /><small>EST. 2018</small></div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section className="home-section testimonials-section">
          <Reveal><SectionHeading eyebrow="From our community" title="Words that stay with us" align="center" /></Reveal>
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial.id} delay={index * 80}>
                <article className="testimonial-card">
                  <div className="testimonial-card__top">
                    <DbImage image={testimonial.imageUrl ? { id: testimonial.id, key: testimonial.id, url: testimonial.imageUrl, alt: testimonial.imageAlt, width: null, height: null, createdAt: '', updatedAt: '' } : null} fallbackName={testimonial.name} />
                    <Rating rating={testimonial.rating} compact />
                  </div>
                  <p>“{testimonial.quote}”</p>
                  <div><strong>{testimonial.name}</strong>{testimonial.city ? <span>{testimonial.city}</span> : null}</div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section className="home-section ritual-section">
        <div className="ritual-section__copy"><p className="eyebrow">A softer kind of luxury</p><h2>For the days<br />you keep <em>forever.</em></h2><p>Explore our most-loved pieces, chosen to become part of your own family stories.</p><Link to="/store/shop" className="button button--dark">Shop the edit <span>↗</span></Link></div>
        <div className="ritual-section__image"><DbImage image={images?.heroSecondary} fallbackName="The heritage edit" loading="lazy" /><span>THE HERITAGE EDIT</span></div>
      </section>
    </div>
  )
}
