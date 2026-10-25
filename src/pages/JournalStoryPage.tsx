import { Link, useParams } from 'react-router-dom'
import { DbImage } from '../components/DbImage'
import { Ornament } from '../components/Ornament'
import { useEditorialStory } from '../hooks/useEditorial'
import { formatDate } from '../lib/format'

export function JournalStoryPage() {
  const { slug } = useParams()
  const { data, isLoading, error } = useEditorialStory(slug)
  const story = data?.story

  if (isLoading) {
    return <div className="empty-page"><span className="empty-page__mark">SC</span><h1>Opening the journal…</h1></div>
  }

  if (error || !story) {
    return (
      <div className="empty-page">
        <span className="empty-page__mark">SC</span>
        <h1>We could not find that entry.</h1>
        <p>It may have been unpublished. The rest of the journal is still here.</p>
        <Link to="/store#journal" className="button button--dark">Back to the journal</Link>
      </div>
    )
  }

  return (
    <article className="story-page">
      <section className="story-page__hero">
        <DbImage
          image={{ id: story.id, key: story.slug, url: story.imageUrl, alt: story.imageAlt, width: null, height: null, createdAt: '', updatedAt: '' }}
          fallbackName={story.title}
          loading="eager"
        />
        <div className="story-page__wash" />
      </section>

      <div className="container story-page__body">
        <div className="breadcrumbs"><Link to="/store">Home</Link><span>·</span><Link to="/store#journal">The journal</Link><span>·</span><strong>{story.title}</strong></div>

        <header className="story-page__header">
          <p className="eyebrow">{story.readTime ?? 'Journal'}</p>
          <h1>{story.title}</h1>
          <p className="story-page__excerpt">{story.excerpt}</p>
          <div className="story-page__byline">
            {story.authorName ? <span>By {story.authorName}</span> : null}
            {story.publishedAt ? <span>{formatDate(story.publishedAt)}</span> : null}
          </div>
        </header>

        <Ornament />

        {/* Bodies are stored as plain paragraphs, so they are rendered as text
            rather than injected as markup. */}
        {story.body
          ? story.body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
          : <p>{story.excerpt}</p>}

        <footer className="story-page__footer">
          <Link to="/store#journal" className="arrow-link">← Back to the journal</Link>
          <Link to="/store/shop" className="button button--outline">Explore the collection <span>↗</span></Link>
        </footer>
      </div>
    </article>
  )
}
