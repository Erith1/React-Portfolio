import { useEffect, useRef, useState } from 'react'
import LockGame from './components/LockGame'
import './App.css'

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

const SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Design Systems',
  'REST / GraphQL',
  'CI/CD',
  'Accessibility',
]

const PROJECTS = [
  {
    index: 'PRJ—01',
    title: 'Realtime Dashboard',
    desc: 'A live operations dashboard streaming metrics over websockets, built for fast triage under load.',
    tags: ['react', 'websockets', 'd3'],
    href: '#',
  },
  {
    index: 'PRJ—02',
    title: 'Design System Kit',
    desc: 'A component library and token pipeline shared across four product teams, from Figma to production.',
    tags: ['typescript', 'storybook', 'tokens'],
    href: '#',
  },
  {
    index: 'PRJ—03',
    title: 'Access Gateway',
    desc: 'An internal auth gateway handling session issuance and rate limiting for a growing set of services.',
    tags: ['node', 'redis', 'security'],
    href: '#',
  },
]

function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)

  const about = useReveal<HTMLElement>()
  const projects = useReveal<HTMLElement>()
  const contact = useReveal<HTMLElement>()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
      setPastHero(window.scrollY > window.innerHeight * 0.6)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleUnlocked() {
    if (unlocked) return
    setUnlocked(true)
    window.setTimeout(() => {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
  }

  return (
    <>
      <nav className={`nav${scrolled ? ' nav--solid' : ''}${unlocked ? ' nav--unlocked' : ''}`}>
        <a className="nav__mark" href="#top">
          <span className="nav__mark-dot" />
          J·V
        </a>
        <ul className="nav__links">
          <li><a href="#about">About</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <div id="top" className="site">
        <section className="hero">
          <span className="hero__eyebrow">Lock Picking Game</span>
          <LockGame onUnlocked={handleUnlocked} />
          <a className="hero__scroll" href="#about">
            Enter
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </section>

        <section id="about" ref={about.ref} className={`section${about.visible ? ' section--visible' : ''}`}>
          <span className="section__eyebrow">PROFILE</span>
          <h2 className="section__heading">About Me</h2>
          <div className="about__grid">
            <div className="about__bio">
              <p>
                I'm a third year CS student, I like to play video games, guitar, and hangout with my friends. I made this project 
                because it was my assighnment. I hope you enjoy the minigame that I made. 
              </p>
              <p>
                This game was heavily inspired by the Dota 2 minigame event called 'Pick the Lock', it essentialy follows the same 
                mechanics, minus some details and designs.
              </p>
            </div>
            
          
            <div className="about__image-wrapper">
              <img 
                src="7f629a6b-f279-4140-a007-8742662bbaef.jpg" 
                alt="It's me" 
                className="about__profile-img" 
              />
            </div>

          </div>
        </section>
             

        <section id="projects" ref={projects.ref} className={`section${projects.visible ? ' section--visible' : ''}`}>
          <span className="section__eyebrow">FILES</span>
          <h2 className="section__heading">Projects</h2>
          <div className="projects__grid">
            {PROJECTS.map((p) => (
              <a className="project-card" href={p.href} key={p.index}>
                <span className="project-card__index">{p.index}</span>
                <h3 className="project-card__title">{p.title}</h3>
                <p className="project-card__desc">{p.desc}</p>
                <div className="project-card__tags">
                  {p.tags.map((t) => (
                    <span className="tag" key={t}>{t}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="contact" ref={contact.ref} className={`section${contact.visible ? ' section--visible' : ''}`}>
          <span className="section__eyebrow">TRANSMIT</span>
          <h2 className="section__heading">Contact Me</h2>
          <div className="contact__row">
            <p className="contact__prompt">
              Want to know me better? Here's how.
            </p>
            <div className="contact__actions">
              <a className="btn--brass" href="mailto:hello@example.com">Send a message</a>
              <ul className="contact__socials">
                <li><a href="#">GitHub</a></li>
                <li><a href="#">LinkedIn</a></li>
                <li><a href="#">Twitter</a></li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="footer">
          <span>Built with React</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </div>

      <button
        type="button"
        className={`to-top${pastHero ? ' to-top--visible' : ''}`}
        onClick={() => document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })}
        aria-label="Back to top"
        tabIndex={pastHero ? 0 : -1}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  )
}

export default App
