import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import LockGame from './components/LockGame'
import './App.css'

const EMAIL = 'lorenzo_lubrico@dlsl.edu.ph'

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'game', label: 'Game' },
  { id: 'contact', label: 'Contact' },
]

const PROJECTS = [
  {
    index: 'PRJ—01',
    title: 'Final COPROG Project',
    img: '/finalscoprog.png',
    alt: 'Screenshot of the Final COPROG project',
    desc: 'One of the hardest projects I did in my first year of college.',
  },
  {
    index: 'PRJ—02',
    title: 'OOPROG Abstraction',
    img: '/Abstraction.png',
    alt: 'Screenshot of the OOPROG abstraction project',
    desc: 'Implemented abstraction to hide the internal details of how the code works and expose only the results.',
  },
  {
    index: 'PRJ—03',
    title: 'OOPROG Inheritance',
    img: '/Inheritance.png',
    alt: 'Screenshot of the OOPROG inheritance project',
    desc: 'Used inheritance and shared functions across multiple parts of the code to avoid repetition.',
  },
]

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  const { ref, visible } = useReveal<HTMLElement>()
  return (
    <section id={id} ref={ref} className={`section${visible ? ' section--visible' : ''}`}>
      <span className="section__eyebrow">{eyebrow}</span>
      <h2 className="section__heading">{title}</h2>
      {children}
    </section>
  )
}

function App() {
  const [scrolled, setScrolled] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const subject = `Portfolio message from ${name.trim()}`
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message.trim())}`
  }

  return (
    <>
      <nav className={`nav${scrolled ? ' nav--solid' : ''}`} aria-label="Primary">
        <a className="nav__mark" href="#top">
          <span className="nav__mark-dot" />
          Lorenzo Lubrico
        </a>
        <ul className="nav__links">
          {NAV.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`}>{n.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <main id="top">
        <header className="hero">
          <span className="hero__eyebrow">Portfolio</span>
          <h1 className="hero__title">
            Hi, I'm <span className="hero__accent">Lorenzo</span>.
          </h1>
          <p className="hero__lead">
            A third-year Computer Science student who builds small projects, plays games, and picks up the guitar
            when the code stops cooperating.
          </p>
          <div className="hero__actions">
            <a className="btn btn--brass" href="#projects">
              View projects
            </a>
            <a className="btn btn--ghost" href="#contact">
              Get in touch
            </a>
          </div>
        </header>

        <Section id="about" eyebrow="PROFILE" title="About Me">
          <div className="about">
            <div className="about__bio">
              <p>
                I'm a third-year Computer Science student. Outside of class I like playing video games, playing
                guitar, and hanging out with friends.
              </p>
              <p>
                This portfolio started as a school assignment. The lock-picking minigame further down is inspired by
                the Dota 2 event mini-game "Pick the Lock" and follows the same core mechanic, minus some details and
                designs. I hope you enjoy it.
              </p>
            </div>
            <div className="about__frame">
              <img className="about__img" src="/7f629a6b-f279-4140-a007-8742662bbaef.jpg" alt="Portrait of Lorenzo" />
            </div>
          </div>
        </Section>

        <Section id="projects" eyebrow="FILES" title="Projects">
          <div className="projects">
            {PROJECTS.map((p) => (
              <article className="card" key={p.index}>
                <span className="card__index">{p.index}</span>
                <h3 className="card__title">{p.title}</h3>
                <img className="card__img" src={p.img} alt={p.alt} loading="lazy" />
                <p className="card__desc">{p.desc}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="game" eyebrow="PLAYGROUND" title="Pick the Lock">
          <p className="game__intro">
            Click the dial when the needle crosses the bright arc. Every hit reverses the needle, and the arc shrinks
            as time runs out. Survive 30 seconds.
          </p>
          <LockGame />
        </Section>

        <Section id="contact" eyebrow="TRANSMIT" title="Contact Me">
          <div className="contact">
            <div className="contact__info">
              <p>Want to know me better? Email me directly or write a message here and it will open in your mail app.</p>
              <a className="btn btn--brass" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </div>
            <form className="form" onSubmit={handleSubmit}>
              <label className="form__label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="form__field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                minLength={2}
                autoComplete="name"
              />
              <label className="form__label" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                className="form__field form__field--area"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say hello…"
                rows={5}
                required
              />
              <button type="submit" className="btn btn--brass">
                Open in mail app
              </button>
            </form>
          </div>
        </Section>
      </main>

      <footer className="footer">
        <span>Built with React</span>
        <span>© {new Date().getFullYear()} Lorenzo Lubrico</span>
      </footer>
    </>
  )
}

export default App
