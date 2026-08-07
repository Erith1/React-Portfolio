import { useEffect, useRef, useState} from 'react'
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



const PROJECTS = [
  {
    index: 'PRJ—01',
    title: 'Final COPROG Project',
    // Add your image paths here:
    imgSrc: 'finalscoprog.png', 
    imgAlt: 'A preview of the Realtime Dashboard project',
    // The description will now sit below the image:
    desc: 'One of the hardest projects I have done during my 1st year college.',
  },
  {
    index: 'PRJ—02',
    title: 'OOPROG Abstraction',
    imgSrc: 'Abstraction.png',
    imgAlt: 'Design System Kit UI components',
    desc: 'We had to implement abstraction to hide hte internal details of how the code works and show only the resulting parts.',
    tags: ['typescript', 'storybook', 'tokens'],
    href: '#',
  },
  {
    index: 'PRJ—03',
    title: 'OOPROG Inheritance',
    imgSrc: 'Inheritance.png',
    imgAlt: 'Access Gateway network diagram',
    desc: 'We had to optimize our code by using functions and using said same functions on multiple parts of our code to avoid reiteration.',
    tags: ['node', 'redis', 'security'],
    href: '#',
  },
]

function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formStatus, setFormStatus] = useState('')
 const handleFormSubmit = (e: any) => {
    e.preventDefault(); 
    
    setFormStatus('Transmission sent successfully!');
    setName('');
    setEmail('');
    
    window.setTimeout(() => {
      setFormStatus('');
    }, 3000);
  }
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
            
            {/* The Framed Image */}
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
              <a 
                className="project-card" 
                href={p.href} 
                key={p.index}
                onClick={(e) => {
                  if (p.href === '#') e.preventDefault();
                }}
              >
                <span className="project-card__index">{p.index}</span>
                <h3 className="project-card__title">{p.title}</h3>
                
            
                <div className="project-card__media">
                  <img 
                    src={p.imgSrc} 
                    alt={p.imgAlt} 
                    className="project-card__img" 
                  />
                  <p className="project-card__desc">{p.desc}</p>
                </div>
                
                <div className="project-card__tags">

                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="contact" ref={contact.ref} className={`section${contact.visible ? ' section--visible' : ''}`}>
          <span className="section__eyebrow">TRANSMIT</span>
          <h2 className="section__heading">Contact Me</h2>
          
          <div className="contact__row">
            {/* Left side: Your existing prompt and email */}
            <div className="contact__info">
              <p className="contact__prompt">
                Want to know me better? Here's how. Leave your info or email me directly.
              </p>
              <div className="contact__actions" style={{ marginTop: '20px' }}>
                <a className="btn--brass" href="mailto:lorenzo_lubrico@dlsl.edu.ph">lorenzo_lubrico@dlsl.edu.ph</a>
              </div>
            </div>

            {/* Right side: The new form */}
            <form className="contact__form" onSubmit={handleFormSubmit}>
              <div className="input-group">
                <label htmlFor="name" className="input-label">Name*</label>
                <input 
                  type="text" 
                  id="name" 
                  className="input-field" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required 
                  minLength={2} 
                />
              </div>

              <div className="input-group">
                <label htmlFor="email" className="input-label">Gmail / Email*</label>
                <input 
                  type="email" 
                  id="email" 
                  className="input-field" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@gmail.com"
                  required 
                  /* Optional: If you strictly want ONLY gmail addresses, uncomment the line below */
                  /* pattern=".+@gmail\.com$" */
                  /* title="Please provide a valid @gmail.com address" */
                />
              </div>

              <button type="submit" className="btn--brass" style={{ marginTop: '8px' }}>
                Send Details
              </button>
              
              {/* Success Message */}
              {formStatus && <span className="contact__status">{formStatus}</span>}
            </form>
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
