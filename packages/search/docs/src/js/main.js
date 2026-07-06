const createHeroStats = () => {
  const stats = document.createElement('div')
  stats.className = 'hero-stats reveal-on-load'
  stats.innerHTML = `
    <div class="hero-stat"><strong>10</strong><span>Google verticals</span></div>
    <div class="hero-stat"><strong>~1s</strong><span>Typical latency</span></div>
    <div class="hero-stat hero-stat--serialization"><strong>HTML/MARKDOWN</strong><span>Output serialization</span></div>
  `
  return stats
}

const createVisualBadges = () => {
  const badges = document.createElement('div')
  badges.className = 'hero-badges'
  badges.innerHTML = `
    <div class="hero-badge top">10 products</div>
    <div class="hero-badge bottom">&lt;1s response</div>
  `
  return badges
}

const decorateHero = section => {
  const hero = section.querySelector('div[align="center"]')
  if (!hero || hero.dataset.enhanced === 'true') return

  hero.dataset.enhanced = 'true'
  hero.className = 'hero-block'

  const image = hero.querySelector('img')
  const summary = hero.querySelector('p')

  const copy = document.createElement('div')
  copy.className = 'hero-copy'

  const eyebrow = document.createElement('div')
  eyebrow.className = 'hero-eyebrow reveal-on-load'
  eyebrow.textContent = 'npm i @microlink/google'

  const title = document.createElement('h1')
  title.innerHTML = 'Structured <span>Google</span><br>API for LLMs.'
  title.className = 'reveal-on-load'

  copy.append(eyebrow, title)

  if (summary) {
    summary.classList.add('reveal-on-load')
    copy.append(summary)
  }

  const visual = document.createElement('div')
  visual.className = 'hero-visual reveal-on-load'
  visual.innerHTML = `
    <div class="browser-frame">
      <div class="browser-bar">
        <span class="browser-dots"><i></i><i></i><i></i></span>
        <span class="browser-url">https://search.microlink.io</span>
      </div>
      <div class="browser-screen"></div>
    </div>
  `

  if (image) {
    image.className = 'hero-banner'
    visual.querySelector('.browser-screen').append(image)
  }

  visual.append(createVisualBadges())

  hero.replaceChildren(copy, visual)
  hero.after(createHeroStats())
}

const decorateUseCases = section => {
  const useCasesHeading = [...section.querySelectorAll('h2')].find(
    node => node.textContent.trim().toLowerCase() === 'common llm use cases'
  )

  if (!useCasesHeading) return

  const intro = useCasesHeading.nextElementSibling
  const list = intro?.nextElementSibling
  if (!list || list.tagName !== 'UL' || list.dataset.enhanced === 'true') return

  list.dataset.enhanced = 'true'
  list.classList.add('use-case-grid')

  const variants = [
    'use-case-card--agentic',
    'use-case-card--rag',
    'use-case-card--news',
    'use-case-card--local'
  ]

  ;[...list.children].forEach((item, index) => {
    item.classList.add('use-case-card', 'reveal-on-load')
    if (variants[index]) item.classList.add(variants[index])

    const link = item.querySelector('a')
    if (link) {
      const title = link.textContent.trim()
      const description = item.textContent.replace(title, '').trim()
      const heading = document.createElement('strong')

      heading.textContent = title
      link.replaceChildren(heading)

      if (description) {
        const body = document.createElement('p')
        body.textContent = description
        link.append(body)
      }

      link.classList.add('use-case-link')
      item.replaceChildren(link)
    }
  })

  const heroStats = section.querySelector('.hero-stats')
  if (heroStats && !section.querySelector('.hero-use-cases')) {
    const heroUseCases = document.createElement('div')
    const heroIntro = document.createElement('p')

    heroUseCases.className = 'hero-use-cases reveal-on-load'
    heroIntro.className = 'hero-use-cases__intro'
    heroIntro.textContent =
      'Explore the most common LLM workflows and jump straight to the tutorial that matches your use case.'

    list.classList.add('hero-use-cases__grid')

    heroUseCases.append(heroIntro, list)
    heroStats.after(heroUseCases)
  }
}

const decorateCodeBlocks = section => {
  section.querySelectorAll('pre').forEach(pre => {
    if (pre.parentElement?.classList.contains('code-shell')) return
    const shell = document.createElement('div')
    const header = document.createElement('div')
    const code = pre.querySelector('code')
    const languageClass = [...(code?.classList || [])].find(value =>
      value.startsWith('language-')
    )
    shell.className = 'code-shell'
    header.className = 'code-shell__header'
    header.innerHTML = `
      <span class="code-shell__dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="code-shell__label">${
        languageClass ? languageClass.replace('language-', '') : 'code'
      }</span>
    `
    pre.parentNode.insertBefore(shell, pre)
    shell.append(header, pre)
  })
}

const decorateTables = section => {
  section.querySelectorAll('table').forEach(table => {
    if (table.parentElement?.classList.contains('table-shell')) return
    const shell = document.createElement('div')
    shell.className = 'table-shell'
    table.parentNode.insertBefore(shell, table)
    shell.append(table)
  })
}

const revealContent = section => {
  ;[...section.querySelectorAll('h2, h3')].forEach(node =>
    node.classList.add('reveal-on-load')
  )
}

const disableDocsifyDefaultScrollSpy = section => {
  section
    .querySelectorAll(':is(h1, h2, h3, h4, h5) > a.anchor[data-id]')
    .forEach(anchor => {
      anchor.classList.remove('anchor')
    })
}

let teardownNavigationTracking = () => {}

const decodeValue = value => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const extractSectionIdFromHref = href => {
  if (!href) return null

  const value = href.trim()
  const hashIndex = value.indexOf('#')
  const hash = hashIndex >= 0 ? value.slice(hashIndex + 1) : value

  if (!hash) return null

  const isRouteHash = hash.startsWith('/')
  const normalizedHash = isRouteHash ? hash.slice(1) : hash
  const [, query = ''] = normalizedHash.split('?')
  const idFromQuery = query ? new URLSearchParams(query).get('id') : null

  if (idFromQuery) return decodeValue(idFromQuery)
  if (isRouteHash) return null

  const [idCandidate = ''] = normalizedHash.split('?')
  return idCandidate ? decodeValue(idCandidate) : null
}

const setupNavigationTracking = section => {
  const sidebarNav = document.querySelector('.sidebar .sidebar-nav')
  if (!sidebarNav) return () => {}

  const navLinks = [...sidebarNav.querySelectorAll('a[href]')]
  const trackedLinks = navLinks
    .map(link => ({
      id: extractSectionIdFromHref(link.getAttribute('href')),
      link
    }))
    .filter(entry => entry.id)

  const trackedIds = new Set(trackedLinks.map(entry => entry.id))
  const headings = [...section.querySelectorAll('h2[id], h3[id]')]
  const headingsToTrack = headings.filter(heading => trackedIds.has(heading.id))
  const scopedHeadings = headingsToTrack.length > 0 ? headingsToTrack : headings
  const firstHeadingId = scopedHeadings[0]?.id || trackedLinks[0]?.id || null

  let activeId = null

  const setActiveLink = id => {
    navLinks.forEach(link => {
      link.classList.remove('active')
      link.classList.remove('is-active')
      link.removeAttribute('aria-current')
      link.closest('li')?.classList.remove('active')
      link.closest('li')?.classList.remove('is-active')
    })

    const targetId = id || firstHeadingId
    const activeLink =
      trackedLinks.find(entry => entry.id === targetId)?.link ||
      navLinks.find(link => link.closest('li')?.classList.contains('active')) ||
      navLinks[0]

    if (!activeLink) return

    activeLink.classList.add('active', 'is-active')
    activeLink.setAttribute('aria-current', 'location')
    const activeItem = activeLink.closest('li')

    activeItem?.classList.add('active', 'is-active')

    let parentItem = activeItem?.parentElement?.closest('li')
    while (parentItem) {
      parentItem.classList.add('active')
      parentItem = parentItem.parentElement?.closest('li')
    }

    activeId = extractSectionIdFromHref(activeLink.getAttribute('href'))
  }

  const getCurrentSectionId = () => {
    const triggerOffset = Math.max(8, window.innerHeight * 0.03)
    const threshold = window.scrollY + triggerOffset
    let currentSectionId = null

    for (const heading of scopedHeadings) {
      if (heading.offsetTop <= threshold) {
        currentSectionId = heading.id
        continue
      }
      break
    }

    return currentSectionId
  }

  let frameId = null

  const syncActiveLink = () => {
    frameId = null

    if (scopedHeadings.length === 0) {
      setActiveLink(null)
      return
    }

    const sectionId = getCurrentSectionId()
    const firstHeadingTop = scopedHeadings[0].offsetTop
    const nearTopThreshold = Math.max(8, window.innerHeight * 0.03)
    const isBeforeFirstHeading =
      window.scrollY + nearTopThreshold < firstHeadingTop

    if (isBeforeFirstHeading) {
      setActiveLink(firstHeadingId)
      return
    }

    if (sectionId) {
      setActiveLink(sectionId)
      return
    }

    if (!activeId) {
      setActiveLink(firstHeadingId)
    }
  }

  const requestSync = () => {
    if (frameId !== null) return
    frameId = window.requestAnimationFrame(syncActiveLink)
  }

  const handleNavClick = event => {
    const link = event.target.closest('a[href]')
    if (!link || !sidebarNav.contains(link)) return

    const sectionId = extractSectionIdFromHref(link.getAttribute('href'))
    if (sectionId) setActiveLink(sectionId)
  }

  sidebarNav.addEventListener('click', handleNavClick)
  window.addEventListener('scroll', requestSync, { passive: true })
  window.addEventListener('resize', requestSync)

  requestSync()
  window.setTimeout(requestSync, 140)

  return () => {
    sidebarNav.removeEventListener('click', handleNavClick)
    window.removeEventListener('scroll', requestSync)
    window.removeEventListener('resize', requestSync)
    if (frameId !== null) window.cancelAnimationFrame(frameId)
  }
}

const enhancePage = () => {
  teardownNavigationTracking()
  teardownNavigationTracking = () => {}

  const section = document.querySelector('.markdown-section')
  const content = document.querySelector('.content')
  const sidebar = document.querySelector('.sidebar')
  if (!section) return

  if (content) {
    content.id = 'main-content'
    content.setAttribute('role', 'main')
    content.setAttribute('tabindex', '-1')
  }

  if (sidebar) {
    sidebar.setAttribute('role', 'navigation')
    sidebar.setAttribute('aria-label', 'Primary navigation')
  }

  decorateHero(section)
  decorateUseCases(section)
  decorateCodeBlocks(section)
  decorateTables(section)
  revealContent(section)
  disableDocsifyDefaultScrollSpy(section)
  teardownNavigationTracking = setupNavigationTracking(section)
}

window.$docsify = {
  name: '@microlink/google',
  repo: 'microlinkhq/google',
  logo: '/static/banner.png',
  externalLinkRel: 'noopener noreferrer',
  subMaxLevel: 2,
  auto2top: true,
  maxLevel: 3,
  plugins: [
    hook => {
      hook.doneEach(() => {
        enhancePage()
        const appLink = document.querySelector('.app-name-link')
        if (appLink && !appLink.dataset.bound) {
          appLink.dataset.bound = 'true'
          appLink.onclick = event => {
            event.preventDefault()
            const shouldReduceMotion = window.matchMedia(
              '(prefers-reduced-motion: reduce)'
            ).matches
            window.scrollTo({
              top: 0,
              behavior: shouldReduceMotion ? 'auto' : 'smooth'
            })
          }
        }
      })
    }
  ]
}
